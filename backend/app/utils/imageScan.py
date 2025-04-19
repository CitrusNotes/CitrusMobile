"""Image scanning and document processing utilities.

This module provides a set of functions for processing and scanning documents,
with a focus on perspective correction and document enhancement. It uses OpenCV
and NumPy for image processing operations.

The main functionality includes:
- Document scanning with perspective correction
- Image preprocessing (grayscale conversion, blur, edge detection)
- Contour detection and processing
- Perspective transformation
- Multiple output options (colored, grayscale, binary)

Example usage:
    >>> from imageScan import ScanDocument, ProcessImagesIntoPDF
    >>> # Scan a document with default settings
    >>> scanned_doc = ScanDocument(image_data)
    >>> # Process multiple images into PDF
    >>> pdf_path = ProcessImagesIntoPDF(image_list, "output.pdf")

Note:
    This module is designed to work with documents and assumes the presence
    of a 4 point contour in the input image. The scanning process
    works best with clear document boundaries and good lighting conditions.
"""

import base64
import logging
import os
from datetime import datetime
from typing import List, Union

import cv2
import img2pdf
import numpy as np
from bson import ObjectId

from ..database import file_system, fs

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def load_image_from_data(image_data: bytes) -> np.ndarray:
    """Load an image from bytes data.

    Args:
        image_data (bytes): Image data in bytes format.

    Returns:
        np.ndarray: Loaded image as a NumPy array.

    Raises:
        ValueError: If the image data cannot be loaded.
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        # Decode the image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Failed to decode image data")
        return image
    except Exception as e:
        raise ValueError(f"Error loading image data: {str(e)}")


def load_image(image_path: str) -> np.ndarray:
    """Load an image from the specified path.

    Args:
        image_path (str): Path to the image file.

    Returns:
        np.ndarray: Loaded image as a NumPy array.

    Raises:
        ValueError: If the image cannot be loaded from the specified path.
    """
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Image not found at path: {image_path}")
    return image


def ShowImage(image: np.ndarray, title: str = "Image") -> None:
    """Display an image in a window.

    Args:
        image (np.ndarray): Image to display.
        title (str, optional): Window title. Defaults to "Image".
    """
    cv2.imshow(title, image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


def ConvertToGray(image: np.ndarray) -> np.ndarray:
    """Convert an image to grayscale. Created for readability.

    Args:
        image (np.ndarray): Input image in BGR format.

    Returns:
        np.ndarray: Grayscale image.
    """
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def ApplyGaussianBlur(
    image: np.ndarray, kernel_size: int = 5, sigma: float = 0
) -> np.ndarray:
    """Apply Gaussian blur to an image. Created for readability.

    Args:
        image (np.ndarray): Input image.
        kernel_size (int, optional): Size of the Gaussian kernel.
        sigma (float, optional): Standard deviation of the Gaussian kernel.

    Returns:
        np.ndarray: Blurred image.
    """
    return cv2.GaussianBlur(image, (kernel_size, kernel_size), sigma)


def ApplyCannyEdgeDetection(
    image: np.ndarray, threshold1: int, threshold2: int
) -> np.ndarray:
    """Apply Canny edge detection to an image. Created for readability.

    Args:
        image (np.ndarray): Input image.
        threshold1 (int): First threshold for the hysteresis procedure.
        threshold2 (int): Second threshold for the hysteresis procedure.

    Returns:
        np.ndarray: Image with detected edges.
    """
    return cv2.Canny(image, threshold1, threshold2)


def ImageClosing(
    image: np.ndarray,
    kernel_size: int = 5,
    dil_iteration: int = 3,
    ero_iteration: int = 2,
) -> np.ndarray:
    """Apply morphological closing to an image. Created for readability.

    Args:
        image (np.ndarray): Input image.
        kernel_size (int, optional): Size of the kernel.
        dil_iteration (int, optional): Number of dilation iterations.
        ero_iteration (int, optional): Number of erosion iterations.

    Returns:
        np.ndarray: Processed image after closing operation.
    """
    kernel = np.ones((kernel_size, kernel_size))
    newImage = cv2.dilate(image, kernel, iterations=dil_iteration)
    newImage = cv2.erode(newImage, kernel, iterations=ero_iteration)
    return newImage


def contourCoordinateReordering(points: np.ndarray) -> np.ndarray:
    """Reorder contour points in a specific order. Created for readability.

    Reorders points to top-left, top-right, bottom-right, bottom-left order.

    Args:
        points (np.ndarray): Array of contour points.

    Returns:
        np.ndarray: Reordered points in the format (4, 1, 2).
    """
    points = points.reshape(4, 2)

    orderedPoints = np.zeros((4, 2), dtype=np.float32)
    summ = points.sum(axis=1)
    diff = np.diff(points, axis=1)

    orderedPoints[0] = points[np.argmin(summ)]
    orderedPoints[1] = points[np.argmin(diff)]
    orderedPoints[2] = points[np.argmax(summ)]
    orderedPoints[3] = points[np.argmax(diff)]
    orderedPoints = orderedPoints.reshape((4, 1, 2))
    return orderedPoints


def BiggestContour(image: np.ndarray) -> np.ndarray:
    """Find the largest 4 point contour in an image. Created for readability.

    Args:
        image (np.ndarray): Input image with contours.

    Returns:
        np.ndarray: Points of the largest 4 point contour.
    """
    countourInputs = (image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours, _ = cv2.findContours(*countourInputs)

    # deal with curves
    contours = [cv2.convexHull(contour) for contour in contours]
    biggestContour = np.array({})
    maxArea = 0
    for contour in contours:
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        epsilon = 0.1 * perimeter
        approx = cv2.approxPolyDP(contour, epsilon, True)
        if area > maxArea and len(approx) == 4:
            biggestContour = approx
            maxArea = area
    biggestContour = contourCoordinateReordering(biggestContour)
    return biggestContour


def GetMMatrix(source: np.ndarray, destination: np.ndarray) -> np.ndarray:
    """Calculate the perspective transform matrix. Created for readability.

    Args:
        source (np.ndarray): Source points.
        destination (np.ndarray): Destination points.

    Returns:
        np.ndarray: Perspective transform matrix.
    """
    return cv2.getPerspectiveTransform(source, destination)


def WarpPerspective(
    image: np.ndarray, points: np.ndarray, w: int = 2590, h: int = 3340
) -> np.ndarray:
    """Apply perspective transformation to an image. Created for readability.

    Args:
        image (np.ndarray): Input image.
        points (np.ndarray): Transformation points.
        w (int, optional): Output image width. Defaults to 2590.
        h (int, optional): Output image height. Defaults to 3340.

    Returns:
        np.ndarray: Transformed image.
    """
    return cv2.warpPerspective(image, points, (w, h))


def ScanDocument(
    image_input: Union[str, bytes, np.ndarray],
    thres1: int = 45,
    thres2: int = 125,
    width: int = 2590,
    height: int = 3340,
    option: int = 0,
) -> np.ndarray:
    """Scan a document image and apply perspective correction.

    Args:
        image_input: Can be one of:
            - str: Path to the input image
            - bytes: Raw image data
            - np.ndarray: Already loaded image array
        thres1 (int, optional): Threshold1 for Edge detection.
        thres2 (int, optional): Threshold2 for Edge detection.
        width (int, optional): Output image width.
        height (int, optional): Output image height.
        option (int, optional): Processing option:
            0: Colored output
            1: Grayscale output
            2: Binary output
            Defaults to 0.

    Returns:
        np.ndarray: Processed and transformed image.

    Raises:
        ValueError: If the input image cannot be loaded.
    """
    try:
        if isinstance(image_input, str):
            image = load_image(image_input)
        elif isinstance(image_input, bytes):
            image = load_image_from_data(image_input)
        elif isinstance(image_input, np.ndarray):
            image = image_input
        else:
            raise ValueError("Invalid image input type")

        grayImage = ConvertToGray(image)
        grayImageBlur = ApplyGaussianBlur(grayImage)
        grayImageEdges = ApplyCannyEdgeDetection(grayImageBlur, thres1, thres2)
        grayImageEdgesClosing = ImageClosing(grayImageEdges)
        bigContour = BiggestContour(grayImageEdgesClosing)
        mMatrix = GetMMatrix(
            np.float32(bigContour),
            np.float32([[0, 0], [width, 0], [width, height], [0, height]]),
        )

        if option == 0:
            paper = WarpPerspective(image, mMatrix, width, height)
        elif option == 1:
            paper = WarpPerspective(grayImage, mMatrix, width, height)
        else:  # option == 2
            paper = WarpPerspective(grayImage, mMatrix, width, height)
            denoisedImage = cv2.medianBlur(paper, 3)
            blurredDenoisedImage = ApplyGaussianBlur(denoisedImage)
            brightness = 3
            blockSize = 13
            binary = cv2.adaptiveThreshold(
                blurredDenoisedImage,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                blockSize,
                brightness,
            )
            paper = binary
        return paper

    except Exception as e:
        raise ValueError(f"Error processing image: {str(e)}")


def LoadImageFromBase64(base64_string: str) -> np.ndarray:
    """Load an image from a base64 string.

    Args:
        base64_string (str): Base64 encoded image data

    Returns:
        np.ndarray: Loaded image as a NumPy array

    Raises:
        ValueError: If the image data cannot be loaded
    """
    try:
        # Decode base64 string to bytes
        img_data = base64.b64decode(base64_string)

        # Convert to numpy array
        nparr = np.frombuffer(img_data, np.uint8)

        # Decode image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Failed to decode image data")
        return image
    except Exception as e:
        raise ValueError(f"Error loading image data: {str(e)}")


async def ProcessImagesIntoPDF(
    image_list: List[str], output_filename: str, user_id: str
) -> str:
    """Process multiple images and combine them into a PDF file.

    Args:
        image_list (List[str]): List of base64 encoded image strings
        output_filename (str): Name for the output PDF file
        user_id (str): ID of the user creating the PDF

    Returns:
        str: Path to the generated PDF file

    Raises:
        ValueError: If processing fails
    """
    processed_images = []
    try:
        logger.debug(f"Starting PDF generation for user {user_id}")
        logger.debug(f"Number of images to process: {len(image_list)}")

        # Create temp directory if it doesn't exist
        os.makedirs("temp", exist_ok=True)
        logger.debug("Created temp directory")

        # Process each image and save as individual files
        for idx, base64_img in enumerate(image_list):
            try:
                logger.debug(f"Processing image {idx + 1}")
                # Load and scan the image
                img_data = LoadImageFromBase64(base64_img)
                logger.debug(f"Image {idx + 1} loaded from base64")

                processed_img = ScanDocument(img_data, option=2)
                logger.debug(f"Image {idx + 1} processed")

                # Save processed image as temporary file
                t_img_path = f"temp/{user_id}_temp_{idx}.jpg"
                success = cv2.imwrite(
                    t_img_path, processed_img, [cv2.IMWRITE_JPEG_QUALITY, 95]
                )
                if not success:
                    raise ValueError(f"Failed to save temp. image {idx + 1}")

                processed_images.append(t_img_path)
                logger.debug(f"Image {idx + 1} saved to {t_img_path}")
            except Exception as e:
                logger.error(f"Error processing image {idx + 1}: {str(e)}")
                raise

        if not processed_images:
            raise ValueError("No images were successfully processed")

        # Create PDF path
        temp_pdf_path = f"temp/{user_id}_{output_filename}"
        logger.debug(f"Attempting to create PDF at {temp_pdf_path}")

        # Convert images to PDF using img2pdf
        try:
            # First verify all images exist and are readable
            for img_path in processed_images:
                if not os.path.exists(img_path):
                    raise ValueError(f"Image file not found: {img_path}")
                with open(img_path, "rb") as img_file:
                    # Try to read the first byte to verify file is readable
                    img_file.read(1)

            # Now create the PDF
            with open(temp_pdf_path, "wb") as f:
                f.write(img2pdf.convert(processed_images))
            logger.debug("PDF created successfully")

            # Read the generated PDF
            with open(temp_pdf_path, "rb") as pdf_file:
                pdf_data = pdf_file.read()

            # Save to GridFS using async operation
            logger.debug("Saving PDF to GridFS")
            grid_out = await fs.upload_from_stream(
                filename=output_filename,
                source=pdf_data,
                metadata={"content_type": "application/pdf"},
            )

            # Create file system entry
            file_item = {
                "name": output_filename,
                "is_folder": False,
                "gridfs_id": grid_out,
                "parent_id": None,  # Save to root directory
                "tags": ["scanned"],
                "user_id": ObjectId(user_id),
                "is_starred": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "content_type": "application/pdf",
            }

            # Insert into file system collection
            logger.debug("Creating file system entry")
            result = await file_system.insert_one(file_item)
            logger.debug("Created with ID:" + str(result.inserted_id))

        except Exception as e:
            logger.error(f"Error during PDF creation: {str(e)}")
            raise ValueError(f"Failed to create PDF: {str(e)}")

        # Clean up temporary files
        for temp_file in processed_images:
            try:
                os.remove(temp_file)
                logger.debug(f"Cleaned up temporary file: {temp_file}")
            except Exception as e:
                logger.warning(
                    f"Failed to clean up temporary file {temp_file}: {str(e)}"
                )

        try:
            os.remove(temp_pdf_path)
            logger.debug("Cleaned up temporary PDF file")
        except Exception as e:
            logger.warning(f"Failed to clean up temporary PDF file: {str(e)}")

        logger.debug("PDF generation completed successfully")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error in ProcessImagesIntoPDF: {str(e)}")
        # Clean up any temporary files in case of error
        for temp_file in processed_images:
            try:
                os.remove(temp_file)
            except Exception as e:
                logger.warning(
                    f"Failed to clean up temporary file {temp_file}: {str(e)}"
                )
        raise ValueError(f"Error creating PDF: {str(e)}")
