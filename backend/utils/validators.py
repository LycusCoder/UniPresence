"""
Input validation utilities
"""
import re
from typing import Optional, Tuple


def validate_employee_id(employee_id: str) -> Tuple[bool, Optional[str]]:
    """
    Validate employee ID format
    Format: EMP + YYYYMM + NNN (e.g., EMP202508001)
    
    Args:
        employee_id: Employee ID string
    
    Returns:
        Tuple of (is_valid, error_message)
    
    Examples:
        >>> validate_employee_id('EMP202508001')
        (True, None)
        >>> validate_employee_id('ABC123')
        (False, 'Format NIP tidak valid')
    """
    if not employee_id or not isinstance(employee_id, str):
        return False, 'NIP harus diisi'
    
    # Remove whitespace
    employee_id = employee_id.strip()
    
    # Check format: EMP + YYYYMM + NNN (11 characters total)
    if not re.match(r'^EMP\d{9}$', employee_id):
        return False, 'Format NIP tidak valid (contoh: EMP202508001)'
    
    # Validate year (should be reasonable)
    year = int(employee_id[3:7])
    if year < 2000 or year > 2100:
        return False, 'Tahun dalam NIP tidak valid'
    
    # Validate month
    month = int(employee_id[7:9])
    if month < 1 or month > 12:
        return False, 'Bulan dalam NIP tidak valid'
    
    return True, None


def validate_email(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email format
    
    Args:
        email: Email string
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not email:
        return False, 'Email harus diisi'
    
    email = email.strip().lower()
    
    # Basic email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(pattern, email):
        return False, 'Format email tidak valid'
    
    if len(email) > 255:
        return False, 'Email terlalu panjang (maksimal 255 karakter)'
    
    return True, None


def validate_phone(phone: str) -> Tuple[bool, Optional[str]]:
    """
    Validate Indonesian phone number
    Formats: 08xx, +628xx, 628xx
    
    Args:
        phone: Phone number string
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not phone:
        return False, 'Nomor telepon harus diisi'
    
    # Remove spaces, dashes, parentheses
    phone = re.sub(r'[\s\-\(\)]', '', phone)
    
    # Check Indonesian formats
    patterns = [
        r'^08\d{8,11}$',      # 08xxxxxxxxxx (10-13 digits)
        r'^\+628\d{8,11}$',   # +628xxxxxxxxx
        r'^628\d{8,11}$',     # 628xxxxxxxxx
    ]
    
    for pattern in patterns:
        if re.match(pattern, phone):
            return True, None
    
    return False, 'Format nomor telepon tidak valid (contoh: 081234567890)'


def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validate password strength
    
    Args:
        password: Password string
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not password:
        return False, 'Password harus diisi'
    
    if len(password) < 6:
        return False, 'Password minimal 6 karakter'
    
    if len(password) > 128:
        return False, 'Password maksimal 128 karakter'
    
    # Optional: Check for common weak passwords
    weak_passwords = ['password', '123456', 'admin123', 'qwerty']
    if password.lower() in weak_passwords:
        return False, 'Password terlalu lemah, gunakan password yang lebih kuat'
    
    return True, None


def validate_name(name: str) -> Tuple[bool, Optional[str]]:
    """
    Validate person name
    
    Args:
        name: Name string
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name:
        return False, 'Nama harus diisi'
    
    name = name.strip()
    
    if len(name) < 2:
        return False, 'Nama minimal 2 karakter'
    
    if len(name) > 255:
        return False, 'Nama maksimal 255 karakter'
    
    # Check for invalid characters (allow letters, spaces, apostrophes, hyphens)
    if not re.match(r"^[a-zA-Z\s'\-\.]+$", name):
        return False, 'Nama hanya boleh berisi huruf, spasi, dan tanda hubung'
    
    return True, None


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent security issues
    
    Args:
        filename: Original filename
    
    Returns:
        Sanitized filename
    """
    # Remove path components
    filename = filename.split('/')[-1].split('\\')[-1]
    
    # Remove dangerous characters
    filename = re.sub(r'[^\w\s\-\.]', '_', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:240] + ('.' + ext if ext else '')
    
    return filename
