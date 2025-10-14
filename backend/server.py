from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
import face_recognition
import numpy as np
import base64
import cv2
from datetime import datetime, timedelta
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import io
from PIL import Image
import traceback
from passlib.hash import bcrypt

from models import Base, User, Attendance

load_dotenv()

app = Flask(__name__)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'unipresence-secret-key-2024-change-this-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# CORS Configuration - Updated for better preflight handling
CORS(app, 
     resources={r"/api/*": {
         "origins": ["http://localhost:3000", "http://localhost:5173"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 3600
     }})

# Additional CORS error handler for 500 errors
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ["http://localhost:3000", "http://localhost:5173"]:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Database setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
os.makedirs(INSTANCE_DIR, exist_ok=True)

DATABASE_URL = f"sqlite:///{os.path.join(INSTANCE_DIR, 'attendance.db')}"
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)

# Create tables
Base.metadata.create_all(engine)

def decode_base64_image(base64_string):
    """Decode base64 string to numpy array
    Returns: (numpy_array, error_string) - error_string is None if successful
    """
    try:
        # Remove data URL prefix if present
        if 'base64,' in base64_string:
            base64_string = base64_string.split('base64,')[1]
        
        # Decode base64
        img_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        img = Image.open(io.BytesIO(img_data))
        
        # Convert to RGB (face_recognition requires RGB)
        img_rgb = img.convert('RGB')
        
        # Convert to numpy array
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

# ==================== PHASE 5: AUTHENTICATION ENDPOINTS ====================

@app.route('/api/login', methods=['POST'])
def login():
    """Login endpoint - authenticate user and return JWT token"""
    try:
        data = request.get_json()
        
        if not data or 'student_id' not in data or 'password' not in data:
            return jsonify({
                'status': 'error',
                'message': 'NIM dan password harus diisi'
            }), 400
        
        student_id = data['student_id']
        password = data['password']
        
        session = SessionLocal()
        try:
            # Find user by student_id
            user = session.query(User).filter_by(student_id=student_id).first()
            
            if not user:
                return jsonify({
                    'status': 'error',
                    'message': 'NIM tidak ditemukan'
                }), 401
            
            if not user.password:
                return jsonify({
                    'status': 'error',
                    'message': 'Akun belum memiliki password. Silakan hubungi administrator.'
                }), 401
            
            # Verify password
            if not bcrypt.verify(password, user.password):
                return jsonify({
                    'status': 'error',
                    'message': 'Password salah'
                }), 401
            
            # Create JWT token
            access_token = create_access_token(
                identity=user.student_id,
                additional_claims={
                    'name': user.name,
                    'role': user.role or 'student'
                }
            )
            
            return jsonify({
                'status': 'success',
                'message': 'Login berhasil',
                'access_token': access_token,
                'user': {
                    'student_id': user.student_id,
                    'name': user.name,
                    'role': user.role or 'student'
                }
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        print(f"Error in /api/login: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user information"""
    try:
        current_user_id = get_jwt_identity()
        
        session = SessionLocal()
        try:
            user = session.query(User).filter_by(student_id=current_user_id).first()
            
            if not user:
                return jsonify({
                    'status': 'error',
                    'message': 'User tidak ditemukan'
                }), 404
            
            return jsonify({
                'status': 'success',
                'user': {
                    'student_id': user.student_id,
                    'name': user.name,
                    'role': user.role or 'student',
                    'created_at': user.created_at.isoformat()
                }
            }), 200
        
        finally:
            session.close()
    
    except Exception as e:
        print(f"Error in /api/me: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}'
        }), 500

# ==================== END PHASE 5 ====================

@app.route('/api/register', methods=['POST'])
@jwt_required()
def register():
    """Register new face - Protected endpoint, only komting/admin can register"""
    
    # 1. Ambil claims (termasuk role) dari token JWT
    claims = get_jwt()
    user_role = claims.get('role')
    
    # 2. Lakukan Role Validation
    if user_role not in ['admin', 'komting']:
        return jsonify({
            'status': 'error',
            'message': 'Akses ditolak. Hanya Admin atau Komting yang dapat mendaftarkan wajah.'
        }), 403 # HTTP 403 Forbidden
    
    try:
        # Get current user from JWT token
        current_user_id = get_jwt_identity()
        
        session = SessionLocal()
        try:
            # Verify user exists and has proper role
            current_user = session.query(User).filter_by(student_id=current_user_id).first()
            
            if not current_user:
                return jsonify({
                    'status': 'error',
                    'message': 'User tidak ditemukan'
                }), 401
            
            # Role validation: only komting/admin can register new users
            if current_user.role not in ['komting', 'admin']:
                return jsonify({
                    'status': 'error',
                    'message': 'Anda tidak memiliki akses untuk mendaftarkan user baru. Hanya admin/komting yang dapat mendaftarkan user.'
                }), 403
        
        finally:
            session.close()
        
        # Continue with registration process
        data = request.get_json()
        
        if not data or 'name' not in data or 'student_id' not in data or 'image' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Data tidak lengkap. Diperlukan: name, student_id, image'
            }), 400
        
        name = data['name']
        student_id = data['student_id']
        image_base64 = data['image']
        
        # Decode image
        img_array, decode_error = decode_base64_image(image_base64)
        if img_array is None:
            return jsonify({
                'status': 'error',
                'message': f'Gagal memproses gambar: {decode_error}'
            }), 400
        
        # Detect face
        face_locations = face_recognition.face_locations(img_array)
        
        if len(face_locations) == 0:
            return jsonify({
                'status': 'error',
                'message': 'Wajah tidak terdeteksi. Pastikan pencahayaan cukup dan wajah terlihat jelas.'
            }), 400
        
        if len(face_locations) > 1:
            return jsonify({
                'status': 'error',
                'message': 'Terdeteksi lebih dari satu wajah. Pastikan hanya ada satu wajah dalam frame.'
            }), 400
        
        # Extract face encoding
        face_encodings = face_recognition.face_encodings(img_array, face_locations)
        
        if len(face_encodings) == 0:
            return jsonify({
                'status': 'error',
                'message': 'Gagal mengekstrak fitur wajah'
            }), 400
        
        face_encoding = face_encodings[0]
        
        # Save to database
        session = SessionLocal()
        try:
            # 1. Check if student_id already exists
            existing_user = session.query(User).filter_by(student_id=student_id).first()
            
            if existing_user:
                # --- PERBAIKAN: Jika user sudah ada, UPDATE wajahnya ---
                existing_user.face_encoding = face_encoding.tobytes()
                existing_user.name = name  # Perbarui nama (jika ada perubahan)
                # role tetap
                message = f'Wajah {name} berhasil diperbarui!'
            else:
                # --- JIKA user baru, CREATE user baru ---
                # Note: Ini untuk skenario di mana Admin mendaftarkan user baru yang belum di-seed
                new_user = User(
                    name=name,
                    student_id=student_id,
                    role='student',
                    face_encoding=face_encoding.tobytes()
                )
                session.add(new_user)
                message = f'Wajah {name} berhasil terdaftar!'

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
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/recognize', methods=['POST'])
@jwt_required()  # ← PHASE 7: Protect with JWT authentication
def recognize():
    """
    Recognize face and mark attendance
    PHASE 7 UPDATE: Only match against logged-in user's face encoding (1-to-1 matching)
    This prevents User A from marking attendance using User B's face
    """
    try:
        # Get current logged-in user from JWT token
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Gambar tidak ditemukan',
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
        face_locations = face_recognition.face_locations(img_array)
        
        # STRICT VALIDATION: Must detect exactly 1 face
        if len(face_locations) == 0:
            return jsonify({
                'status': 'error',
                'message': 'Wajah tidak terdeteksi',
                'detected': False
            }), 200
        
        if len(face_locations) > 1:
            return jsonify({
                'status': 'error',
                'message': f'Terdeteksi {len(face_locations)} wajah. Pastikan hanya wajah Anda yang terlihat.',
                'detected': False
            }), 200
        
        # Extract face encoding
        face_encodings = face_recognition.face_encodings(img_array, face_locations)
        
        if len(face_encodings) == 0:
            return jsonify({
                'status': 'error',
                'message': 'Gagal mengekstrak fitur wajah',
                'detected': False
            }), 200
        
        unknown_encoding = face_encodings[0]
        
        # Get ONLY the logged-in user from database (1-to-1 matching)
        session = SessionLocal()
        try:
            current_user = session.query(User).filter_by(student_id=current_user_id).first()
            
            if not current_user:
                return jsonify({
                    'status': 'error',
                    'message': 'User tidak ditemukan',
                    'detected': False
                }), 404
            
            # Check if user has face encoding registered
            if not current_user.face_encoding:
                return jsonify({
                    'status': 'error',
                    'message': f'Wajah untuk akun {current_user.name} belum terdaftar. Silakan hubungi admin.',
                    'detected': False
                }), 200
            
            # Get the user's face encoding
            known_encoding = np.frombuffer(current_user.face_encoding, dtype=np.float64)
            
            # Compare faces: 1-to-1 matching with logged-in user only
            matches = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=0.6)
            face_distance = face_recognition.face_distance([known_encoding], unknown_encoding)
            
            # If face does NOT match → REJECT (Security Fix)
            if not matches[0]:
                return jsonify({
                    'status': 'error',
                    'message': f'Wajah tidak cocok dengan akun {current_user.name}. Silakan gunakan wajah Anda sendiri.',
                    'detected': False,
                    'confidence': float(1 - face_distance[0])
                }), 200
            
            # Face matches! Check if already marked attendance today
            today = datetime.now().date()
            existing_attendance = session.query(Attendance).filter(
                Attendance.student_id == current_user.student_id,
                Attendance.timestamp >= datetime.combine(today, datetime.min.time())
            ).first()
            
            if existing_attendance:
                return jsonify({
                    'status': 'success',
                    'message': 'Absensi sudah tercatat hari ini',
                    'name': current_user.name,
                    'student_id': current_user.student_id,
                    'already_marked': True,
                    'detected': True,
                    'confidence': float(1 - face_distance[0])
                }), 200
            
            # Mark attendance
            new_attendance = Attendance(student_id=current_user.student_id)
            session.add(new_attendance)
            session.commit()
            
            return jsonify({
                'status': 'success',
                'message': f'Selamat datang, {current_user.name}! Absensi berhasil dicatat.',
                'name': current_user.name,
                'student_id': current_user.student_id,
                'already_marked': False,
                'detected': True,
                'confidence': float(1 - face_distance[0]),
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

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    """Get all attendance records"""
    try:
        session = SessionLocal()
        try:
            attendances = session.query(Attendance).join(User).order_by(Attendance.timestamp.desc()).all()
            
            result = []
            for attendance in attendances:
                result.append({
                    'id': attendance.id,
                    'name': attendance.user.name,
                    'student_id': attendance.student_id,
                    'timestamp': attendance.timestamp.isoformat()
                })
            
            return jsonify({
                'status': 'success',
                'data': result
            }), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all registered users"""
    try:
        session = SessionLocal()
        try:
            users = session.query(User).all()
            
            result = []
            for user in users:
                result.append({
                    'id': user.id,
                    'name': user.name,
                    'student_id': user.student_id,
                    'role': user.role or 'student',
                    'created_at': user.created_at.isoformat()
                })
            
            return jsonify({
                'status': 'success',
                'data': result
            }), 200
        finally:
            session.close()
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    app.run(host='0.0.0.0', port=port, debug=True)
