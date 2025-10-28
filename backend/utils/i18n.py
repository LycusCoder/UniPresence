"""
Internationalization (i18n) utilities
Supports Indonesian (id) and English (en)
"""
from typing import Dict, Optional

# Translation dictionary
TRANSLATIONS: Dict[str, Dict[str, str]] = {
    'id': {
        # Common
        'welcome': 'Selamat datang',
        'loading': 'Memuat...',
        'save': 'Simpan',
        'cancel': 'Batal',
        'delete': 'Hapus',
        'edit': 'Ubah',
        'search': 'Cari',
        'filter': 'Filter',
        'export': 'Ekspor',
        'import': 'Impor',
        'success': 'Berhasil',
        'error': 'Gagal',
        
        # Authentication
        'login_success': 'Login berhasil',
        'login_failed': 'Login gagal',
        'logout_success': 'Logout berhasil',
        'invalid_credentials': 'NIP atau password salah',
        'unauthorized': 'Anda tidak memiliki akses',
        'token_expired': 'Sesi Anda telah berakhir, silakan login kembali',
        'access_denied': 'Akses ditolak',
        
        # Employee Management
        'employee_created': 'Karyawan berhasil ditambahkan',
        'employee_updated': 'Data karyawan berhasil diperbarui',
        'employee_deleted': 'Karyawan berhasil dihapus',
        'employee_not_found': 'Karyawan tidak ditemukan',
        'employee_id_exists': 'NIP sudah terdaftar',
        'email_exists': 'Email sudah terdaftar',
        
        # Attendance
        'attendance_marked': 'Absensi berhasil dicatat',
        'attendance_already_marked': 'Absensi sudah tercatat hari ini',
        'attendance_updated': 'Data absensi berhasil diperbarui',
        'attendance_not_found': 'Data absensi tidak ditemukan',
        
        # Face Recognition
        'face_detected': 'Wajah terdeteksi',
        'face_not_detected': 'Wajah tidak terdeteksi',
        'face_registered': 'Wajah berhasil didaftarkan',
        'face_updated': 'Wajah berhasil diperbarui',
        'face_match': 'Wajah cocok',
        'face_no_match': 'Wajah tidak cocok',
        'multiple_faces': 'Terdeteksi lebih dari satu wajah',
        'mask_detected': 'Harap lepas masker untuk verifikasi wajah',
        'face_quality_low': 'Kualitas wajah terlalu rendah, pastikan pencahayaan cukup',
        'face_too_far': 'Wajah terlalu jauh, mohon mendekat ke kamera',
        'face_too_close': 'Wajah terlalu dekat, mohon menjauh dari kamera',
        
        # Document/OCR
        'document_uploaded': 'Dokumen berhasil diunggah',
        'document_processed': 'Dokumen berhasil diproses',
        'document_deleted': 'Dokumen berhasil dihapus',
        'ocr_success': 'Teks berhasil diekstrak',
        'ocr_failed': 'Gagal mengekstrak teks',
        'ocr_low_confidence': 'Teks tidak jelas, mohon gunakan gambar yang lebih baik',
        'image_enhanced': 'Gambar berhasil ditingkatkan',
        
        # Chat
        'message_sent': 'Pesan terkirim',
        'message_failed': 'Gagal mengirim pesan',
        'message_deleted': 'Pesan dihapus',
        'file_uploaded': 'File berhasil diunggah',
        'file_too_large': 'Ukuran file terlalu besar',
        'user_online': 'Online',
        'user_offline': 'Offline',
        'typing': 'sedang mengetik...',
        
        # Errors
        'server_error': 'Terjadi kesalahan server',
        'network_error': 'Kesalahan jaringan',
        'invalid_input': 'Input tidak valid',
        'required_field': 'Field wajib diisi',
        'invalid_format': 'Format tidak valid',
        'file_too_large': 'Ukuran file terlalu besar (maksimal 10MB)',
        'invalid_file_type': 'Tipe file tidak didukung',
        'not_found': 'Data tidak ditemukan',
        'database_error': 'Kesalahan database',
        
        # Settings
        'settings_updated': 'Pengaturan berhasil diperbarui',
        'password_changed': 'Password berhasil diubah',
        'password_incorrect': 'Password lama salah',
        'password_weak': 'Password terlalu lemah (minimal 6 karakter)',
        'theme_changed': 'Tema berhasil diubah',
        'language_changed': 'Bahasa berhasil diubah',
    },
    'en': {
        # Common
        'welcome': 'Welcome',
        'loading': 'Loading...',
        'save': 'Save',
        'cancel': 'Cancel',
        'delete': 'Delete',
        'edit': 'Edit',
        'search': 'Search',
        'filter': 'Filter',
        'export': 'Export',
        'import': 'Import',
        'success': 'Success',
        'error': 'Error',
        
        # Authentication
        'login_success': 'Login successful',
        'login_failed': 'Login failed',
        'logout_success': 'Logout successful',
        'invalid_credentials': 'Invalid employee ID or password',
        'unauthorized': 'You do not have access',
        'token_expired': 'Your session has expired, please login again',
        'access_denied': 'Access denied',
        
        # Employee Management
        'employee_created': 'Employee added successfully',
        'employee_updated': 'Employee updated successfully',
        'employee_deleted': 'Employee deleted successfully',
        'employee_not_found': 'Employee not found',
        'employee_id_exists': 'Employee ID already exists',
        'email_exists': 'Email already exists',
        
        # Attendance
        'attendance_marked': 'Attendance marked successfully',
        'attendance_already_marked': 'Already attended today',
        'attendance_updated': 'Attendance updated successfully',
        'attendance_not_found': 'Attendance record not found',
        
        # Face Recognition
        'face_detected': 'Face detected',
        'face_not_detected': 'Face not detected',
        'face_registered': 'Face registered successfully',
        'face_updated': 'Face updated successfully',
        'face_match': 'Face matched',
        'face_no_match': 'Face does not match',
        'multiple_faces': 'Multiple faces detected',
        'mask_detected': 'Please remove mask for face verification',
        'face_quality_low': 'Face quality too low, ensure good lighting',
        'face_too_far': 'Face too far, please move closer to camera',
        'face_too_close': 'Face too close, please move away from camera',
        
        # Document/OCR
        'document_uploaded': 'Document uploaded successfully',
        'document_processed': 'Document processed successfully',
        'document_deleted': 'Document deleted successfully',
        'ocr_success': 'Text extracted successfully',
        'ocr_failed': 'Failed to extract text',
        'ocr_low_confidence': 'Text unclear, please use better quality image',
        'image_enhanced': 'Image enhanced successfully',
        
        # Chat
        'message_sent': 'Message sent',
        'message_failed': 'Failed to send message',
        'message_deleted': 'Message deleted',
        'file_uploaded': 'File uploaded successfully',
        'file_too_large': 'File size too large',
        'user_online': 'Online',
        'user_offline': 'Offline',
        'typing': 'is typing...',
        
        # Errors
        'server_error': 'Server error occurred',
        'network_error': 'Network error',
        'invalid_input': 'Invalid input',
        'required_field': 'Required field',
        'invalid_format': 'Invalid format',
        'file_too_large': 'File size too large (max 10MB)',
        'invalid_file_type': 'File type not supported',
        'not_found': 'Not found',
        'database_error': 'Database error',
        
        # Settings
        'settings_updated': 'Settings updated successfully',
        'password_changed': 'Password changed successfully',
        'password_incorrect': 'Incorrect old password',
        'password_weak': 'Password too weak (minimum 6 characters)',
        'theme_changed': 'Theme changed successfully',
        'language_changed': 'Language changed successfully',
    }
}


def translate(key: str, lang: str = 'id', **kwargs) -> str:
    """
    Get translated message
    
    Args:
        key: Translation key
        lang: Language code ('id' or 'en')
        **kwargs: Optional parameters for string formatting
    
    Returns:
        Translated string
    
    Example:
        >>> translate('welcome', 'id')
        'Selamat datang'
        >>> translate('face_detected', 'en')
        'Face detected'
    """
    # Get translation or return key if not found
    translation = TRANSLATIONS.get(lang, TRANSLATIONS['id']).get(key, key)
    
    # Format with kwargs if provided
    if kwargs:
        try:
            translation = translation.format(**kwargs)
        except (KeyError, IndexError):
            pass
    
    return translation


def get_user_language(employee_id: str, session=None) -> str:
    """
    Get employee's language preference from database
    
    Args:
        employee_id: Employee ID
        session: SQLAlchemy session (optional)
    
    Returns:
        Language code ('id' or 'en'), defaults to 'id'
    """
    if session is None:
        # If no session provided, return default
        return 'id'
    
    try:
        from models import Employee
        employee = session.query(Employee).filter_by(employee_id=employee_id).first()
        
        if employee and employee.language_preference:
            return employee.language_preference
    except Exception:
        pass
    
    # Default to Indonesian
    return 'id'


def get_supported_languages() -> Dict[str, str]:
    """
    Get list of supported languages
    
    Returns:
        Dictionary of language codes and names
    """
    return {
        'id': 'Bahasa Indonesia',
        'en': 'English'
    }
