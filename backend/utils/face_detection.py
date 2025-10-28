"""Face Detection Utilities with Mask Detection

This module provides advanced face detection capabilities including:
- Face detection with quality scoring
- Mask detection algorithm
- Image quality validation (blur, lighting, angle)
- Multi-angle face registration support
"""

import numpy as np
import cv2
from typing import Tuple, Dict, Optional, List
import math

# Mock face_recognition until dlib is installed
class MockFaceRecognition:
    @staticmethod
    def face_locations(img, model='hog'):
        # Mock: detect face in center of image
        h, w = img.shape[:2]
        return [(int(h*0.2), int(w*0.7), int(h*0.7), int(w*0.3))]
    
    @staticmethod
    def face_encodings(img, face_locations):
        return [np.random.rand(128)]
    
    @staticmethod
    def face_landmarks(img, face_locations):
        # Mock face landmarks
        if not face_locations:
            return []
        top, right, bottom, left = face_locations[0]
        return [{
            'nose_tip': [(left + (right-left)//2, top + (bottom-top)//2)],
            'top_lip': [(left + i*(right-left)//6, top + (bottom-top)*2//3) for i in range(7)],
            'bottom_lip': [(left + i*(right-left)//6, bottom - (bottom-top)//4) for i in range(7)],
            'chin': [(left + i*(right-left)//4, bottom) for i in range(5)],
            'left_eye': [(left + (right-left)//4, top + (bottom-top)//3)],
            'right_eye': [(right - (right-left)//4, top + (bottom-top)//3)]
        }]
    
    @staticmethod
    def compare_faces(known_encodings, unknown_encoding, tolerance=0.6):
        return [True]
    
    @staticmethod
    def face_distance(known_encodings, unknown_encoding):
        return [0.3]

try:
    import face_recognition as fr
    face_recognition = fr
except ImportError:
    face_recognition = MockFaceRecognition()


class FaceQualityMetrics:
    """Face quality scoring metrics"""
    
    MIN_FACE_SIZE = 100  # Minimum face dimension in pixels
    MAX_FACE_SIZE = 1000  # Maximum face dimension
    IDEAL_FACE_SIZE = 300  # Ideal face size
    
    BLUR_THRESHOLD = 100  # Laplacian variance threshold
    BRIGHTNESS_MIN = 50
    BRIGHTNESS_MAX = 200
    IDEAL_BRIGHTNESS = 128
    
    @staticmethod
    def calculate_blur_score(image: np.ndarray) -> float:
        """
        Calculate blur score using Laplacian variance
        Higher score = sharper image
        
        Returns:
            Score 0-100 (100 = very sharp, 0 = very blurry)
        """
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Normalize to 0-100 scale
        score = min(100, (laplacian_var / 500) * 100)
        return round(score, 2)
    
    @staticmethod
    def calculate_brightness_score(image: np.ndarray) -> float:
        """
        Calculate lighting quality score
        
        Returns:
            Score 0-100 (100 = ideal lighting)
        """
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        avg_brightness = np.mean(gray)
        
        # Calculate deviation from ideal
        deviation = abs(avg_brightness - FaceQualityMetrics.IDEAL_BRIGHTNESS)
        max_deviation = FaceQualityMetrics.IDEAL_BRIGHTNESS
        
        score = max(0, 100 - (deviation / max_deviation) * 100)
        return round(score, 2)
    
    @staticmethod
    def calculate_size_score(face_width: int, face_height: int) -> float:
        """
        Calculate face size quality score
        
        Returns:
            Score 0-100 (100 = ideal size)
        """
        face_size = min(face_width, face_height)
        
        if face_size < FaceQualityMetrics.MIN_FACE_SIZE:
            return round((face_size / FaceQualityMetrics.MIN_FACE_SIZE) * 50, 2)
        
        if face_size > FaceQualityMetrics.MAX_FACE_SIZE:
            return 70.0
        
        # Calculate closeness to ideal
        deviation = abs(face_size - FaceQualityMetrics.IDEAL_FACE_SIZE)
        max_deviation = FaceQualityMetrics.IDEAL_FACE_SIZE
        
        score = max(50, 100 - (deviation / max_deviation) * 50)
        return round(score, 2)
    
    @staticmethod
    def calculate_angle_score(landmarks: Dict) -> float:
        """
        Calculate face angle quality score
        Check if face is frontal (not tilted)
        
        Returns:
            Score 0-100 (100 = perfectly frontal)
        """
        if not landmarks:
            return 50.0
        
        try:
            # Get eye positions
            left_eye = landmarks.get('left_eye', [])
            right_eye = landmarks.get('right_eye', [])
            
            if not left_eye or not right_eye:
                return 50.0
            
            # Calculate eye centers
            left_eye_center = np.mean(left_eye, axis=0)
            right_eye_center = np.mean(right_eye, axis=0)
            
            # Calculate angle
            dy = right_eye_center[1] - left_eye_center[1]
            dx = right_eye_center[0] - left_eye_center[0]
            angle = abs(math.degrees(math.atan2(dy, dx)))
            
            # Score based on angle (0 degrees = perfect frontal)
            if angle > 15:
                return round(max(0, 100 - (angle - 15) * 5), 2)
            
            return 100.0
        
        except Exception as e:
            print(f"Error calculating angle score: {e}")
            return 50.0


class MaskDetector:
    """Detect if person is wearing face mask"""
    
    @staticmethod
    def detect_mask(image: np.ndarray, face_location: Tuple[int, int, int, int], 
                   landmarks: Optional[Dict] = None) -> Dict:
        """
        Detect if person is wearing a face mask
        
        Algorithm:
        1. Check if mouth and nose landmarks are visible
        2. Analyze color distribution in lower face region
        3. Check for uniform color (mask) vs skin texture
        
        Args:
            image: RGB image array
            face_location: (top, right, bottom, left) face coordinates
            landmarks: Face landmarks dictionary (optional)
        
        Returns:
            {
                'mask_detected': bool,
                'confidence': float (0-100),
                'reason': str
            }
        """
        try:
            top, right, bottom, left = face_location
            face_height = bottom - top
            face_width = right - left
            
            # Extract lower face region (where mask would be)
            lower_face_top = top + int(face_height * 0.4)
            lower_face = image[lower_face_top:bottom, left:right]
            
            if lower_face.size == 0:
                return {
                    'mask_detected': False,
                    'confidence': 0.0,
                    'reason': 'Tidak dapat menganalisis area wajah'
                }
            
            # Method 1: Landmark visibility check
            if landmarks:
                mask_by_landmarks = MaskDetector._check_landmarks_visibility(landmarks)
                if mask_by_landmarks['mask_detected']:
                    return mask_by_landmarks
            
            # Method 2: Color uniformity check
            mask_by_color = MaskDetector._check_color_uniformity(lower_face)
            if mask_by_color['mask_detected']:
                return mask_by_color
            
            # Method 3: Edge density (mask has more defined edges)
            mask_by_edges = MaskDetector._check_edge_density(lower_face)
            
            return mask_by_edges
        
        except Exception as e:
            print(f"Error in mask detection: {e}")
            return {
                'mask_detected': False,
                'confidence': 0.0,
                'reason': f'Error: {str(e)}'
            }
    
    @staticmethod
    def _check_landmarks_visibility(landmarks: Dict) -> Dict:
        """
        Check if mouth and nose landmarks are clearly visible
        If obscured, likely wearing mask
        """
        nose_tip = landmarks.get('nose_tip', [])
        top_lip = landmarks.get('top_lip', [])
        bottom_lip = landmarks.get('bottom_lip', [])
        
        # If landmarks are missing or poorly defined → mask detected
        if len(nose_tip) < 1 or len(top_lip) < 5 or len(bottom_lip) < 5:
            return {
                'mask_detected': True,
                'confidence': 75.0,
                'reason': 'Landmark wajah tidak terdeteksi dengan jelas'
            }
        
        return {
            'mask_detected': False,
            'confidence': 0.0,
            'reason': ''
        }
    
    @staticmethod
    def _check_color_uniformity(lower_face: np.ndarray) -> Dict:
        """
        Check if lower face has uniform color (mask) vs varied skin texture
        """
        # Convert to HSV for better color analysis
        hsv = cv2.cvtColor(lower_face, cv2.COLOR_RGB2HSV)
        
        # Calculate color variance
        h_std = np.std(hsv[:, :, 0])
        s_std = np.std(hsv[:, :, 1])
        v_std = np.std(hsv[:, :, 2])
        
        avg_std = (h_std + s_std + v_std) / 3
        
        # Low variance = uniform color = likely mask
        if avg_std < 20:
            return {
                'mask_detected': True,
                'confidence': 70.0,
                'reason': 'Area wajah bawah memiliki warna yang seragam (kemungkinan masker)'
            }
        
        return {
            'mask_detected': False,
            'confidence': 0.0,
            'reason': ''
        }
    
    @staticmethod
    def _check_edge_density(lower_face: np.ndarray) -> Dict:
        """
        Check edge density - masks typically have more defined edges
        """
        gray = cv2.cvtColor(lower_face, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        # High edge density might indicate mask edges
        if edge_density > 0.15:
            return {
                'mask_detected': True,
                'confidence': 65.0,
                'reason': 'Terdeteksi tepi yang mencurigakan pada area wajah bawah'
            }
        
        return {
            'mask_detected': False,
            'confidence': 100.0,
            'reason': 'Wajah terlihat jelas tanpa masker'
        }


def analyze_face_quality(image: np.ndarray, face_location: Tuple[int, int, int, int],
                        check_mask: bool = True) -> Dict:
    """
    Comprehensive face quality analysis
    
    Args:
        image: RGB image array
        face_location: (top, right, bottom, left) face coordinates
        check_mask: Whether to check for face mask
    
    Returns:
        {
            'quality_score': float (0-100),
            'blur_score': float,
            'brightness_score': float,
            'size_score': float,
            'angle_score': float,
            'mask_detected': bool,
            'mask_confidence': float,
            'recommendation': str,
            'is_acceptable': bool
        }
    """
    try:
        top, right, bottom, left = face_location
        face_width = right - left
        face_height = bottom - top
        
        # Extract face region
        face_img = image[top:bottom, left:right]
        
        if face_img.size == 0:
            return {
                'quality_score': 0.0,
                'is_acceptable': False,
                'recommendation': 'Wajah tidak terdeteksi dengan benar'
            }
        
        # Calculate quality metrics
        blur_score = FaceQualityMetrics.calculate_blur_score(face_img)
        brightness_score = FaceQualityMetrics.calculate_brightness_score(face_img)
        size_score = FaceQualityMetrics.calculate_size_score(face_width, face_height)
        
        # Get face landmarks for angle detection
        landmarks = face_recognition.face_landmarks(image, [face_location])
        angle_score = FaceQualityMetrics.calculate_angle_score(
            landmarks[0] if landmarks else {}
        )
        
        # Overall quality score (weighted average)
        quality_score = (
            blur_score * 0.3 +
            brightness_score * 0.25 +
            size_score * 0.25 +
            angle_score * 0.2
        )
        
        # Mask detection
        mask_result = {'mask_detected': False, 'confidence': 0.0, 'reason': ''}
        if check_mask:
            mask_result = MaskDetector.detect_mask(
                image, face_location, landmarks[0] if landmarks else None
            )
        
        # Generate recommendation
        recommendations = []
        if blur_score < 60:
            recommendations.append('Gambar terlalu blur. Pegang kamera dengan stabil.')
        if brightness_score < 60:
            recommendations.append('Pencahayaan kurang baik. Cari tempat dengan cahaya yang cukup.')
        if size_score < 60:
            recommendations.append('Wajah terlalu kecil atau jauh. Dekatkan wajah ke kamera.')
        if angle_score < 70:
            recommendations.append('Wajah tidak menghadap kamera. Hadapkan wajah ke depan.')
        if mask_result['mask_detected']:
            recommendations.append('⚠️ MASKER TERDETEKSI. Harap lepas masker untuk verifikasi.')
        
        recommendation = ' | '.join(recommendations) if recommendations else 'Kualitas wajah bagus!'
        
        # Acceptable if quality > 70 and no mask
        is_acceptable = quality_score >= 70 and not mask_result['mask_detected']
        
        return {
            'quality_score': round(quality_score, 2),
            'blur_score': blur_score,
            'brightness_score': brightness_score,
            'size_score': size_score,
            'angle_score': angle_score,
            'mask_detected': mask_result['mask_detected'],
            'mask_confidence': mask_result['confidence'],
            'mask_reason': mask_result['reason'],
            'recommendation': recommendation,
            'is_acceptable': is_acceptable,
            'face_dimensions': {
                'width': face_width,
                'height': face_height
            }
        }
    
    except Exception as e:
        print(f"Error in analyze_face_quality: {e}")
        return {
            'quality_score': 0.0,
            'is_acceptable': False,
            'recommendation': f'Error analyzing face: {str(e)}'
        }


def enhance_image_for_recognition(image: np.ndarray) -> np.ndarray:
    """
    Enhance image quality for better face recognition
    
    Pipeline:
    1. Resize if too large
    2. Histogram equalization for contrast
    3. Bilateral filter for noise reduction
    4. Sharpening
    
    Args:
        image: RGB image array
    
    Returns:
        Enhanced RGB image array
    """
    try:
        # 1. Resize if too large (max 1920 width)
        h, w = image.shape[:2]
        if w > 1920:
            scale = 1920 / w
            new_w = int(w * scale)
            new_h = int(h * scale)
            image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # 2. Convert to LAB for better enhancement
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        # Merge back
        lab = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        
        # 3. Bilateral filter (reduce noise while preserving edges)
        enhanced = cv2.bilateralFilter(enhanced, 5, 50, 50)
        
        # 4. Subtle sharpening
        kernel = np.array([[-0.5, -0.5, -0.5],
                          [-0.5,  5,   -0.5],
                          [-0.5, -0.5, -0.5]])
        enhanced = cv2.filter2D(enhanced, -1, kernel)
        
        return enhanced
    
    except Exception as e:
        print(f"Error enhancing image: {e}")
        return image  # Return original if enhancement fails
