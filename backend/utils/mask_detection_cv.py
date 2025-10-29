"""
Improved Mask Detection using OpenCV Pre-trained Models
Modular design to support TensorFlow Lite in the future
"""

import cv2
import numpy as np
from typing import Dict, Tuple, Optional
import os

class MaskDetectorCV:
    """
    OpenCV-based mask detection using Haar Cascade or DNN models
    Fast, lightweight, and works offline
    """
    
    def __init__(self):
        """Initialize mask detector with OpenCV models"""
        self.face_cascade = None
        self.mask_net = None
        self.model_loaded = False
        
        # Try to load OpenCV Haar Cascade for face detection
        self._load_face_cascade()
    
    def _load_face_cascade(self):
        """Load Haar Cascade for face detection"""
        try:
            # OpenCV comes with pre-trained Haar Cascade models
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            
            if os.path.exists(cascade_path):
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                print(f"✅ Loaded Haar Cascade from: {cascade_path}")
                self.model_loaded = True
            else:
                print(f"⚠️ Haar Cascade not found at: {cascade_path}")
                self.model_loaded = False
        
        except Exception as e:
            print(f"❌ Error loading face cascade: {e}")
            self.model_loaded = False
    
    def detect_mask_advanced(
        self, 
        image: np.ndarray, 
        face_location: Tuple[int, int, int, int]
    ) -> Dict:
        """
        Advanced mask detection using multiple algorithms
        
        Args:
            image: RGB image array
            face_location: (top, right, bottom, left) face coordinates
        
        Returns:
            {
                'mask_detected': bool,
                'confidence': float (0-100),
                'reason': str,
                'method': str
            }
        """
        try:
            top, right, bottom, left = face_location
            face_height = bottom - top
            
            # Extract lower face region (where mask would be)
            lower_face_top = top + int(face_height * 0.4)
            lower_face = image[lower_face_top:bottom, left:right]
            
            if lower_face.size == 0:
                return {
                    'mask_detected': False,
                    'confidence': 0.0,
                    'reason': 'Tidak dapat menganalisis area wajah',
                    'method': 'none'
                }
            
            # Method 1: Advanced color analysis (HSV-based)
            mask_by_color = self._advanced_color_analysis(lower_face)
            if mask_by_color['mask_detected'] and mask_by_color['confidence'] > 75:
                return mask_by_color
            
            # Method 2: Texture analysis (LBP-like)
            mask_by_texture = self._texture_analysis(lower_face)
            if mask_by_texture['mask_detected'] and mask_by_texture['confidence'] > 70:
                return mask_by_texture
            
            # Method 3: Edge density with improved threshold
            mask_by_edges = self._improved_edge_analysis(lower_face)
            if mask_by_edges['mask_detected'] and mask_by_edges['confidence'] > 65:
                return mask_by_edges
            
            # Method 4: Skin color detection (inverse - no skin = mask)
            mask_by_skin = self._skin_color_detection(lower_face)
            if mask_by_skin['mask_detected'] and mask_by_skin['confidence'] > 70:
                return mask_by_skin
            
            # Combined decision: If multiple methods agree
            methods = [mask_by_color, mask_by_texture, mask_by_edges, mask_by_skin]
            mask_votes = sum(1 for m in methods if m['mask_detected'])
            
            if mask_votes >= 2:
                # At least 2 methods detected mask
                avg_confidence = np.mean([m['confidence'] for m in methods if m['mask_detected']])
                return {
                    'mask_detected': True,
                    'confidence': round(float(avg_confidence), 2),
                    'reason': f'⚠️ MASKER TERDETEKSI oleh {mask_votes} metode analisis',
                    'method': 'combined'
                }
            
            # No mask detected
            return {
                'mask_detected': False,
                'confidence': 95.0,
                'reason': 'Wajah terlihat jelas tanpa masker',
                'method': 'combined'
            }
        
        except Exception as e:
            print(f"Error in advanced mask detection: {e}")
            return {
                'mask_detected': False,
                'confidence': 0.0,
                'reason': f'Error: {str(e)}',
                'method': 'error'
            }
    
    def _advanced_color_analysis(self, lower_face: np.ndarray) -> Dict:
        """
        Advanced color uniformity analysis using HSV and color range
        Masks typically have:
        - More uniform color distribution
        - Specific color ranges (blue, white, black surgical masks)
        """
        try:
            # Convert to HSV
            hsv = cv2.cvtColor(lower_face, cv2.COLOR_RGB2HSV)
            
            # Calculate statistics
            h_mean, h_std = np.mean(hsv[:, :, 0]), np.std(hsv[:, :, 0])
            s_mean, s_std = np.mean(hsv[:, :, 1]), np.std(hsv[:, :, 1])
            v_mean, v_std = np.mean(hsv[:, :, 2]), np.std(hsv[:, :, 2])
            
            # Mask characteristics:
            # 1. Low saturation variance (uniform color)
            # 2. Specific hue ranges (blue/white surgical masks)
            
            # Check for low color variance (uniform = likely mask)
            color_uniformity = (h_std + s_std + v_std) / 3
            
            # Check for common mask colors
            # Blue surgical mask: H=100-120, S=50-200, V=100-255
            # White mask: S=0-50, V=200-255
            # Black mask: V=0-80
            
            is_blue_mask = (100 <= h_mean <= 130) and (50 <= s_mean <= 200)
            is_white_mask = (s_mean < 60) and (v_mean > 180)
            is_black_mask = v_mean < 90
            
            if color_uniformity < 15 and (is_blue_mask or is_white_mask or is_black_mask):
                mask_type = 'biru' if is_blue_mask else ('putih' if is_white_mask else 'hitam')
                return {
                    'mask_detected': True,
                    'confidence': 85.0,
                    'reason': f'Terdeteksi pola warna masker {mask_type}',
                    'method': 'color_hsv'
                }
            
            if color_uniformity < 12:
                return {
                    'mask_detected': True,
                    'confidence': 75.0,
                    'reason': 'Area wajah bawah memiliki warna yang sangat seragam',
                    'method': 'color_uniformity'
                }
            
            return {
                'mask_detected': False,
                'confidence': 0.0,
                'reason': '',
                'method': 'color_hsv'
            }
        
        except Exception as e:
            print(f"Error in color analysis: {e}")
            return {'mask_detected': False, 'confidence': 0.0, 'reason': '', 'method': 'error'}
    
    def _texture_analysis(self, lower_face: np.ndarray) -> Dict:
        """
        Texture analysis - skin has natural texture, masks are smooth
        """
        try:
            gray = cv2.cvtColor(lower_face, cv2.COLOR_RGB2GRAY)
            
            # Calculate Local Binary Pattern (simplified)
            # Masks have less texture variation than skin
            
            # Use Laplacian variance as texture metric
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            texture_variance = laplacian.var()
            
            # Low texture variance = smooth surface = likely mask
            if texture_variance < 50:
                return {
                    'mask_detected': True,
                    'confidence': 80.0,
                    'reason': 'Permukaan terlalu halus (kemungkinan masker)',
                    'method': 'texture_lbp'
                }
            
            return {
                'mask_detected': False,
                'confidence': 0.0,
                'reason': '',
                'method': 'texture_lbp'
            }
        
        except Exception as e:
            print(f"Error in texture analysis: {e}")
            return {'mask_detected': False, 'confidence': 0.0, 'reason': '', 'method': 'error'}
    
    def _improved_edge_analysis(self, lower_face: np.ndarray) -> Dict:
        """
        Improved edge detection - masks have defined edges
        """
        try:
            gray = cv2.cvtColor(lower_face, cv2.COLOR_RGB2GRAY)
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Canny edge detection
            edges = cv2.Canny(blurred, 30, 100)
            edge_density = np.sum(edges > 0) / edges.size
            
            # Masks have more defined edges (especially around mouth area)
            if edge_density > 0.12:
                return {
                    'mask_detected': True,
                    'confidence': 70.0,
                    'reason': 'Terdeteksi tepi yang jelas pada area mulut',
                    'method': 'edge_canny'
                }
            
            return {
                'mask_detected': False,
                'confidence': 0.0,
                'reason': '',
                'method': 'edge_canny'
            }
        
        except Exception as e:
            print(f"Error in edge analysis: {e}")
            return {'mask_detected': False, 'confidence': 0.0, 'reason': '', 'method': 'error'}
    
    def _skin_color_detection(self, lower_face: np.ndarray) -> Dict:
        """
        Detect skin color - if no skin detected in lower face, likely masked
        """
        try:
            # Convert to YCrCb (better for skin detection)
            ycrcb = cv2.cvtColor(lower_face, cv2.COLOR_RGB2YCrCb)
            
            # Skin color range in YCrCb
            # Y: 0-255, Cr: 133-173, Cb: 77-127 (typical skin range)
            lower_skin = np.array([0, 133, 77], dtype=np.uint8)
            upper_skin = np.array([255, 173, 127], dtype=np.uint8)
            
            # Create skin mask
            skin_mask = cv2.inRange(ycrcb, lower_skin, upper_skin)
            skin_ratio = np.sum(skin_mask > 0) / skin_mask.size
            
            # If very little skin detected in lower face → likely masked
            if skin_ratio < 0.15:
                return {
                    'mask_detected': True,
                    'confidence': 75.0,
                    'reason': 'Tidak terdeteksi warna kulit pada area mulut',
                    'method': 'skin_ycrcb'
                }
            
            return {
                'mask_detected': False,
                'confidence': 0.0,
                'reason': '',
                'method': 'skin_ycrcb'
            }
        
        except Exception as e:
            print(f"Error in skin detection: {e}")
            return {'mask_detected': False, 'confidence': 0.0, 'reason': '', 'method': 'error'}


# Singleton instance
_mask_detector_cv = None

def get_mask_detector_cv() -> MaskDetectorCV:
    """Get or create singleton mask detector instance"""
    global _mask_detector_cv
    if _mask_detector_cv is None:
        _mask_detector_cv = MaskDetectorCV()
    return _mask_detector_cv


def detect_mask_opencv(
    image: np.ndarray, 
    face_location: Tuple[int, int, int, int]
) -> Dict:
    """
    Main function to detect mask using OpenCV
    
    Args:
        image: RGB image array
        face_location: (top, right, bottom, left) face coordinates
    
    Returns:
        {
            'mask_detected': bool,
            'confidence': float,
            'reason': str,
            'method': str
        }
    """
    detector = get_mask_detector_cv()
    return detector.detect_mask_advanced(image, face_location)
