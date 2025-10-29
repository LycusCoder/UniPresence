from sqlalchemy import Column, Integer, String, DateTime, LargeBinary, ForeignKey, Text, Boolean, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Employee(Base):
    """Employee model - formerly User/Student"""
    __tablename__ = 'employees'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)  # Formerly student_id
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True, index=True)
    position = Column(String(100), nullable=True)
    password = Column(String(255), nullable=True)  # Hashed password
    role = Column(String(50), nullable=True, default='employee')  # 'employee', 'manager', 'admin'
    face_encoding = Column(LargeBinary, nullable=True)  # Can be null initially
    is_active = Column(Boolean, default=True, index=True)
    
    # User Preferences
    theme_preference = Column(String(20), default='light')  # 'light' or 'dark'
    language_preference = Column(String(10), default='id')  # 'id' (Indonesian) or 'en' (English)
    date_format_preference = Column(String(20), default='indonesian')  # 'indonesian' or 'standard'
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    sent_messages = relationship("ChatMessage", foreign_keys="ChatMessage.sender_id", back_populates="sender")
    received_messages = relationship("ChatMessage", foreign_keys="ChatMessage.recipient_id", back_populates="recipient")
    uploaded_documents = relationship("Document", back_populates="employee")
    face_encodings = relationship("EmployeeFaceEncoding", back_populates="employee", cascade="all, delete-orphan")

# Backward compatibility: Keep User as alias for Employee
User = Employee

class Attendance(Base):
    """Attendance records with enhanced tracking"""
    __tablename__ = 'attendance'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), ForeignKey('employees.employee_id'), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    location = Column(String(255), nullable=True)  # Optional: office location
    check_in_type = Column(String(50), default='face_recognition')  # 'face_recognition', 'manual', 'qr_code'
    confidence_score = Column(Integer, nullable=True)  # Face recognition confidence (0-100)
    notes = Column(Text, nullable=True)
    
    employee = relationship("Employee", back_populates="attendances")

# Composite index for efficient date-range queries
Index('idx_attendance_employee_date', Attendance.employee_id, Attendance.timestamp)

class EmployeeFaceEncoding(Base):
    """Multiple face encodings per employee for better accuracy"""
    __tablename__ = 'employee_face_encodings'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), ForeignKey('employees.employee_id'), nullable=False, index=True)
    face_encoding = Column(LargeBinary, nullable=False)  # Face encoding bytes
    photo_index = Column(Integer, nullable=False)  # Photo number (1, 2, 3)
    quality_score = Column(Integer, nullable=True)  # Quality score (0-100)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    employee = relationship("Employee", back_populates="face_encodings")

# Composite index for efficient queries
Index('idx_face_encoding_employee', EmployeeFaceEncoding.employee_id, EmployeeFaceEncoding.created_at)


class ChatMessage(Base):
    """Real-time chat messages between employees"""
    __tablename__ = 'chat_messages'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sender_id = Column(String(50), ForeignKey('employees.employee_id'), nullable=False, index=True)
    recipient_id = Column(String(50), ForeignKey('employees.employee_id'), nullable=False, index=True)
    message_text = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)  # Path to uploaded file
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)  # 'image', 'document', 'pdf'
    file_size = Column(Integer, nullable=True)  # In bytes
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    sender = relationship("Employee", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship("Employee", foreign_keys=[recipient_id], back_populates="received_messages")

# Composite index for efficient conversation queries
Index('idx_chat_conversation', ChatMessage.sender_id, ChatMessage.recipient_id, ChatMessage.created_at)

class Document(Base):
    """Uploaded documents for OCR and file management"""
    __tablename__ = 'documents'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), ForeignKey('employees.employee_id'), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # 'pdf', 'image', 'word'
    file_size = Column(Integer, nullable=False)  # In bytes
    document_type = Column(String(100), nullable=True)  # 'ktp', 'contract', 'invoice', 'other'
    ocr_text = Column(Text, nullable=True)  # Extracted text from OCR
    ocr_confidence = Column(Integer, nullable=True)  # OCR confidence score (0-100)
    is_processed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    employee = relationship("Employee", back_populates="uploaded_documents")

# Index for searching documents by type
Index('idx_document_type', Document.employee_id, Document.document_type, Document.created_at)

class OnlineStatus(Base):
    """Track employee online status for real-time chat"""
    __tablename__ = 'online_status'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), ForeignKey('employees.employee_id'), unique=True, nullable=False, index=True)
    is_online = Column(Boolean, default=False, index=True)
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)
    socket_id = Column(String(100), nullable=True)  # Socket.IO session ID
