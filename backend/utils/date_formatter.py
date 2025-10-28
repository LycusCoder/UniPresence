"""
Date and time formatting utilities
Supports Indonesian and standard formats
"""
from datetime import datetime, date
from typing import Optional

# Indonesian month names
INDONESIAN_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

# Indonesian day names
INDONESIAN_DAYS = [
    'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
]


def format_datetime(
    dt: datetime, 
    format_type: str = 'indonesian',
    include_day: bool = False
) -> str:
    """
    Format datetime based on user preference
    
    Args:
        dt: datetime object
        format_type: 'indonesian' or 'standard'
        include_day: Include day name (e.g., 'Senin, 1 Agustus 2025')
    
    Returns:
        Formatted datetime string
    
    Examples:
        >>> dt = datetime(2025, 8, 1, 14, 30)
        >>> format_datetime(dt, 'indonesian')
        '1 Agustus 2025, 14:30 WIB'
        >>> format_datetime(dt, 'standard')
        '2025-08-01 14:30'
        >>> format_datetime(dt, 'indonesian', include_day=True)
        'Jumat, 1 Agustus 2025, 14:30 WIB'
    """
    if format_type == 'indonesian':
        month = INDONESIAN_MONTHS[dt.month - 1]
        time_str = dt.strftime('%H:%M')
        
        if include_day:
            day_name = INDONESIAN_DAYS[dt.weekday()]
            return f"{day_name}, {dt.day} {month} {dt.year}, {time_str} WIB"
        
        return f"{dt.day} {month} {dt.year}, {time_str} WIB"
    else:
        # Standard format: YYYY-MM-DD HH:MM
        return dt.strftime('%Y-%m-%d %H:%M')


def format_date(
    d: date, 
    format_type: str = 'indonesian',
    include_day: bool = False
) -> str:
    """
    Format date based on user preference
    
    Args:
        d: date object
        format_type: 'indonesian' or 'standard'
        include_day: Include day name
    
    Returns:
        Formatted date string
    
    Examples:
        >>> d = date(2025, 8, 1)
        >>> format_date(d, 'indonesian')
        '1 Agustus 2025'
        >>> format_date(d, 'standard')
        '2025-08-01'
    """
    if format_type == 'indonesian':
        month = INDONESIAN_MONTHS[d.month - 1]
        
        if include_day:
            day_name = INDONESIAN_DAYS[d.weekday()]
            return f"{day_name}, {d.day} {month} {d.year}"
        
        return f"{d.day} {month} {d.year}"
    else:
        return d.strftime('%Y-%m-%d')


def format_time(dt: datetime, format_type: str = 'indonesian') -> str:
    """
    Format time only
    
    Args:
        dt: datetime object
        format_type: 'indonesian' or 'standard'
    
    Returns:
        Formatted time string
    
    Examples:
        >>> dt = datetime(2025, 8, 1, 14, 30)
        >>> format_time(dt, 'indonesian')
        '14:30 WIB'
        >>> format_time(dt, 'standard')
        '14:30'
    """
    time_str = dt.strftime('%H:%M')
    
    if format_type == 'indonesian':
        return f"{time_str} WIB"
    
    return time_str


def get_relative_time(dt: datetime, lang: str = 'id') -> str:
    """
    Get relative time string (e.g., '2 jam yang lalu', '5 minutes ago')
    
    Args:
        dt: datetime object
        lang: Language code ('id' or 'en')
    
    Returns:
        Relative time string
    """
    now = datetime.now()
    diff = now - dt
    
    seconds = diff.total_seconds()
    minutes = seconds / 60
    hours = minutes / 60
    days = hours / 24
    
    if lang == 'id':
        if seconds < 60:
            return 'baru saja'
        elif minutes < 60:
            return f'{int(minutes)} menit yang lalu'
        elif hours < 24:
            return f'{int(hours)} jam yang lalu'
        elif days < 7:
            return f'{int(days)} hari yang lalu'
        elif days < 30:
            weeks = int(days / 7)
            return f'{weeks} minggu yang lalu'
        elif days < 365:
            months = int(days / 30)
            return f'{months} bulan yang lalu'
        else:
            years = int(days / 365)
            return f'{years} tahun yang lalu'
    else:  # English
        if seconds < 60:
            return 'just now'
        elif minutes < 60:
            m = int(minutes)
            return f'{m} minute{"s" if m != 1 else ""} ago'
        elif hours < 24:
            h = int(hours)
            return f'{h} hour{"s" if h != 1 else ""} ago'
        elif days < 7:
            d = int(days)
            return f'{d} day{"s" if d != 1 else ""} ago'
        elif days < 30:
            w = int(days / 7)
            return f'{w} week{"s" if w != 1 else ""} ago'
        elif days < 365:
            m = int(days / 30)
            return f'{m} month{"s" if m != 1 else ""} ago'
        else:
            y = int(days / 365)
            return f'{y} year{"s" if y != 1 else ""} ago'
