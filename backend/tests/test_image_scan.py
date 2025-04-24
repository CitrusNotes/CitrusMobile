"""Test suite for the image scanning functionality.

This module contains unit tests for the image scanning and
processing functionality in the CitrusNotes application.
It tests various image processing operations including:
- Image loading and conversion
- Edge detection and contour processing
- Document scanning and perspective correction
- PDF generation from multiple images

The tests use mock objects to simulate database operations and
ensure that the image processing pipeline works correctly without
requiring actual database access.
"""

import asyncio
import base64
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

import cv2
import numpy as np

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

# pylint: disable=wrong-import-position
from app.database import fs  # noqa: E402
from app.utils.image_scan import apply_canny_edge_detection  # noqa: E402
from app.utils.image_scan import apply_gaussian_blur  # noqa: E402
from app.utils.image_scan import biggest_contour  # noqa: E402
from app.utils.image_scan import contour_coordinate_reordering  # noqa: E402
from app.utils.image_scan import convert_to_gray  # noqa: E402
from app.utils.image_scan import get_m_matrix  # noqa: E402
from app.utils.image_scan import image_closing  # noqa: E402
from app.utils.image_scan import load_image_from_data  # noqa: E402
from app.utils.image_scan import process_images_into_pdf  # noqa: E402
from app.utils.image_scan import scan_document  # noqa: E402
from app.utils.image_scan import warp_perspective  # noqa: E402


class TestImageScan(unittest.TestCase):
    """Test suite for image scanning functionality.

    This test suite verifies the functionality of the image scanning module,
    including image processing, document scanning, and PDF generation.
    Tests cover both individual image processing functions and the complete
    document scanning pipeline.
    """

    def __init__(self, *args, **kwargs):
        """Initialize test attributes."""
        super().__init__(*args, **kwargs)
        self.last_uploaded_data = b""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures that will be used by all test methods"""
        # Create a test image (white square on black background)
        cls.sample_image = np.zeros((100, 100, 3), dtype=np.uint8)
        cls.sample_image[25:75, 25:75] = 255

        # Convert np array to bytes
        _, img_bytes = cv2.imencode(".jpg", cls.sample_image)
        cls.sample_image_bytes = img_bytes.tobytes()

        # Create a test user ID
        cls.t_user = "67f7454e9f6072baae1702c1"

        # Load test images from data folder in the format of
        # base64 encoded strings.
        # (like the ones in the database and api calls)
        cls.test_images = []
        test_data_dir = os.path.join(os.path.dirname(__file__), "data")
        print(f"Looking for images in: {test_data_dir}")
        for img_file in os.listdir(test_data_dir):
            if img_file.lower().endswith((".jpg", ".jpeg", ".png")):
                img_path = os.path.join(test_data_dir, img_file)
                print(f"Found image: {img_file}")
                with open(img_path, "rb") as f:
                    img_data = f.read()
                    base64_img = base64.b64encode(img_data).decode("utf-8")
                    cls.test_images.append(base64_img)

        # Debug print the loaded images
        print(f"Loaded {len(cls.test_images)} test images")

        # Create testResults directory if it doesn't exist
        results_dir = os.path.join(os.path.dirname(__file__), "testResults")
        cls.test_results_dir = results_dir
        os.makedirs(results_dir, exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests"""
        # Remove temporary folder and files created during tests
        if os.path.exists("temp"):
            for file in os.listdir("temp"):
                os.remove(os.path.join("temp", file))
            os.rmdir("temp")

    def setUp(self):
        """Set up mock operations for GridFS operations"""

        # Simulate the upload of a file to GridFS
        async def mock_upload_coroutine(filename, source, metadata=None):
            # Store the uploaded data for later use
            self.last_uploaded_data = source
            return "mock_gridfs_id"

        self.mock_upload = MagicMock(side_effect=mock_upload_coroutine)

        # Simulate the download of a file from GridFS
        async def mock_download_coroutine(file_id):
            # Return the last uploaded data
            return self.last_uploaded_data

        self.mock_download = MagicMock(side_effect=mock_download_coroutine)

        # Simulate the insertion of a file into the file system collection
        async def mock_insert_coroutine(_document):
            return MagicMock(inserted_id="mock_file_id")

        self.mock_insert = MagicMock(side_effect=mock_insert_coroutine)

        # Patch the GridFS operations
        command1 = "app.database.fs.upload_from_stream"
        command2 = "app.database.fs.download_to_stream"
        command3 = "app.database.file_system.insert_one"
        self.patcher1 = patch(command1, self.mock_upload)
        self.patcher2 = patch(command2, self.mock_download)
        self.patcher3 = patch(command3, self.mock_insert)

        self.patcher1.start()
        self.patcher2.start()
        self.patcher3.start()

    def tearDown(self):
        """Clean up mock operations"""
        self.patcher1.stop()
        self.patcher2.stop()
        self.patcher3.stop()

    def test_load_image_from_data(self):
        """Test loading an image from bytes data"""
        # Load the image from the bytes data
        result = load_image_from_data(self.sample_image_bytes)
        # Check if the result is a numpy array
        self.assertIsInstance(result, np.ndarray)
        self.assertEqual(result.shape[2], 3)  # Should be a color image

    def test_convert_to_gray(self):
        """Test grayscale conversion"""
        gray = convert_to_gray(self.sample_image)
        self.assertIsInstance(gray, np.ndarray)
        self.assertEqual(len(gray.shape), 2)  # Should be grayscale (2D)
        self.assertEqual(gray.dtype, np.uint8)

    def test_apply_gaussian_blur(self):
        """Test Gaussian blur application"""
        blurred = apply_gaussian_blur(self.sample_image)
        self.assertIsInstance(blurred, np.ndarray)
        self.assertEqual(blurred.shape, self.sample_image.shape)

    def test_apply_canny_edge_detection(self):
        """Test Canny edge detection"""
        edges = apply_canny_edge_detection(self.sample_image, 100, 200)
        self.assertIsInstance(edges, np.ndarray)
        self.assertEqual(len(edges.shape), 2)  # Should be grayscale (2D)
        self.assertEqual(edges.dtype, np.uint8)

    def test_image_closing(self):
        """Test morphological closing operation"""
        closed = image_closing(self.sample_image)
        self.assertIsInstance(closed, np.ndarray)
        self.assertEqual(closed.shape, self.sample_image.shape)

    def test_contour_coordinate_reordering(self):
        """Test contour point reordering"""
        # Create a test rectangle (contour)
        # bottom-right, top-left, top-right, bottom-left
        points = np.array([[20, 20], [10, 10], [20, 10], [10, 20]])
        points = points.reshape(4, 1, 2)

        # Reorder the points
        points = contour_coordinate_reordering(points)
        self.assertIsInstance(points, np.ndarray)
        self.assertEqual(points.shape, (4, 1, 2))

        # Check if the points are reordered
        # top-left, top-right, bottom-right, bottom-left
        expected = np.array([[10, 10], [20, 10], [20, 20], [10, 20]])
        expected = expected.reshape(4, 1, 2)
        np.testing.assert_array_equal(points, expected)

    def test_biggest_contour(self):
        """Test finding the biggest contour"""
        # Convert to grayscale and find edges
        gray = convert_to_gray(self.sample_image)
        edges = apply_canny_edge_detection(gray, 100, 200)
        closed = image_closing(edges)

        contour = biggest_contour(closed)
        self.assertIsInstance(contour, np.ndarray)

    def test_get_m_matrix(self):
        """Test perspective transform matrix calculation"""
        source = np.float32([[0, 0], [100, 0], [100, 100], [0, 100]])
        destination = np.float32([[0, 0], [200, 0], [200, 200], [0, 200]])

        matrix = get_m_matrix(source, destination)
        self.assertIsInstance(matrix, np.ndarray)
        self.assertEqual(matrix.shape, (3, 3))

    def test_warp_perspective(self):
        """Test perspective warping"""
        # Create a simple transform matrix
        source = np.float32([[0, 0], [100, 0], [100, 100], [0, 100]])
        destination = np.float32([[0, 0], [200, 0], [200, 200], [0, 200]])
        matrix = get_m_matrix(source, destination)

        warped = warp_perspective(self.sample_image, matrix, 200, 200)
        self.assertIsInstance(warped, np.ndarray)
        self.assertEqual(warped.shape[:2], (200, 200))  # Check dimensions

    def test_scan_document(self):
        """Test document scanning with different options"""
        # Test with colored
        result0 = scan_document(self.sample_image, option=0)
        self.assertIsInstance(result0, np.ndarray)

        # Test with grayscale
        result1 = scan_document(self.sample_image, option=1)
        self.assertIsInstance(result1, np.ndarray)
        self.assertEqual(len(result1.shape), 2)  # Should be grayscale

        # Test with binary
        result2 = scan_document(self.sample_image, option=2)
        self.assertIsInstance(result2, np.ndarray)
        self.assertEqual(len(result2.shape), 2)  # Should be grayscale
        self.assertTrue(
            np.all(np.logical_or(result2 == 0, result2 == 255))
        )  # Should be binary

    def test_process_images_into_pdf_single_image(self):
        """Test PDF creation with a single image"""
        if not self.test_images:
            self.skipTest("No test images found in data directory")

        # Create a new event loop for this test
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Process single image
            result = loop.run_until_complete(
                process_images_into_pdf(
                    image_list=[self.test_images[0]],
                    output_filename="testSingle.pdf",
                    user_id=self.t_user,
                )
            )
            self.assertIsInstance(result, str)
            self.assertTrue(len(result) > 0)  # Should return a valid ID

            # Save pdf to testResults directory
            pdf_name = "test_process_images_into_pdf_single_image.pdf"
            output_path = os.path.join(self.test_results_dir, pdf_name)
            # Download the pdf using the same loop
            pdf_data = loop.run_until_complete(fs.download_to_stream(result))
            with open(output_path, "wb") as f:
                f.write(pdf_data)
        except Exception as e:
            print(f"Error in single image test: {str(e)}")
            raise
        finally:
            # Properly close the event loop
            loop.stop()
            loop.close()
            asyncio.set_event_loop(None)

    def test_process_images_into_pdf_multiple_images(self):
        """Test PDF creation with multiple images"""
        if not self.test_images:
            self.skipTest("No test images found in data directory")

        # Create a new event loop for this test
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Process all available images
            result = loop.run_until_complete(
                process_images_into_pdf(
                    image_list=self.test_images,
                    output_filename="test_multiple.pdf",
                    user_id=self.t_user,
                )
            )
            self.assertIsInstance(result, str)
            self.assertTrue(len(result) > 0)  # Should return a valid ID

            # Save pdf to testResults directory
            pdf_name = "test_process_images_into_pdf_multiple_images.pdf"
            output_path = os.path.join(self.test_results_dir, pdf_name)
            # Download the pdf using the same loop
            pdf_data = loop.run_until_complete(fs.download_to_stream(result))
            with open(output_path, "wb") as f:
                f.write(pdf_data)
        except Exception as e:
            print(f"Error in multiple images test: {str(e)}")
            raise
        finally:
            # Properly close the event loop
            loop.stop()
            loop.close()
            asyncio.set_event_loop(None)

    def test_process_images_into_pdf_invalid_input(self):
        """Test PDF creation with invalid input"""
        # Create a new event loop for this test
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Test with empty image list
            with self.assertRaises(ValueError):
                pdf_name = "test_empty.pdf"
                loop.run_until_complete(
                    process_images_into_pdf([], pdf_name, self.t_user)
                )

            # Test with invalid base64 string
            with self.assertRaises(ValueError):
                p = "test_invalid.pdf"
                loop.run_until_complete(
                    process_images_into_pdf(["invalid_base64"], p, self.t_user)
                )
        finally:
            # Properly close the event loop
            loop.stop()
            loop.close()
            asyncio.set_event_loop(None)


if __name__ == "__main__":
    unittest.main()
