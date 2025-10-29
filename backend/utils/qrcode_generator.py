"""
QR Code Generation System for Employee E-Cards
Secure QR codes with encrypted signature for attendance verification
"""

import qrcode
import io
import base64
import hashlib
import hmac
from datetime import datetime
from typing import Dict, Tuple, Optional
from PIL import Image

# Secret key for QR code signature (should be in environment variable in production)
QR_SECRET_KEY = "unipr3s3nc3_qr_s3cr3t_k3y_2025"  # Change in production!


def generate_qr_signature(employee_id: str, timestamp: str, secret_key: str = QR_SECRET_KEY) -> str:
    """
    Generate HMAC signature for QR code validation
    
    Args:
        employee_id: Employee ID
        timestamp: ISO format timestamp
        secret_key: Secret key for HMAC
    
    Returns:
        Hex signature string
    """
    message = f"{employee_id}:{timestamp}"
    signature = hmac.new(
        secret_key.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Return first 16 characters for compact QR code
    return signature[:16]


def verify_qr_signature(employee_id: str, timestamp: str, signature: str, secret_key: str = QR_SECRET_KEY) -> bool:
    """
    Verify QR code signature
    
    Args:
        employee_id: Employee ID from QR code
        timestamp: Timestamp from QR code
        signature: Signature from QR code
        secret_key: Secret key for HMAC
    
    Returns:
        True if signature is valid, False otherwise
    """
    expected_signature = generate_qr_signature(employee_id, timestamp, secret_key)
    return hmac.compare_digest(signature, expected_signature)


def generate_employee_qr_code(
    employee_id: str,
    employee_name: str,
    include_timestamp: bool = True,
    size: int = 300,
    border: int = 2
) -> Tuple[str, Dict]:
    """
    Generate QR code for employee e-card
    
    Format: {employee_id}:{timestamp}:{signature}
    
    Args:
        employee_id: Unique employee identifier
        employee_name: Employee name (for metadata)
        include_timestamp: Whether to include generation timestamp
        size: QR code size in pixels (default: 300x300)
        border: Border size (default: 2 boxes)
    
    Returns:
        Tuple of (base64_image_string, qr_metadata_dict)
    """
    try:
        # Generate timestamp
        if include_timestamp:
            timestamp = datetime.utcnow().isoformat()
        else:
            timestamp = "PERMANENT"
        
        # Generate signature
        signature = generate_qr_signature(employee_id, timestamp)
        
        # Create QR data
        qr_data = f"{employee_id}:{timestamp}:{signature}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,  # Auto-adjust size
            error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction (30%)
            box_size=10,
            border=border,
        )
        
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Resize to desired size
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        # Metadata
        metadata = {
            'employee_id': employee_id,
            'employee_name': employee_name,
            'qr_data': qr_data,
            'timestamp': timestamp,
            'signature': signature,
            'generated_at': datetime.utcnow().isoformat(),
            'size': f"{size}x{size}",
            'format': 'PNG'
        }
        
        return img_base64, metadata
    
    except Exception as e:
        print(f"Error generating QR code: {e}")
        raise


def parse_qr_data(qr_data: str) -> Dict[str, str]:
    """
    Parse QR code data string
    
    Args:
        qr_data: QR code data string (format: employee_id:timestamp:signature)
    
    Returns:
        Dictionary with parsed data
    """
    try:
        parts = qr_data.split(':')
        
        if len(parts) != 3:
            return {
                'valid': False,
                'error': 'Format QR code tidak valid'
            }
        
        employee_id, timestamp, signature = parts
        
        return {
            'valid': True,
            'employee_id': employee_id,
            'timestamp': timestamp,
            'signature': signature
        }
    
    except Exception as e:
        return {
            'valid': False,
            'error': f'Error parsing QR data: {str(e)}'
        }


def validate_qr_code(qr_data: str, max_age_hours: Optional[int] = None) -> Dict:
    """
    Validate QR code data
    
    Args:
        qr_data: QR code data string
        max_age_hours: Maximum age of QR code in hours (None = no expiry)
    
    Returns:
        {
            'valid': bool,
            'employee_id': str (if valid),
            'error': str (if invalid),
            'age_hours': float (if timestamped)
        }
    """
    try:
        # Parse QR data
        parsed = parse_qr_data(qr_data)
        
        if not parsed.get('valid'):
            return parsed
        
        employee_id = parsed['employee_id']
        timestamp = parsed['timestamp']
        signature = parsed['signature']
        
        # Verify signature
        if not verify_qr_signature(employee_id, timestamp, signature):
            return {
                'valid': False,
                'error': 'QR code tidak valid atau telah dimodifikasi'
            }
        
        # Check expiry (if timestamped and max_age specified)
        if timestamp != "PERMANENT" and max_age_hours is not None:
            try:
                qr_time = datetime.fromisoformat(timestamp)
                current_time = datetime.utcnow()
                age = (current_time - qr_time).total_seconds() / 3600  # hours
                
                if age > max_age_hours:
                    return {
                        'valid': False,
                        'error': f'QR code kadaluarsa (umur: {age:.1f} jam)',
                        'age_hours': age
                    }
                
                return {
                    'valid': True,
                    'employee_id': employee_id,
                    'age_hours': age
                }
            
            except ValueError:
                return {
                    'valid': False,
                    'error': 'Format timestamp tidak valid'
                }
        
        # Valid (no expiry check)
        return {
            'valid': True,
            'employee_id': employee_id
        }
    
    except Exception as e:
        return {
            'valid': False,
            'error': f'Error validating QR code: {str(e)}'
        }


def generate_qr_code_download_url(employee_id: str, employee_name: str) -> str:
    """
    Generate URL for QR code download (for API response)
    
    Args:
        employee_id: Employee ID
        employee_name: Employee name
    
    Returns:
        API endpoint URL
    """
    return f"/api/employee/qrcode/{employee_id}"


# Cache for QR codes (in-memory, temporary)
_qr_cache = {}

def get_cached_qr_code(employee_id: str, employee_name: str, cache_minutes: int = 60) -> Optional[Tuple[str, Dict]]:
    """
    Get QR code from cache if available and not expired
    
    Args:
        employee_id: Employee ID
        employee_name: Employee name
        cache_minutes: Cache expiry in minutes
    
    Returns:
        Cached QR code or None
    """
    cache_key = f"{employee_id}:{employee_name}"
    
    if cache_key in _qr_cache:
        cached_data, cached_time = _qr_cache[cache_key]
        
        # Check if cache is still valid
        age_minutes = (datetime.utcnow() - cached_time).total_seconds() / 60
        
        if age_minutes < cache_minutes:
            print(f"✅ QR code cache hit for {employee_id} (age: {age_minutes:.1f} min)")
            return cached_data
    
    return None


def cache_qr_code(employee_id: str, employee_name: str, qr_data: Tuple[str, Dict]):
    """
    Cache QR code in memory
    
    Args:
        employee_id: Employee ID
        employee_name: Employee name
        qr_data: QR code data tuple (base64, metadata)
    """
    cache_key = f"{employee_id}:{employee_name}"
    _qr_cache[cache_key] = (qr_data, datetime.utcnow())
    print(f"💾 QR code cached for {employee_id}")


def clear_qr_cache():
    """Clear all cached QR codes"""
    global _qr_cache
    _qr_cache = {}
    print("🗑️ QR code cache cleared")
