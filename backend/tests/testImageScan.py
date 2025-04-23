import asyncio
import base64
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

import cv2
import numpy as np
from app.database import fs
from app.utils.imageScan import (ApplyCannyEdgeDetection, ApplyGaussianBlur,
                                 BiggestContour, ConvertToGray, GetMMatrix,
                                 ImageClosing, ProcessImagesIntoPDF,
                                 ScanDocument, WarpPerspective,
                                 contourCoordinateReordering,
                                 load_image_from_data)

"""
This file is used to test the imageScan module.
It is a unit test that tests all the functions in the imageScan module.
This file also uses mock objects to test the imageScan module without
actually connecting to the database.
might have to move the last 2 imports below the backend_dir variable
declaration and sys.path.insert(0, backend_dir) to avoid import errors.
(Linter doesn't like it)
"""

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)


class TestImageScan(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures that will be used by all test methods"""
        # Create a test image (white square on black background)
        cls.sampleImage = np.zeros((100, 100, 3), dtype=np.uint8)
        cls.sampleImage[25:75, 25:75] = 255

        # Convert np array to bytes
        _, imgBytes = cv2.imencode(".jpg", cls.sampleImage)
        cls.sampleImageBytes = imgBytes.tobytes()

        # Create a test user ID
        cls.testUser = "67f7454e9f6072baae1702c1"

        # Load test images from data folder in the format of
        # base64 encoded strings.
        # (like the ones in the database and api calls)
        cls.testImages = []
        testDataDir = os.path.join(os.path.dirname(__file__), "data")
        print(f"Looking for images in: {testDataDir}")
        for imgFile in os.listdir(testDataDir):
            if imgFile.lower().endswith((".jpg", ".jpeg", ".png")):
                imgPath = os.path.join(testDataDir, imgFile)
                print(f"Found image: {imgFile}")
                with open(imgPath, "rb") as f:
                    imgData = f.read()
                    base64Img = base64.b64encode(imgData).decode("utf-8")
                    cls.testImages.append(base64Img)

        # Debug print the loaded images
        print(f"Loaded {len(cls.testImages)} test images")

        # Create testResults directory if it doesn't exist
        trd = os.path.join(os.path.dirname(__file__), "testResults")
        cls.test_results_dir = trd
        os.makedirs(trd, exist_ok=True)

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
        async def mockUploadCoroutine(*args, **kwargs):
            # Store the uploaded data for later use
            self.last_uploaded_data = kwargs.get("source", b"")
            return "mock_gridfs_id"

        self.mock_upload = MagicMock(side_effect=mockUploadCoroutine)

        # Simulate the download of a file from GridFS
        async def mockDownloadCoroutine(*args, **kwargs):
            # Return the last uploaded data
            return self.last_uploaded_data

        self.mock_download = MagicMock(side_effect=mockDownloadCoroutine)

        # Simulate the insertion of a file into the file system collection
        async def mockInsertCoroutine(*args, **kwargs):
            return MagicMock(inserted_id="mock_file_id")

        self.mock_insert = MagicMock(side_effect=mockInsertCoroutine)

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
        result = load_image_from_data(self.sampleImageBytes)
        # Check if the result is a numpy array
        self.assertIsInstance(result, np.ndarray)
        self.assertEqual(result.shape[2], 3)  # Should be a color image

    def test_ConvertToGray(self):
        """Test grayscale conversion"""
        gray = ConvertToGray(self.sampleImage)
        self.assertIsInstance(gray, np.ndarray)
        self.assertEqual(len(gray.shape), 2)  # Should be grayscale (2D)
        self.assertEqual(gray.dtype, np.uint8)

    def test_ApplyGaussianBlur(self):
        """Test Gaussian blur application"""
        blurred = ApplyGaussianBlur(self.sampleImage)
        self.assertIsInstance(blurred, np.ndarray)
        self.assertEqual(blurred.shape, self.sampleImage.shape)

    def test_ApplyCannyEdgeDetection(self):
        """Test Canny edge detection"""
        edges = ApplyCannyEdgeDetection(self.sampleImage, 100, 200)
        self.assertIsInstance(edges, np.ndarray)
        self.assertEqual(len(edges.shape), 2)  # Should be grayscale (2D)
        self.assertEqual(edges.dtype, np.uint8)

    def test_ImageClosing(self):
        """Test morphological closing operation"""
        closed = ImageClosing(self.sampleImage)
        self.assertIsInstance(closed, np.ndarray)
        self.assertEqual(closed.shape, self.sampleImage.shape)

    def test_contourCoordinateReordering(self):
        """Test contour point reordering"""
        # Create a test rectangle (contour)
        # bottom-right, top-left, top-right, bottom-left
        points = np.array([[20, 20], [10, 10], [20, 10], [10, 20]])
        points = points.reshape(4, 1, 2)

        # Reorder the points
        points = contourCoordinateReordering(points)
        self.assertIsInstance(points, np.ndarray)
        self.assertEqual(points.shape, (4, 1, 2))

        # Check if the points are reordered
        # top-left, top-right, bottom-right, bottom-left
        expected = np.array([[10, 10], [20, 10], [20, 20], [10, 20]])
        expected = expected.reshape(4, 1, 2)
        np.testing.assert_array_equal(points, expected)

    def test_BiggestContour(self):
        """Test finding the biggest contour"""
        # Convert to grayscale and find edges
        gray = ConvertToGray(self.sampleImage)
        edges = ApplyCannyEdgeDetection(gray, 100, 200)
        closed = ImageClosing(edges)

        contour = BiggestContour(closed)
        self.assertIsInstance(contour, np.ndarray)

    def test_GetMMatrix(self):
        """Test perspective transform matrix calculation"""
        source = np.float32([[0, 0], [100, 0], [100, 100], [0, 100]])
        destination = np.float32([[0, 0], [200, 0], [200, 200], [0, 200]])

        matrix = GetMMatrix(source, destination)
        self.assertIsInstance(matrix, np.ndarray)
        self.assertEqual(matrix.shape, (3, 3))

    def test_WarpPerspective(self):
        """Test perspective warping"""
        # Create a simple transform matrix
        source = np.float32([[0, 0], [100, 0], [100, 100], [0, 100]])
        destination = np.float32([[0, 0], [200, 0], [200, 200], [0, 200]])
        matrix = GetMMatrix(source, destination)

        warped = WarpPerspective(self.sampleImage, matrix, 200, 200)
        self.assertIsInstance(warped, np.ndarray)
        self.assertEqual(warped.shape[:2], (200, 200))  # Check dimensions

    def test_ScanDocument(self):
        """Test document scanning with different options"""
        # Test with colored
        result0 = ScanDocument(self.sampleImage, option=0)
        self.assertIsInstance(result0, np.ndarray)

        # Test with grayscale
        result1 = ScanDocument(self.sampleImage, option=1)
        self.assertIsInstance(result1, np.ndarray)
        self.assertEqual(len(result1.shape), 2)  # Should be grayscale

        # Test with binary
        result2 = ScanDocument(self.sampleImage, option=2)
        self.assertIsInstance(result2, np.ndarray)
        self.assertEqual(len(result2.shape), 2)  # Should be grayscale
        self.assertTrue(
            np.all(np.logical_or(result2 == 0, result2 == 255))
        )  # Should be binary

    def test_ProcessImagesIntoPDF_single_image(self):
        """Test PDF creation with a single image"""
        if not self.testImages:
            self.skipTest("No test images found in data directory")

        # Create a new event loop for this test
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Process single image
            result = loop.run_until_complete(
                ProcessImagesIntoPDF(
                    [self.testImages[0]], "testSingle.pdf", self.testUser
                )
            )
            self.assertIsInstance(result, str)
            self.assertTrue(len(result) > 0)  # Should return a valid ID

            # Save pdf to testResults directory
            pdfName = "test_ProcessImagesIntoPDF_single_image.pdf"
            outputPath = os.path.join(self.test_results_dir, pdfName)
            # Download the pdf using the same loop
            pdfData = loop.run_until_complete(fs.download_to_stream(result))
            with open(outputPath, "wb") as f:
                f.write(pdfData)
        except Exception as e:
            print(f"Error in single image test: {str(e)}")
            raise

        finally:
            # close the loop
            loop.stop()
            loop.close()
            asyncio.set_event_loop(None)

    def test_ProcessImagesIntoPDF_multiple_images(self):
        """Test PDF creation with multiple images"""
        if not self.testImages:
            self.skipTest("No test images found in data directory")

        # Create a new event loop for this test
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Process all available images
            # linter doesn't like full name
            p = "test_multiple.pdf"
            result = loop.run_until_complete(
                ProcessImagesIntoPDF(self.testImages, p, self.testUser)
            )
            self.assertIsInstance(result, str)
            self.assertTrue(len(result) > 0)  # Should return a valid ID

            # Save pdf to testResults directory
            pdfName = "test_ProcessImagesIntoPDF_multiple_images.pdf"
            outputPath = os.path.join(self.test_results_dir, pdfName)
            # Download the pdf using the same loop
            pdfData = loop.run_until_complete(fs.download_to_stream(result))
            with open(outputPath, "wb") as f:
                f.write(pdfData)
        except Exception as e:
            print(f"Error in multiple images test: {str(e)}")
            raise

        finally:
            # close the loop
            loop.stop()
            loop.close()
            asyncio.set_event_loop(None)

    def test_ProcessImagesIntoPDF_invalid_input(self):
        """Test PDF creation with invalid input"""
        # Create a new event loop for this test
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Test with empty image list
            with self.assertRaises(ValueError):
                pdfName = "test_empty.pdf"
                loop.run_until_complete(
                    ProcessImagesIntoPDF([], pdfName, self.testUser)
                )

            # Test with invalid base64 string
            with self.assertRaises(ValueError):
                # linter doesn't like full name
                p = "test_invalid.pdf"
                loop.run_until_complete(
                    ProcessImagesIntoPDF(["invalid_base64"], p, self.testUser)
                )
        finally:
            # close the loop
            loop.stop()
            loop.close()
            asyncio.set_event_loop(None)


if __name__ == "__main__":
    unittest.main()
