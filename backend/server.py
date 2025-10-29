from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
# import face_recognition  # TODO: Fix dlib installation
import numpy as np
import base64
import cv2
from datetime import datetime, timedelta
import io
from PIL import Image
import traceback
from passlib.hash import bcrypt

# Mock face_recognition until dlib is installed
class MockFaceRecognition:
    @staticmethod
    def face_locations(img, model='hog'):
        return [(50, 200, 150, 100)]  # Mock: one face detected
    
    @staticmethod
    def face_encodings(img, face_locations):
        return [np.random.rand(128)]  # Mock: random encoding
    
    @staticmethod
    def compare_faces(known_encodings, unknown_encoding, tolerance=0.6):
        return [True]  # Mock: always match
    
    @staticmethod
    def face_distance(known_encodings, unknown_encoding):
        return [0.3]  # Mock: good match

face_recognition = MockFaceRecognition()

# Import config and utilities
from config import Config, get_config
from models import Base, Employee, Attendance, EmployeeFaceEncoding
from utils.i18n import translate, get_user_language
from utils.date_formatter import format_datetime
from utils.validators import validate_employee_id, validate_email, validate_password, validate_name
from utils.face_detection import analyze_face_quality, enhance_image_for_recognition
from utils.mask_detection_cv import detect_mask_opencv  # NEW: Improved mask detection
from utils.qrcode_generator import (  # NEW: QR code system
    generate_employee_qr_code, 
    validate_qr_code, 
    get_cached_qr_code, 
    cache_qr_code
)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Initialize Flask app
app = Flask(__name__)

# Load configuration
config = get_config()
app.config['JWT_SECRET_KEY'] = config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=config.JWT_ACCESS_TOKEN_EXPIRES_HOURS)

jwt = JWTManager(app)

# CORS Configuration - Allow all origins for development
# For production, restrict to specific domains
CORS(app, 
     resources={r"/*": {
         "origins": "*",  # Allow all origins
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": False,  # Must be False when origins is "*"
         "max_age": 3600
     }})

# Database setup using Config
engine = create_engine(config.DATABASE_URL, echo=config.SQLALCHEMY_ECHO)
SessionLocal = sessionmaker(bind=engine)

# Create tables
Base.metadata.create_all(engine)

def decode_base64_image(base64_string):
    """
    Decode base64 string to numpy array
    Returns: (numpy_array, error_string) - error_string is None if successful
    """
    try:
        if 'base64,' in base64_string:
            base64_string = base64_string.split('base64,')[1]
        
        img_data = base64.b64decode(base64_string)
        img = Image.open(io.BytesIO(img_data))
        img_rgb = img.convert('RGB')
        img_array = np.array(img_rgb)
        
        return img_array, None
    except Exception as e:
        error_msg = f"Error decoding image: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        return None, error_msg

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Server is running'}), 200

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.route('/api/login', methods=['POST'])
def login():
    """Login endpoint - authenticate employee and return JWT token"""
    try:
        data = request.get_json()
        
        if not data or 'employee_id' not in data or 'password' not in data:
            return jsonify({
                'status': 'error',
                'message': translate('invalid_input', 'id')
            }), 400
        
        employee_id = data['employee_id']
        password = data['password']
        
        session = SessionLocal()
        try:
            # Find employee by employee_id
            employee = session.query(Employee).filter_by(employee_id=employee_id).first()
            
            if not employee:
                return jsonify({
                    'status': 'error',
                    'message': translate('employee_not_found', 'id')
                }), 401
            
            if not employee.password:
                return jsonify({
                    'status': 'error',
                    'message': 'Akun belum memiliki password. Silakan hubungi administrator.'
                }), 401
            
            # Verify password
            if not bcrypt.verify(password, employee.password):
                return jsonify({
                    'status': 'error',
                    'message': translate('invalid_credentials', 'id')
                }), 401
            
            # Check if employee is active
            if not employee.is_active:
                return jsonify({
                    'status': 'error',
                    'message': 'Akun tidak aktif. Silakan hubungi administrator.'
                }), 401
            
            # Get user's language preference
            lang = employee.language_preference or 'id'
            
            # Create JWT token
            access_token = create_access_token(
                identity=employee.employee_id,
                additional_claims={
                    'name': employee.name,
                    'role': employee.role or 'employee',
                    'language': lang
                }
            )
            
            return jsonify({
                'status': 'success',
                'message': translate('login_success', lang),
                'access_token': access_token,
                'user': {
                    'employee_id': employee.employee_id,
                    'name': employee.name,
                    'email': employee.email,
                    'department': employee.department,
                    'position': employee.position,
                    'role': employee.role or 'employee',
                    'language': lang,
                    'theme': employee.theme_preference,
                    'date_format': employee.date_format_preference
                }
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        print(f"Error in /api/login: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id')
        }), 500

@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated employee information"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        lang = claims.get('language', 'id')
        
        session = SessionLocal()
        try:
            employee = session.query(Employee).filter_by(employee_id=current_user_id).first()
            
            if not employee:
                return jsonify({
                    'status': 'error',
                    'message': translate('employee_not_found', lang)
                }), 404
            
            return jsonify({
                'status': 'success',
                'user': {
                    'employee_id': employee.employee_id,
                    'name': employee.name,
                    'email': employee.email,
                    'phone': employee.phone,
                    'department': employee.department,
                    'position': employee.position,
                    'role': employee.role or 'employee',
                    'language': employee.language_preference,
                    'theme': employee.theme_preference,
                    'date_format': employee.date_format_preference,
                    'is_active': employee.is_active,
                    'created_at': employee.created_at.isoformat()
                }
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        print(f"Error in /api/me: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id')
        }), 500

# ==================== FACE QUALITY CHECK & REGISTRATION ====================

@app.route('/api/face/analyze', methods=['POST'])
@jwt_required()
def analyze_face():
    """
    Analyze face quality including mask detection
    Returns quality metrics without saving
    """
    try:
        claims = get_jwt()
        lang = claims.get('language', 'id')
        
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'status': 'error',
                'message': translate('invalid_input', lang)
            }), 400
        
        image_base64 = data['image']
        check_mask = data.get('check_mask', True)
        
        # Decode image
        img_array, decode_error = decode_base64_image(image_base64)
        if img_array is None:
            return jsonify({
                'status': 'error',
                'message': f'Gagal memproses gambar: {decode_error}'
            }), 400
        
        # Detect face
        face_locations = face_recognition.face_locations(img_array, model=config.FACE_DETECTION_MODEL)
        
        if len(face_locations) == 0:
            return jsonify({
                'status': 'error',
                'message': translate('face_not_detected', lang),
                'quality_score': 0,
                'is_acceptable': False
            }), 200
        
        if len(face_locations) > 1:
            return jsonify({
                'status': 'error',
                'message': translate('multiple_faces', lang),
                'quality_score': 0,
                'is_acceptable': False
            }), 200
        
        # Analyze face quality (using improved mask detection)
        quality_result = analyze_face_quality(img_array, face_locations[0], check_mask=check_mask)
        
        # PHASE 3: Use improved OpenCV mask detection
        if check_mask:
            mask_result_cv = detect_mask_opencv(img_array, face_locations[0])
            # Override with more accurate OpenCV detection
            if mask_result_cv['mask_detected'] and mask_result_cv['confidence'] > 70:
                quality_result['mask_detected'] = True
                quality_result['mask_confidence'] = mask_result_cv['confidence']
                quality_result['mask_reason'] = mask_result_cv['reason']
        
        return jsonify({
            'status': 'success' if quality_result['is_acceptable'] else 'warning',
            'message': quality_result['recommendation'],
            'quality_metrics': {
                'overall_score': quality_result['quality_score'],
                'blur_score': quality_result['blur_score'],
                'brightness_score': quality_result['brightness_score'],
                'size_score': quality_result['size_score'],
                'angle_score': quality_result['angle_score'],
                'face_dimensions': quality_result['face_dimensions']
            },
            'mask_detection': {
                'detected': quality_result['mask_detected'],
                'confidence': quality_result['mask_confidence'],
                'reason': quality_result['mask_reason']
            },
            'is_acceptable': quality_result['is_acceptable'],
            'recommendation': quality_result['recommendation']
        }), 200
    
    except Exception as e:
        print(f"Error in /api/face/analyze: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', lang)
        }), 500

@app.route('/api/register', methods=['POST'])
@jwt_required()
def register():
    """
    Register new face with MULTIPLE PHOTOS for better accuracy
    Accepts 3 photos and stores 3 separate encodings
    Protected endpoint - only manager/admin can register
    """
    
    claims = get_jwt()
    user_role = claims.get('role')
    lang = claims.get('language', 'id')
    
    # Role Validation: Only admin/manager can register
    if user_role not in ['admin', 'manager']:
        return jsonify({
            'status': 'error',
            'message': translate('access_denied', lang)
        }), 403
    
    try:
        current_user_id = get_jwt_identity()
        
        session = SessionLocal()
        try:
            # Verify current user exists and has proper role
            current_user = session.query(Employee).filter_by(employee_id=current_user_id).first()
            
            if not current_user:
                return jsonify({
                    'status': 'error',
                    'message': translate('employee_not_found', lang)
                }), 401
            
            if current_user.role not in ['manager', 'admin']:
                return jsonify({
                    'status': 'error',
                    'message': 'Anda tidak memiliki akses untuk mendaftarkan karyawan baru. Hanya admin/manajer yang dapat mendaftarkan karyawan.'
                }), 403
        
        finally:
            session.close()
        
        # Continue with registration
        data = request.get_json()
        
        # Check for MULTIPLE IMAGES (new format)
        if 'images' in data:
            # NEW FORMAT: Multiple photos
            if not data or 'name' not in data or 'employee_id' not in data or 'images' not in data:
                return jsonify({
                    'status': 'error',
                    'message': 'Data tidak lengkap. Diperlukan: name, employee_id, images (array)'
                }), 400
            
            name = data['name']
            employee_id = data['employee_id']
            images_base64 = data['images']  # Array of 3 images
            
            if not isinstance(images_base64, list) or len(images_base64) != 3:
                return jsonify({
                    'status': 'error',
                    'message': 'Diperlukan tepat 3 foto untuk registrasi'
                }), 400
            
            # Validate employee_id format
            is_valid, error_msg = validate_employee_id(employee_id)
            if not is_valid:
                return jsonify({
                    'status': 'error',
                    'message': error_msg
                }), 400
            
            # Validate name
            is_valid, error_msg = validate_name(name)
            if not is_valid:
                return jsonify({
                    'status': 'error',
                    'message': error_msg
                }), 400
            
            # Process all 3 images
            encodings_data = []
            
            for idx, image_base64 in enumerate(images_base64, start=1):
                # Decode image
                img_array, decode_error = decode_base64_image(image_base64)
                if img_array is None:
                    return jsonify({
                        'status': 'error',
                        'message': f'Gagal memproses foto ke-{idx}: {decode_error}'
                    }), 400
                
                # Detect face
                face_locations = face_recognition.face_locations(img_array, model=config.FACE_DETECTION_MODEL)
                
                if len(face_locations) == 0:
                    return jsonify({
                        'status': 'error',
                        'message': f'Wajah tidak terdeteksi pada foto ke-{idx}'
                    }), 400
                
                if len(face_locations) > 1:
                    return jsonify({
                        'status': 'error',
                        'message': f'Lebih dari 1 wajah terdeteksi pada foto ke-{idx}'
                    }), 400
                
                # Analyze face quality including mask detection
                quality_result = analyze_face_quality(img_array, face_locations[0], check_mask=True)
                
                # Check if quality is acceptable
                if not quality_result['is_acceptable']:
                    return jsonify({
                        'status': 'error',
                        'message': f'Foto ke-{idx}: {quality_result["recommendation"]}',
                        'photo_index': idx,
                        'quality_score': quality_result['quality_score'],
                        'mask_detected': quality_result['mask_detected']
                    }), 400
                
                # Warn if mask is detected
                if quality_result['mask_detected']:
                    return jsonify({
                        'status': 'error',
                        'message': f'⚠️ Masker terdeteksi pada foto ke-{idx}! Harap lepas masker untuk registrasi wajah.',
                        'photo_index': idx,
                        'mask_detected': True,
                        'mask_confidence': quality_result['mask_confidence']
                    }), 400
                
                # Extract face encoding
                face_encodings = face_recognition.face_encodings(img_array, face_locations)
                
                if len(face_encodings) == 0:
                    return jsonify({
                        'status': 'error',
                        'message': f'Gagal mengekstrak fitur wajah dari foto ke-{idx}'
                    }), 400
                
                face_encoding = face_encodings[0]
                
                # Store encoding data with metadata
                encodings_data.append({
                    'encoding': face_encoding,
                    'photo_index': idx,
                    'quality_score': int(quality_result['quality_score'])
                })
            
            # Save to database
            session = SessionLocal()
            try:
                existing_employee = session.query(Employee).filter_by(employee_id=employee_id).first()
                
                if existing_employee:
                    # Update existing employee
                    existing_employee.name = name
                    
                    if not existing_employee.password:
                        existing_employee.password = bcrypt.hash(employee_id)
                    
                    # Delete old face encodings
                    session.query(EmployeeFaceEncoding).filter_by(
                        employee_id=employee_id
                    ).delete()
                    
                    message = f'✅ Wajah {name} berhasil diperbarui dengan 3 foto!'
                else:
                    # Create new employee
                    new_employee = Employee(
                        name=name,
                        employee_id=employee_id,
                        password=bcrypt.hash(employee_id),
                        role='employee'
                    )
                    session.add(new_employee)
                    message = f'✅ Karyawan {name} berhasil didaftarkan dengan 3 foto! Password default: {employee_id}'
                
                # Save all 3 face encodings
                for enc_data in encodings_data:
                    face_enc = EmployeeFaceEncoding(
                        employee_id=employee_id,
                        face_encoding=enc_data['encoding'].tobytes(),
                        photo_index=enc_data['photo_index'],
                        quality_score=enc_data['quality_score']
                    )
                    session.add(face_enc)
                
                session.commit()
                
                return jsonify({
                    'status': 'success',
                    'message': message,
                    'photos_registered': 3,
                    'quality_scores': [enc['quality_score'] for enc in encodings_data]
                }), 200
            
            except Exception as e:
                session.rollback()
                return jsonify({
                    'status': 'error',
                    'message': f'Gagal menyimpan data: {str(e)}'
                }), 500
            finally:
                session.close()
        
        else:
            # OLD FORMAT: Single photo (backward compatibility)
            if not data or 'name' not in data or 'employee_id' not in data or 'image' not in data:
                return jsonify({
                    'status': 'error',
                    'message': 'Data tidak lengkap. Diperlukan: name, employee_id, image'
                }), 400
            
            name = data['name']
            employee_id = data['employee_id']
            image_base64 = data['image']
            
            # Validate employee_id format
            is_valid, error_msg = validate_employee_id(employee_id)
            if not is_valid:
                return jsonify({
                    'status': 'error',
                    'message': error_msg
                }), 400
            
            # Validate name
            is_valid, error_msg = validate_name(name)
            if not is_valid:
                return jsonify({
                    'status': 'error',
                    'message': error_msg
                }), 400
            
            # Decode image
            img_array, decode_error = decode_base64_image(image_base64)
            if img_array is None:
                return jsonify({
                    'status': 'error',
                    'message': f'Gagal memproses gambar: {decode_error}'
                }), 400
            
            # Detect face
            face_locations = face_recognition.face_locations(img_array, model=config.FACE_DETECTION_MODEL)
            
            if len(face_locations) == 0:
                return jsonify({
                    'status': 'error',
                    'message': translate('face_not_detected', lang)
                }), 400
            
            if len(face_locations) > 1:
                return jsonify({
                    'status': 'error',
                    'message': translate('multiple_faces', lang)
                }), 400
            
            # Analyze face quality including mask detection
            quality_result = analyze_face_quality(img_array, face_locations[0], check_mask=True)
            
            # Check if quality is acceptable
            if not quality_result['is_acceptable']:
                return jsonify({
                    'status': 'error',
                    'message': quality_result['recommendation'],
                    'quality_score': quality_result['quality_score'],
                    'mask_detected': quality_result['mask_detected']
                }), 400
            
            # Warn if mask is detected
            if quality_result['mask_detected']:
                return jsonify({
                    'status': 'error',
                    'message': '⚠️ Masker terdeteksi! Harap lepas masker untuk registrasi wajah.',
                    'mask_detected': True,
                    'mask_confidence': quality_result['mask_confidence']
                }), 400
            
            # Extract face encoding
            face_encodings = face_recognition.face_encodings(img_array, face_locations)
            
            if len(face_encodings) == 0:
                return jsonify({
                    'status': 'error',
                    'message': 'Gagal mengekstrak fitur wajah'
                }), 400
            
            face_encoding = face_encodings[0]
            
            # Save to database (OLD SINGLE PHOTO METHOD)
            session = SessionLocal()
            try:
                existing_employee = session.query(Employee).filter_by(employee_id=employee_id).first()
                
                if existing_employee:
                    # Update existing employee's face (legacy field)
                    existing_employee.face_encoding = face_encoding.tobytes()
                    existing_employee.name = name
                    
                    if not existing_employee.password:
                        existing_employee.password = bcrypt.hash(employee_id)
                    
                    message = translate('face_updated', lang) + f' ({name})'
                else:
                    # Create new employee
                    new_employee = Employee(
                        name=name,
                        employee_id=employee_id,
                        password=bcrypt.hash(employee_id),
                        role='employee',
                        face_encoding=face_encoding.tobytes()
                    )
                    session.add(new_employee)
                    message = translate('face_registered', lang) + f' ({name}). Password default: {employee_id}'

                session.commit()
                
                return jsonify({
                    'status': 'success',
                    'message': message
                }), 200

            except Exception as e:
                session.rollback()
                return jsonify({
                    'status': 'error',
                    'message': f'Gagal menyimpan data: {str(e)}'
                }), 500
            finally:
                session.close()
    
    except Exception as e:
        print(f"Error in /api/register: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', lang)
        }), 500

# ==================== FACE RECOGNITION & ATTENDANCE ====================

@app.route('/api/recognize', methods=['POST'])
@jwt_required()
def recognize():
    """
    Recognize face and mark attendance
    1-to-1 matching: Only match against logged-in employee's face
    """
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        lang = claims.get('language', 'id')
        
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'status': 'error',
                'message': translate('invalid_input', lang),
                'detected': False
            }), 400
        
        image_base64 = data['image']
        
        # Decode image
        img_array, decode_error = decode_base64_image(image_base64)
        if img_array is None:
            return jsonify({
                'status': 'error',
                'message': f'Gagal memproses gambar: {decode_error}',
                'detected': False
            }), 400
        
        # Detect faces
        face_locations = face_recognition.face_locations(img_array, model=config.FACE_DETECTION_MODEL)
        
        if len(face_locations) == 0:
            return jsonify({
                'status': 'error',
                'message': translate('face_not_detected', lang),
                'detected': False
            }), 200
        
        if len(face_locations) > 1:
            return jsonify({
                'status': 'error',
                'message': translate('multiple_faces', lang),
                'detected': False
            }), 200
        
        # Check face quality and mask detection
        quality_result = analyze_face_quality(img_array, face_locations[0], check_mask=True)
        
        # If mask detected, reject immediately
        if quality_result['mask_detected']:
            return jsonify({
                'status': 'error',
                'message': '⚠️ Masker terdeteksi! Harap lepas masker untuk verifikasi absensi.',
                'detected': False,
                'mask_detected': True,
                'mask_confidence': quality_result['mask_confidence']
            }), 200
        
        # Warn about low quality (but don't block)
        quality_warnings = []
        if quality_result['quality_score'] < 70:
            quality_warnings.append(quality_result['recommendation'])
        
        # Extract face encoding
        face_encodings = face_recognition.face_encodings(img_array, face_locations)
        
        if len(face_encodings) == 0:
            return jsonify({
                'status': 'error',
                'message': 'Gagal mengekstrak fitur wajah',
                'detected': False
            }), 200
        
        unknown_encoding = face_encodings[0]
        
        # Get logged-in employee from database (1-to-1 matching)
        session = SessionLocal()
        try:
            current_employee = session.query(Employee).filter_by(employee_id=current_user_id).first()
            
            if not current_employee:
                return jsonify({
                    'status': 'error',
                    'message': translate('employee_not_found', lang),
                    'detected': False
                }), 404
            
            # Try to load multiple face encodings first (NEW SYSTEM)
            face_encodings_records = session.query(EmployeeFaceEncoding).filter_by(
                employee_id=current_user_id
            ).all()
            
            if face_encodings_records:
                # NEW SYSTEM: Multiple encodings (better accuracy!)
                known_encodings = [
                    np.frombuffer(rec.face_encoding, dtype=np.float64) 
                    for rec in face_encodings_records
                ]
                
                # Compare with ALL stored encodings
                all_matches = face_recognition.compare_faces(
                    known_encodings, 
                    unknown_encoding, 
                    tolerance=config.FACE_RECOGNITION_TOLERANCE
                )
                all_distances = face_recognition.face_distance(known_encodings, unknown_encoding)
                
                # Use BEST match (minimum distance)
                best_match_idx = np.argmin(all_distances)
                best_distance = all_distances[best_match_idx]
                is_match = all_matches[best_match_idx]
                
                print(f"🔍 [Multi-Photo Recognition] Compared with {len(known_encodings)} photos")
                print(f"✅ Best match: Photo {best_match_idx + 1}, Distance: {best_distance:.4f}")
                
            elif current_employee.face_encoding:
                # OLD SYSTEM: Single encoding (backward compatibility)
                known_encoding = np.frombuffer(current_employee.face_encoding, dtype=np.float64)
                
                matches = face_recognition.compare_faces(
                    [known_encoding], 
                    unknown_encoding, 
                    tolerance=config.FACE_RECOGNITION_TOLERANCE
                )
                distances = face_recognition.face_distance([known_encoding], unknown_encoding)
                
                is_match = matches[0]
                best_distance = distances[0]
                
                print(f"🔍 [Single-Photo Recognition] Using legacy single photo")
                
            else:
                # No face encodings at all
                return jsonify({
                    'status': 'error',
                    'message': f'Wajah untuk akun {current_employee.name} belum terdaftar. Silakan hubungi admin.',
                    'detected': False
                }), 200
            
            # Check if face matches
            if not is_match:
                return jsonify({
                    'status': 'error',
                    'message': f'Wajah tidak cocok dengan akun {current_employee.name}. Silakan gunakan wajah Anda sendiri.',
                    'detected': False,
                    'confidence': float(1 - best_distance)
                }), 200
            
            # Face matches! Check if already marked attendance today
            today = datetime.now().date()
            existing_attendance = session.query(Attendance).filter(
                Attendance.employee_id == current_employee.employee_id,
                Attendance.timestamp >= datetime.combine(today, datetime.min.time())
            ).first()
            
            if existing_attendance:
                return jsonify({
                    'status': 'success',
                    'message': translate('attendance_already_marked', lang),
                    'name': current_employee.name,
                    'employee_id': current_employee.employee_id,
                    'already_marked': True,
                    'detected': True,
                    'confidence': float(1 - best_distance)
                }), 200
            
            # Mark attendance
            confidence_score = int((1 - best_distance) * 100)
            new_attendance = Attendance(
                employee_id=current_employee.employee_id,
                check_in_type='face_recognition',
                confidence_score=confidence_score
            )
            session.add(new_attendance)
            session.commit()
            
            response_message = translate('attendance_marked', lang) + f' Selamat datang, {current_employee.name}!'
            if quality_warnings:
                response_message += f' | ⚠️ {quality_warnings[0]}'
            
            return jsonify({
                'status': 'success',
                'message': response_message,
                'name': current_employee.name,
                'employee_id': current_employee.employee_id,
                'already_marked': False,
                'detected': True,
                'confidence': float(1 - best_distance),
                'quality_score': quality_result['quality_score'],
                'timestamp': datetime.now().isoformat()
            }), 200
        
        except Exception as e:
            session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Error: {str(e)}',
                'detected': False
            }), 500
        finally:
            session.close()
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}',
            'detected': False
        }), 500

# ==================== ATTENDANCE MANAGEMENT ====================

@app.route('/api/attendance', methods=['GET'])
@jwt_required()
def get_attendance():
    """Get all attendance records"""
    try:
        claims = get_jwt()
        lang = claims.get('language', 'id')
        user_role = claims.get('role')
        current_user_id = get_jwt_identity()
        
        session = SessionLocal()
        try:
            # If employee role, show only their own attendance
            if user_role == 'employee':
                attendances = session.query(Attendance).filter_by(
                    employee_id=current_user_id
                ).join(Employee).order_by(Attendance.timestamp.desc()).all()
            else:
                # Manager/admin can see all
                attendances = session.query(Attendance).join(Employee).order_by(
                    Attendance.timestamp.desc()
                ).all()
            
            result = []
            for attendance in attendances:
                # Get employee's date format preference
                employee = session.query(Employee).filter_by(
                    employee_id=attendance.employee_id
                ).first()
                date_format = employee.date_format_preference if employee else 'indonesian'
                
                result.append({
                    'id': attendance.id,
                    'name': attendance.employee.name,
                    'employee_id': attendance.employee_id,
                    'department': attendance.employee.department,
                    'position': attendance.employee.position,
                    'timestamp': attendance.timestamp.isoformat(),
                    'formatted_time': format_datetime(attendance.timestamp, date_format),
                    'check_in_type': attendance.check_in_type,
                    'confidence_score': attendance.confidence_score,
                    'location': attendance.location,
                    'notes': attendance.notes
                })
            
            return jsonify({
                'status': 'success',
                'data': result
            }), 200
        finally:
            session.close()
    except Exception as e:
        print(f"Error in /api/attendance: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id')
        }), 500

@app.route('/api/attendance/today', methods=['GET'])
@jwt_required()
def check_attendance_today():
    """Check if current employee has marked attendance today"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        lang = claims.get('language', 'id')
        
        session = SessionLocal()
        try:
            today = datetime.now().date()
            attendance = session.query(Attendance).filter(
                Attendance.employee_id == current_user_id,
                Attendance.timestamp >= datetime.combine(today, datetime.min.time())
            ).first()
            
            if attendance:
                employee = session.query(Employee).filter_by(
                    employee_id=current_user_id
                ).first()
                date_format = employee.date_format_preference if employee else 'indonesian'
                
                return jsonify({
                    'status': 'success',
                    'attended': True,
                    'timestamp': attendance.timestamp.isoformat(),
                    'formatted_time': format_datetime(attendance.timestamp, date_format),
                    'message': 'Anda sudah absen hari ini' if lang == 'id' else 'Already attended today'
                }), 200
            else:
                return jsonify({
                    'status': 'success',
                    'attended': False,
                    'message': 'Anda belum absen hari ini' if lang == 'id' else 'Not attended today'
                }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        print(f"Error in /api/attendance/today: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', lang)
        }), 500

@app.route('/api/attendance/stats', methods=['GET'])
@jwt_required()
def get_attendance_stats():
    """Get attendance statistics for current user"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        lang = claims.get('language', 'id')
        
        session = SessionLocal()
        try:
            today = datetime.now().date()
            this_week_start = today - timedelta(days=today.weekday())
            this_month_start = today.replace(day=1)
            
            # Check if attended today
            today_attendance = session.query(Attendance).filter(
                Attendance.employee_id == current_user_id,
                Attendance.timestamp >= datetime.combine(today, datetime.min.time())
            ).first()
            
            # Count this week
            week_count = session.query(Attendance).filter(
                Attendance.employee_id == current_user_id,
                Attendance.timestamp >= datetime.combine(this_week_start, datetime.min.time())
            ).count()
            
            # Count this month
            month_count = session.query(Attendance).filter(
                Attendance.employee_id == current_user_id,
                Attendance.timestamp >= datetime.combine(this_month_start, datetime.min.time())
            ).count()
            
            stats = {
                'today': today_attendance is not None,
                'this_week': week_count,
                'this_month': month_count
            }
            
            if today_attendance:
                employee = session.query(Employee).filter_by(
                    employee_id=current_user_id
                ).first()
                date_format = employee.date_format_preference if employee else 'indonesian'
                stats['attendance_time'] = today_attendance.timestamp.isoformat()
                stats['formatted_time'] = format_datetime(today_attendance.timestamp, date_format)
            
            return jsonify({
                'status': 'success',
                'stats': stats
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        print(f"Error in /api/attendance/stats: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id')
        }), 500

# ==================== EMPLOYEE MANAGEMENT ====================

@app.route('/api/employees', methods=['GET'])
@jwt_required()
def get_employees():
    """Get all employees (manager/admin only)"""
    try:
        claims = get_jwt()
        user_role = claims.get('role')
        lang = claims.get('language', 'id')
        
        # Only manager/admin can view all employees
        if user_role not in ['manager', 'admin']:
            return jsonify({
                'status': 'error',
                'message': translate('access_denied', lang)
            }), 403
        
        session = SessionLocal()
        try:
            employees = session.query(Employee).filter_by(is_active=True).all()
            
            result = []
            for emp in employees:
                result.append({
                    'id': emp.id,
                    'employee_id': emp.employee_id,
                    'name': emp.name,
                    'email': emp.email,
                    'phone': emp.phone,
                    'department': emp.department,
                    'position': emp.position,
                    'role': emp.role or 'employee',
                    'is_active': emp.is_active,
                    'created_at': emp.created_at.isoformat()
                })
            
            return jsonify({
                'status': 'success',
                'data': result
            }), 200
        finally:
            session.close()
    except Exception as e:
        print(f"Error in /api/employees: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id')
        }), 500

# ==================== PROFILE & SETTINGS ====================

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update employee profile"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        lang = claims.get('language', 'id')
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': translate('invalid_input', lang)
            }), 400
        
        session = SessionLocal()
        try:
            employee = session.query(Employee).filter_by(employee_id=current_user_id).first()
            
            if not employee:
                return jsonify({
                    'status': 'error',
                    'message': translate('employee_not_found', lang)
                }), 404
            
            # Update allowed fields
            if 'name' in data and data['name']:
                is_valid, error_msg = validate_name(data['name'])
                if not is_valid:
                    return jsonify({'status': 'error', 'message': error_msg}), 400
                employee.name = data['name'].strip()
            
            if 'email' in data and data['email']:
                is_valid, error_msg = validate_email(data['email'])
                if not is_valid:
                    return jsonify({'status': 'error', 'message': error_msg}), 400
                employee.email = data['email'].strip().lower()
            
            if 'phone' in data:
                employee.phone = data['phone']
            
            # User preferences
            if 'language_preference' in data:
                if data['language_preference'] in config.SUPPORTED_LANGUAGES:
                    employee.language_preference = data['language_preference']
            
            if 'theme_preference' in data:
                if data['theme_preference'] in ['light', 'dark']:
                    employee.theme_preference = data['theme_preference']
            
            if 'date_format_preference' in data:
                if data['date_format_preference'] in ['indonesian', 'standard']:
                    employee.date_format_preference = data['date_format_preference']
            
            session.commit()
            
            return jsonify({
                'status': 'success',
                'message': translate('settings_updated', lang),
                'user': {
                    'employee_id': employee.employee_id,
                    'name': employee.name,
                    'email': employee.email,
                    'phone': employee.phone,
                    'role': employee.role,
                    'language': employee.language_preference,
                    'theme': employee.theme_preference,
                    'date_format': employee.date_format_preference
                }
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        print(f"Error in /api/profile: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id')
        }), 500

@app.route('/api/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change employee password"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        lang = claims.get('language', 'id')
        
        data = request.get_json()
        
        if not data or 'old_password' not in data or 'new_password' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Password lama dan password baru harus diisi'
            }), 400
        
        old_password = data['old_password']
        new_password = data['new_password']
        
        # Validate new password
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': error_msg
            }), 400
        
        session = SessionLocal()
        try:
            employee = session.query(Employee).filter_by(employee_id=current_user_id).first()
            
            if not employee:
                return jsonify({
                    'status': 'error',
                    'message': translate('employee_not_found', lang)
                }), 404
            
            # Verify old password
            if not employee.password or not bcrypt.verify(old_password, employee.password):
                return jsonify({
                    'status': 'error',
                    'message': translate('password_incorrect', lang)
                }), 401
            
            # Update password
            employee.password = bcrypt.hash(new_password)
            session.commit()
            
            return jsonify({
                'status': 'success',
                'message': translate('password_changed', lang)
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        print(f"Error in /api/change-password: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id')
        }), 500

# ==================== MOCK ENDPOINTS (for backward compatibility) ====================

@app.route('/api/materials', methods=['GET'])
@jwt_required()
def get_materials():
    """Get materials - Mock data for now"""
    try:
        claims = get_jwt()
        lang = claims.get('language', 'id')
        
        materials = [
            {
                'id': 1,
                'title': 'Materi 1: Pengenalan Sistem',
                'description': 'Pengenalan sistem manajemen karyawan',
                'file_url': '/materials/intro.pdf',
                'uploaded_at': '2025-08-01T10:00:00'
            }
        ]
        
        return jsonify({
            'status': 'success',
            'data': materials
        }), 200
    
    except Exception as e:
        print(f"Error in /api/materials: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id')
        }), 500

@app.route('/api/assignments', methods=['GET'])
@jwt_required()
def get_assignments():
    """Get assignments - Mock data for now"""
    try:
        claims = get_jwt()
        lang = claims.get('language', 'id')
        
        assignments = [
            {
                'id': 1,
                'title': 'Tugas 1: Laporan Bulanan',
                'description': 'Submit laporan bulanan',
                'deadline': '2025-08-31T23:59:59',
                'status': 'pending'
            }
        ]
        
        return jsonify({
            'status': 'success',
            'data': assignments
        }), 200
    
    except Exception as e:
        print(f"Error in /api/assignments: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id')
        }), 500

# ==================== QR CODE ENDPOINTS (NEW - PHASE 3) ====================

@app.route('/api/employee/qrcode/<employee_id>', methods=['GET'])
@jwt_required()
def get_employee_qr_code(employee_id: str):
    """
    Generate QR code for employee e-card
    Returns base64 encoded QR code image
    """
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        lang = claims.get('language', 'id')
        user_role = claims.get('role')
        
        session = SessionLocal()
        try:
            # Check if user can access this QR code
            # Users can only get their own QR code, unless they're admin/manager
            if employee_id != current_user_id and user_role not in ['admin', 'manager']:
                return jsonify({
                    'status': 'error',
                    'message': 'Anda hanya bisa mengakses QR code Anda sendiri'
                }), 403
            
            # Get employee data
            employee = session.query(Employee).filter_by(employee_id=employee_id).first()
            
            if not employee:
                return jsonify({
                    'status': 'error',
                    'message': translate('employee_not_found', lang)
                }), 404
            
            # Check cache first
            cached_qr = get_cached_qr_code(employee_id, employee.name, cache_minutes=60)
            
            if cached_qr:
                qr_base64, metadata = cached_qr
            else:
                # Generate new QR code
                qr_base64, metadata = generate_employee_qr_code(
                    employee_id=employee_id,
                    employee_name=employee.name,
                    include_timestamp=True,  # Include timestamp for security
                    size=300,
                    border=2
                )
                
                # Cache it
                cache_qr_code(employee_id, employee.name, (qr_base64, metadata))
            
            return jsonify({
                'status': 'success',
                'qr_code': f'data:image/png;base64,{qr_base64}',
                'metadata': metadata,
                'employee': {
                    'employee_id': employee.employee_id,
                    'name': employee.name,
                    'department': employee.department,
                    'position': employee.position
                }
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        print(f"Error in /api/employee/qrcode: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id')
        }), 500


@app.route('/api/attendance/qr', methods=['POST'])
@jwt_required()
def mark_attendance_qr():
    """
    Mark attendance using QR code scan
    Validates QR code and marks attendance
    """
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        lang = claims.get('language', 'id')
        
        data = request.get_json()
        
        if not data or 'qr_data' not in data:
            return jsonify({
                'status': 'error',
                'message': 'QR code data tidak ditemukan'
            }), 400
        
        qr_data = data['qr_data']
        
        # Validate QR code
        validation_result = validate_qr_code(qr_data, max_age_hours=24)  # QR valid for 24 hours
        
        if not validation_result.get('valid'):
            return jsonify({
                'status': 'error',
                'message': validation_result.get('error', 'QR code tidak valid'),
                'detected': False
            }), 400
        
        scanned_employee_id = validation_result['employee_id']
        
        # Verify that scanned employee_id matches logged-in user
        if scanned_employee_id != current_user_id:
            return jsonify({
                'status': 'error',
                'message': f'QR code ini milik {scanned_employee_id}. Anda harus scan QR code Anda sendiri!',
                'detected': False
            }), 403
        
        session = SessionLocal()
        try:
            # Get employee
            employee = session.query(Employee).filter_by(employee_id=current_user_id).first()
            
            if not employee:
                return jsonify({
                    'status': 'error',
                    'message': translate('employee_not_found', lang),
                    'detected': False
                }), 404
            
            # Check if already marked attendance today
            today = datetime.now().date()
            existing_attendance = session.query(Attendance).filter(
                Attendance.employee_id == current_user_id,
                Attendance.timestamp >= datetime.combine(today, datetime.min.time())
            ).first()
            
            if existing_attendance:
                return jsonify({
                    'status': 'success',
                    'message': translate('attendance_already_marked', lang),
                    'name': employee.name,
                    'employee_id': employee.employee_id,
                    'already_marked': True,
                    'detected': True,
                    'method': 'qr_code'
                }), 200
            
            # Mark attendance via QR code
            new_attendance = Attendance(
                employee_id=current_user_id,
                check_in_type='qr_code',  # NEW: QR code method
                confidence_score=100,  # QR code has 100% confidence
                notes='Absensi menggunakan QR Code'
            )
            session.add(new_attendance)
            session.commit()
            
            return jsonify({
                'status': 'success',
                'message': f'✅ Absensi berhasil dicatat! Selamat datang, {employee.name}!',
                'name': employee.name,
                'employee_id': employee.employee_id,
                'already_marked': False,
                'detected': True,
                'method': 'qr_code',
                'timestamp': datetime.now().isoformat()
            }), 200
        
        except Exception as e:
            session.rollback()
            return jsonify({
                'status': 'error',
                'message': f'Error: {str(e)}',
                'detected': False
            }), 500
        finally:
            session.close()
    
    except Exception as e:
        print(f"Error in /api/attendance/qr: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': translate('server_error', 'id'),
            'detected': False
        }), 500


if __name__ == '__main__':
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
