"""Image Processing Utilities for OCR and Enhancement

Provides image preprocessing, enhancement, and OCR utilities.
"""

import numpy as np
import cv2
from typing import Tuple, Optional, Dict
from PIL import Image
import io


class ImageEnhancer:
    """Image enhancement for OCR and general purposes"""
    
    @staticmethod
    def auto_enhance(image: np.ndarray) -> np.ndarray:
        """
        Automatic image enhancement with brightness, contrast, and sharpness
        
        Args:
            image: RGB or grayscale image array
        
        Returns:
            Enhanced image array
        """
        try:
            # Convert to LAB color space
            if len(image.shape) == 3:
                lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            else:
                # Grayscale - convert to RGB first
                rgb = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
                lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
            
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE to L channel
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            
            # Merge channels
            lab = cv2.merge([l, a, b])
            
            # Convert back to RGB
            enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            
            # Sharpening
            kernel = np.array([[0, -1, 0],
                             [-1, 5, -1],
                             [0, -1, 0]])
            enhanced = cv2.filter2D(enhanced, -1, kernel)
            
            return enhanced
        
        except Exception as e:
            print(f"Error in auto_enhance: {e}")
            return image
    
    @staticmethod
    def preprocess_for_ocr(image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for optimal OCR results
        
        Steps:
        1. Grayscale conversion
        2. Noise removal
        3. Thresholding (binarization)
        4. Deskewing
        
        Args:
            image: RGB or grayscale image array
        
        Returns:
            Preprocessed binary image
        """
        try:
            # Convert to grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            else:
                gray = image
            
            # Noise removal
            denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
            
            # Adaptive thresholding
            binary = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Deskew
            coords = np.column_stack(np.where(binary > 0))
            if len(coords) > 0:
                angle = cv2.minAreaRect(coords)[-1]
                if angle < -45:
                    angle = -(90 + angle)
                else:
                    angle = -angle
                
                # Rotate image
                (h, w) = binary.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                binary = cv2.warpAffine(
                    binary, M, (w, h),
                    flags=cv2.INTER_CUBIC,
                    borderMode=cv2.BORDER_REPLICATE
                )
            
            return binary
        
        except Exception as e:
            print(f"Error in preprocess_for_ocr: {e}")
            return image
    
    @staticmethod
    def adjust_brightness_contrast(image: np.ndarray, brightness: int = 0, 
                                  contrast: int = 0) -> np.ndarray:
        """
        Manually adjust brightness and contrast
        
        Args:
            image: RGB image array
            brightness: -100 to 100
            contrast: -100 to 100
        
        Returns:
            Adjusted image
        """
        try:
            # Brightness adjustment
            if brightness != 0:
                if brightness > 0:
                    shadow = brightness
                    highlight = 255
                else:
                    shadow = 0
                    highlight = 255 + brightness
                alpha_b = (highlight - shadow) / 255
                gamma_b = shadow
                image = cv2.addWeighted(image, alpha_b, image, 0, gamma_b)
            
            # Contrast adjustment
            if contrast != 0:
                alpha_c = float(131 * (contrast + 127)) / (127 * (131 - contrast))
                gamma_c = 127 * (1 - alpha_c)
                image = cv2.addWeighted(image, alpha_c, image, 0, gamma_c)
            
            return image
        
        except Exception as e:
            print(f"Error in adjust_brightness_contrast: {e}")
            return image
    
    @staticmethod
    def compress_image(image: Image.Image, quality: int = 85, 
                      max_size: Tuple[int, int] = (1920, 1080)) -> bytes:
        """
        Compress image for storage/transmission
        
        Args:
            image: PIL Image object
            quality: JPEG quality 1-100
            max_size: Maximum (width, height)
        
        Returns:
            Compressed image bytes
        """
        try:
            # Resize if larger than max_size
            image.thumbnail(max_size, Image.LANCZOS)
            
            # Convert to RGB if needed
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            
            # Compress
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            return output.getvalue()
        
        except Exception as e:
            print(f"Error in compress_image: {e}")
            return b''


class OCRProcessor:
    """OCR processing utilities"""
    
    # TODO: Install tesseract and pytesseract for OCR functionality
    
    @staticmethod
    def extract_text(image: np.ndarray, lang: str = 'ind+eng') -> Dict:
        """
        Extract text from image using OCR
        
        Args:
            image: RGB or grayscale image array
            lang: Tesseract language code ('ind' for Indonesian, 'eng' for English)
        
        Returns:
            {
                'text': str,
                'confidence': float,
                'details': list of word-level details
            }
        """
        # Mock implementation until tesseract is installed
        return {
            'text': '[OCR not installed yet - tesseract required]',
            'confidence': 0.0,
            'details': [],
            'error': 'Tesseract OCR not installed'
        }
    
    @staticmethod
    def extract_structured_data(image: np.ndarray, document_type: str) -> Dict:
        """
        Extract structured data from specific document types
        
        Args:
            image: Image array
            document_type: 'ktp', 'npwp', 'surat', 'invoice', etc.
        
        Returns:
            Structured data dictionary based on document type
        """
        # Mock implementation
        return {
            'document_type': document_type,
            'extracted_data': {},
            'confidence': 0.0,
            'error': 'OCR not installed yet'
        }


def validate_image_for_ocr(image: np.ndarray) -> Tuple[bool, str]:
    """
    Validate if image is suitable for OCR
    
    Args:
        image: Image array
    
    Returns:
        (is_valid, error_message)
    """
    try:
        # Check image size
        if image.size == 0:
            return False, 'Gambar kosong'
        
        h, w = image.shape[:2]
        
        # Minimum size
        if w < 200 or h < 200:
            return False, 'Gambar terlalu kecil (minimum 200x200 pixels)'
        
        # Maximum size
        if w > 10000 or h > 10000:
            return False, 'Gambar terlalu besar (maksimum 10000x10000 pixels)'
        
        # Check if mostly blank
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY) if len(image.shape) == 3 else image
        mean_intensity = np.mean(gray)
        
        if mean_intensity < 10 or mean_intensity > 245:
            return False, 'Gambar terlalu gelap atau terlalu terang'
        
        return True, ''
    
    except Exception as e:
        return False, f'Error validating image: {str(e)}'
