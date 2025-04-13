"""Image scanning and document processing utilities.

This module provides a set of functions for processing and scanning document images,
with a focus on perspective correction and document enhancement. It uses OpenCV
and NumPy for image processing operations.

The main functionality includes:
- Document scanning with perspective correction
- Image preprocessing (grayscale conversion, blur, edge detection)
- Contour detection and processing
- Perspective transformation
- Multiple output options (colored, grayscale, binary)

Example usage:
    >>> from imageScan import ScanDocument
    >>> # Scan a document with default settings
    >>> scanned_doc = ScanDocument("path/to/document.jpg")
    >>> # Scan with custom settings
    >>> scanned_doc = ScanDocument("path/to/document.jpg", 
    ...                           threshold1=50,
    ...                           threshold2=150,
    ...                           option=2)  # Binary output

Note:
    This module is designed to work with document images and assumes the presence
    of a quadrilateral document in the input image. The scanning process works best
    with clear document boundaries and good lighting conditions.
"""

import cv2
import numpy as np

def LoadImage(imagePath: str) -> np.ndarray:
    """Load an image from the specified path.

    Args:
        imagePath (str): Path to the image file.

    Returns:
        np.ndarray: Loaded image as a NumPy array.

    Raises:
        ValueError: If the image cannot be loaded from the specified path.
    """
    image = cv2.imread(imagePath)
    if image is None:
        raise ValueError(f"Image not found at path: {imagePath}")
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
    """Convert an image to grayscale.

    Args:
        image (np.ndarray): Input image in BGR format.

    Returns:
        np.ndarray: Grayscale image.
    """
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

def ApplyGaussianBlur(image: np.ndarray, kernel_size: int = 5, sigma: float = 0) -> np.ndarray:
    """Apply Gaussian blur to an image.

    Args:
        image (np.ndarray): Input image.
        kernel_size (int, optional): Size of the Gaussian kernel. Defaults to 5.
        sigma (float, optional): Standard deviation of the Gaussian kernel. Defaults to 0.

    Returns:
        np.ndarray: Blurred image.
    """
    return cv2.GaussianBlur(image, (kernel_size, kernel_size), sigma)

def ApplyCannyEdgeDetection(image: np.ndarray, threshold1: int, threshold2: int) -> np.ndarray:
    """Apply Canny edge detection to an image.

    Args:
        image (np.ndarray): Input image.
        threshold1 (int): First threshold for the hysteresis procedure.
        threshold2 (int): Second threshold for the hysteresis procedure.

    Returns:
        np.ndarray: Image with detected edges.
    """
    return cv2.Canny(image, threshold1, threshold2)

def ImageClosing(image: np.ndarray, kernel_size: int = 5, dil_iteration: int = 3, ero_iteration: int = 2) -> np.ndarray:
    """Apply morphological closing operation to an image.

    Args:
        image (np.ndarray): Input image.
        kernel_size (int, optional): Size of the kernel. Defaults to 5.
        dil_iteration (int, optional): Number of dilation iterations. Defaults to 3.
        ero_iteration (int, optional): Number of erosion iterations. Defaults to 2.

    Returns:
        np.ndarray: Processed image after closing operation.
    """
    kernel = np.ones((kernel_size, kernel_size))
    newImage = cv2.dilate(image, np.ones((5,5)), iterations=dil_iteration)
    newImage = cv2.erode(newImage, np.ones((5,5)), iterations=ero_iteration)
    return newImage

def contourCoordinateReordering(points: np.ndarray) -> np.ndarray:
    """Reorder contour points in a specific order.

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
    """Find the largest quadrilateral contour in an image.

    Args:
        image (np.ndarray): Input image with contours.

    Returns:
        np.ndarray: Points of the largest quadrilateral contour.
    """
    contours, _ = cv2.findContours(image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # deal with curves
    contours = [cv2.convexHull(contour) for contour in contours]
    biggestContour = np.array({})
    maxArea = 0
    for contour in contours:
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        epsilon = .1*perimeter
        approx = cv2.approxPolyDP(contour, epsilon, True)
        if area > maxArea and len(approx) == 4:
            biggestContour = approx
            maxArea = area
    biggestContour = contourCoordinateReordering(biggestContour)
    return biggestContour

def GetMMatrix(source: np.ndarray, destination: np.ndarray) -> np.ndarray:
    """Calculate the perspective transform matrix.

    Args:
        source (np.ndarray): Source points.
        destination (np.ndarray): Destination points.

    Returns:
        np.ndarray: Perspective transform matrix.
    """
    return cv2.getPerspectiveTransform(source, destination)

def WarpPerspective(image: np.ndarray, points: np.ndarray, width: int = 2590, height: int = 3340) -> np.ndarray:
    """Apply perspective transformation to an image.

    Args:
        image (np.ndarray): Input image.
        points (np.ndarray): Transformation points.
        width (int, optional): Output image width. Defaults to 2590.
        height (int, optional): Output image height. Defaults to 3340.

    Returns:
        np.ndarray: Transformed image.
    """
    return cv2.warpPerspective(image, points, (width, height))

def ScanDocument(imagePath: str, threshold1: int = 45, threshold2: int = 125, width: int = 2590, height: int = 3340, option: int = 0) -> np.ndarray:
    """Scan a document image and apply perspective correction.

    Args:
        imagePath (str): Path to the input image.
        threshold1 (int, optional): First threshold for Canny edge detection. Defaults to 45.
        threshold2 (int, optional): Second threshold for Canny edge detection. Defaults to 125.
        width (int, optional): Output image width. Defaults to 2590.
        height (int, optional): Output image height. Defaults to 3340.
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
    image = LoadImage(imagePath)
    grayImage = ConvertToGray(image)
    grayImageBlur = ApplyGaussianBlur(grayImage)
    grayImageEdges = ApplyCannyEdgeDetection(grayImageBlur, threshold1, threshold2)
    grayImageEdgesClosing = ImageClosing(grayImageEdges)
    bigContour = BiggestContour(grayImageEdgesClosing)
    mMatrix = GetMMatrix(np.float32(bigContour), np.float32([ [0, 0], [width, 0], [width, height], [0,height] ]))
    
    # colored
    if option == 0:
        paper = WarpPerspective(image, mMatrix, width, height)
        return paper
    
    # grayscaled
    elif option == 1:
        paper = WarpPerspective(grayImage, mMatrix, width, height)
        return paper
    
    # binary
    elif option == 2:
        paper = WarpPerspective(grayImage, mMatrix, width, height)
        denoisedImage = cv2.medianBlur(paper, 3)
        blurredDenoisedImage = ApplyGaussianBlur(denoisedImage)
        brightness = 3
        blockSize = 13
        binary = cv2.adaptiveThreshold(blurredDenoisedImage, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, blockSize, brightness)
        return binary