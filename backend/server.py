from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import base64
import cv2
from datetime import datetime
import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime, LargeBinary, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv
import io
from PIL import Image

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
os.makedirs(INSTANCE_DIR, exist_ok=True)

DATABASE_URL = f"sqlite:///{os.path.join(INSTANCE_DIR, 'attendance.db')}"
engine = create_engine(DATABASE_URL, echo=False)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)

# Database Models
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    student_id = Column(String, unique=True, nullable=False)
    face_encoding = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    attendances = relationship("Attendance", back_populates="user")

class Attendance(Base):
    __tablename__ = 'attendance'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String, ForeignKey('users.student_id'), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="attendances")

# Create tables
Base.metadata.create_all(engine)

def decode_base64_image(base64_string):
    """Decode base64 string to numpy array"""
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
        
        return img_array
    except Exception as e:
        print(f"Error decoding image: {str(e)}")
        return None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Server is running'}), 200

@app.route('/api/register', methods=['POST'])
def register():
    """Register new face"""
    try:
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
        img_array = decode_base64_image(image_base64)
        if img_array is None:
            return jsonify({
                'status': 'error',
                'message': 'Gagal memproses gambar'
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
            # Check if student_id already exists
            existing_user = session.query(User).filter_by(student_id=student_id).first()
            if existing_user:
                return jsonify({
                    'status': 'error',
                    'message': f'NIM {student_id} sudah terdaftar'
                }), 400
            
            # Create new user
            new_user = User(
                name=name,
                student_id=student_id,
                face_encoding=face_encoding.tobytes()
            )
            session.add(new_user)
            session.commit()
            
            return jsonify({
                'status': 'success',
                'message': f'Wajah {name} berhasil terdaftar!'
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
        return jsonify({
            'status': 'error',
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/recognize', methods=['POST'])
def recognize():
    """Recognize face and mark attendance"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Gambar tidak ditemukan'
            }), 400
        
        image_base64 = data['image']
        
        # Decode image
        img_array = decode_base64_image(image_base64)
        if img_array is None:
            return jsonify({
                'status': 'error',
                'message': 'Gagal memproses gambar'
            }), 400
        
        # Detect face
        face_locations = face_recognition.face_locations(img_array)
        
        if len(face_locations) == 0:
            return jsonify({
                'status': 'error',
                'message': 'Wajah tidak terdeteksi',
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
        
        # Get all registered users
        session = SessionLocal()
        try:
            users = session.query(User).all()
            
            if len(users) == 0:
                return jsonify({
                    'status': 'error',
                    'message': 'Belum ada wajah terdaftar',
                    'detected': False
                }), 200
            
            # Compare with all registered faces
            for user in users:
                known_encoding = np.frombuffer(user.face_encoding, dtype=np.float64)
                
                # Compare faces
                matches = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=0.6)
                face_distance = face_recognition.face_distance([known_encoding], unknown_encoding)
                
                if matches[0]:
                    # Check if already marked attendance today
                    today = datetime.now().date()
                    existing_attendance = session.query(Attendance).filter(
                        Attendance.student_id == user.student_id,
                        Attendance.timestamp >= datetime.combine(today, datetime.min.time())
                    ).first()
                    
                    if existing_attendance:
                        return jsonify({
                            'status': 'success',
                            'message': 'Absensi sudah tercatat hari ini',
                            'name': user.name,
                            'student_id': user.student_id,
                            'already_marked': True,
                            'detected': True,
                            'confidence': float(1 - face_distance[0])
                        }), 200
                    
                    # Mark attendance
                    new_attendance = Attendance(student_id=user.student_id)
                    session.add(new_attendance)
                    session.commit()
                    
                    return jsonify({
                        'status': 'success',
                        'message': 'Absensi berhasil dicatat',
                        'name': user.name,
                        'student_id': user.student_id,
                        'already_marked': False,
                        'detected': True,
                        'confidence': float(1 - face_distance[0]),
                        'timestamp': datetime.now().isoformat()
                    }), 200
            
            # No match found
            return jsonify({
                'status': 'error',
                'message': 'Wajah tidak dikenali',
                'detected': False
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