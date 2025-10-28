"""
Centralized Configuration Management
No hardcoded paths - fully portable and environment-aware
"""
import os
from pathlib import Path
from typing import Dict, List

class Config:
    """Base configuration with universal paths"""
    
    # ==================== PATH MANAGEMENT ====================
    # Base directory - works anywhere, not hardcoded to /app
    BASE_DIR = Path(__file__).parent.absolute()
    
    # Instance directory for database
    INSTANCE_DIR = BASE_DIR / 'instance'
    INSTANCE_DIR.mkdir(parents=True, exist_ok=True)
    
    # File uploads directory
    UPLOAD_BASE = BASE_DIR / 'uploads'
    UPLOAD_BASE.mkdir(exist_ok=True)
    
    UPLOAD_FOLDERS = {
        'faces': UPLOAD_BASE / 'faces',
        'documents': UPLOAD_BASE / 'documents',
        'chat_files': UPLOAD_BASE / 'chat_files',
        'temp': UPLOAD_BASE / 'temp',
    }
    
    # Create all upload folders
    for folder in UPLOAD_FOLDERS.values():
        folder.mkdir(parents=True, exist_ok=True)
    
    # Logging directory
    LOG_DIR = BASE_DIR / 'logs'
    LOG_DIR.mkdir(exist_ok=True)
    LOG_FILE = LOG_DIR / 'app.log'
    ERROR_LOG_FILE = LOG_DIR / 'error.log'
    
    # ==================== DATABASE ====================
    DATABASE_URL = os.environ.get('DATABASE_URL') or \
                   f"sqlite:///{INSTANCE_DIR / 'attendance.db'}"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    # ==================== SECURITY ====================
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'unipresence-enterprise-secret-key-2025')
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = int(os.environ.get('JWT_EXPIRES_HOURS', 24))
    
    # Password hashing
    BCRYPT_LOG_ROUNDS = 12
    
    # ==================== FILE UPLOAD ====================
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_CHAT_FILE_SIZE = 5 * 1024 * 1024  # 5MB for chat
    
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
    ALLOWED_DOCUMENT_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'}
    ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_DOCUMENT_EXTENSIONS
    
    # ==================== FACE RECOGNITION ====================
    # Face detection model: 'hog' (fast, CPU) or 'cnn' (accurate, GPU)
    FACE_DETECTION_MODEL = os.environ.get('FACE_MODEL', 'hog')
    
    # Face recognition tolerance (lower = stricter)
    FACE_RECOGNITION_TOLERANCE = float(os.environ.get('FACE_TOLERANCE', 0.6))
    
    # Minimum image dimensions for face detection
    MIN_IMAGE_WIDTH = 640
    MIN_IMAGE_HEIGHT = 480
    
    # Maximum image dimensions (resize if larger)
    MAX_IMAGE_WIDTH = 1920
    MAX_IMAGE_HEIGHT = 1080
    
    # ==================== OCR CONFIGURATION ====================
    # OCR language (for Tesseract)
    OCR_LANGUAGE = 'ind+eng'  # Indonesian + English
    
    # Minimum OCR confidence score (0-100)
    MIN_OCR_CONFIDENCE = 60
    
    # OCR preprocessing options
    OCR_PREPROCESSING = {
        'grayscale': True,
        'threshold': True,
        'denoise': True,
        'deskew': True,
    }
    
    # ==================== ATTENDANCE ====================
    # Work schedule (24-hour format)
    WORK_START_TIME = '08:00'
    WORK_END_TIME = '17:00'
    LATE_THRESHOLD_MINUTES = 15  # Late if after 08:15
    EARLY_LEAVE_THRESHOLD_MINUTES = 30  # Early if before 16:30
    
    # Attendance marking rules
    ALLOW_MULTIPLE_ATTENDANCE_PER_DAY = False
    ATTENDANCE_LOCATION_TRACKING = False
    
    # ==================== INTERNATIONALIZATION ====================
    # Supported languages
    SUPPORTED_LANGUAGES = ['id', 'en']
    DEFAULT_LANGUAGE = 'id'  # Indonesian as default
    
    # Date format options
    DATE_FORMATS = {
        'indonesian': '%d %B %Y, %H:%M WIB',
        'standard': '%Y-%m-%d %H:%M',
    }
    DEFAULT_DATE_FORMAT = 'indonesian'
    
    # ==================== INDONESIAN BUSINESS STANDARDS ====================
    # Standard departments in Indonesian companies
    STANDARD_DEPARTMENTS: List[str] = [
        'Teknologi Informasi',
        'Sumber Daya Manusia',
        'Keuangan',
        'Pemasaran',
        'Penjualan',
        'Operasional',
        'Produksi',
        'Logistik',
        'Penelitian & Pengembangan',
        'Layanan Pelanggan',
        'Hukum & Kepatuhan',
        'Administrasi',
    ]
    
    # Standard positions/roles
    STANDARD_POSITIONS: Dict[str, List[str]] = {
        'executive': [
            'Direktur Utama',
            'Direktur',
            'General Manager',
        ],
        'management': [
            'Manajer',
            'Asisten Manajer',
            'Supervisor',
            'Team Leader',
        ],
        'staff': [
            'Staff Senior',
            'Staff',
            'Staff Junior',
            'Operator',
            'Teknisi',
        ],
        'specialist': [
            'Spesialis',
            'Analis',
            'Engineer',
            'Developer',
            'Designer',
        ]
    }
    
    # User roles
    USER_ROLES = ['employee', 'manager', 'admin']
    
    # Document types (Indonesian)
    DOCUMENT_TYPES: Dict[str, str] = {
        'ktp': 'KTP (Kartu Tanda Penduduk)',
        'kk': 'Kartu Keluarga',
        'npwp': 'NPWP (Nomor Pokok Wajib Pajak)',
        'bpjs': 'BPJS Kesehatan/Ketenagakerjaan',
        'ijazah': 'Ijazah',
        'cv': 'Curriculum Vitae',
        'surat_lamaran': 'Surat Lamaran',
        'kontrak': 'Kontrak Kerja',
        'sk': 'Surat Keputusan',
        'slip_gaji': 'Slip Gaji',
        'other': 'Lainnya',
    }
    
    # Attendance status
    ATTENDANCE_STATUS: Dict[str, str] = {
        'hadir': 'Hadir',
        'terlambat': 'Terlambat',
        'izin': 'Izin',
        'sakit': 'Sakit',
        'alpha': 'Alpha',
        'cuti': 'Cuti',
    }
    
    # ==================== REAL-TIME CHAT ====================
    # Socket.IO configuration
    SOCKETIO_CORS_ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:5173',
        os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    ]
    
    # Online status timeout (minutes)
    ONLINE_STATUS_TIMEOUT = 5  # Consider offline after 5 minutes
    
    # Chat message retention (days)
    CHAT_MESSAGE_RETENTION_DAYS = 90
    
    # ==================== API CONFIGURATION ====================
    # CORS origins
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:5173',
        os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    ]
    
    # API rate limiting
    RATE_LIMIT_ENABLED = os.environ.get('RATE_LIMIT_ENABLED', 'True').lower() == 'true'
    RATE_LIMIT_DEFAULT = '100 per hour'
    RATE_LIMIT_LOGIN = '5 per minute'
    RATE_LIMIT_UPLOAD = '10 per minute'
    
    # ==================== LOGGING ====================
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 10
    
    # ==================== DEVELOPMENT/PRODUCTION ====================
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    TESTING = os.environ.get('TESTING', 'False').lower() == 'true'
    
    # Server configuration
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 8001))


class DevelopmentConfig(Config):
    """Development-specific configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True
    LOG_LEVEL = 'DEBUG'


class ProductionConfig(Config):
    """Production-specific configuration"""
    DEBUG = False
    SQLALCHEMY_ECHO = False
    LOG_LEVEL = 'WARNING'
    
    # Production must have secure secret key
    @property
    def JWT_SECRET_KEY(self):
        secret = os.environ.get('JWT_SECRET_KEY')
        if not secret or secret == Config.JWT_SECRET_KEY:
            raise ValueError(
                "JWT_SECRET_KEY must be set in environment for production!"
            )
        return secret


class TestingConfig(Config):
    """Testing-specific configuration"""
    TESTING = True
    DEBUG = True
    
    # Use in-memory database for tests
    DATABASE_URL = 'sqlite:///:memory:'
    
    # Disable CSRF for testing
    WTF_CSRF_ENABLED = False


# Configuration dictionary
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(config_name: str = None) -> Config:
    """
    Get configuration based on environment
    
    Args:
        config_name: 'development', 'production', 'testing', or None
                    If None, reads from FLASK_ENV environment variable
    
    Returns:
        Configuration object
    """
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    return config_by_name.get(config_name, DevelopmentConfig)
