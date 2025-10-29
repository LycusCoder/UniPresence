# 🏆 Golden Rules - Enterprise Employee Management System

> **Dokumen ini berisi standar, best practices, dan pedoman pengembangan untuk memastikan kualitas code, keamanan, dan maintainability sistem.**

**Last Updated:** 2025-08-01  
**Project:** UniPresence Enterprise - Employee Management System  
**Tech Stack:** Python Flask, React TypeScript, SQLite, Socket.IO

---

## 📚 Table of Contents

1. [Core Principles](#core-principles)
2. [⚠️ CRITICAL: URL & Port Configuration](#critical-url--port-configuration)
3. [Code Standards](#code-standards)
4. [Architecture Guidelines](#architecture-guidelines)
5. [Path Management & Portability](#path-management--portability)
6. [Multi-Language Support (i18n)](#multi-language-support-i18n)
7. [Database Best Practices](#database-best-practices)
8. [Security Standards](#security-standards)
9. [Image Processing Guidelines](#image-processing-guidelines)
10. [Real-time Communication](#real-time-communication)
11. [API Design](#api-design)
12. [Testing Requirements](#testing-requirements)
13. [Documentation Standards](#documentation-standards)
14. [Indonesian Business Standards](#indonesian-business-standards)

---

## ⚠️ CRITICAL: URL & Port Configuration

### **🚨 ABSOLUTE RULES - NEVER VIOLATE THESE:**

#### **1. NEVER Change These URLs/Ports:**
```bash
# ❌ FORBIDDEN - DO NOT MODIFY:
Frontend: localhost:3000  # NEVER change this
Backend:  localhost:8001  # NEVER change this

# ❌ FORBIDDEN - DO NOT ADD:
- External URLs in vite.config.ts HMR settings
- Preview URLs (nourivex.com) in config files
- Any hardcoded IP addresses or domains
```

#### **2. Allowed URL Configuration:**

**Frontend (.env)**
```bash
# ✅ ONLY ALLOWED:
VITE_BACKEND_URL=http://localhost:8001

# ❌ NEVER:
VITE_BACKEND_URL=http://0.0.0.0:8001  # WRONG!
VITE_BACKEND_URL=https://xxx.preview.nourivex.com  # WRONG!
```

**Backend (.env)**
```bash
# ✅ CORRECT:
PORT=8001
DATABASE_URL=sqlite:///instance/attendance.db

# ❌ NEVER hardcode full paths:
DATABASE_URL=sqlite:////app/backend/instance/attendance.db  # WRONG!
```

#### **3. Vite Config Rules:**

**vite.config.ts - CORRECT CONFIGURATION:**
```typescript
// ✅ CORRECT - Always use this exact config:
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Allow external connections
    port: 3000,
    hmr: {
      host: 'localhost',  // ✅ MUST be localhost
      port: 3000,         // ✅ MUST be 3000
    }
  },
});

// ❌ WRONG - NEVER do this:
server: {
  hmr: {
    host: 'xxx.preview.nourivex.com',  // ❌ FORBIDDEN!
    protocol: 'wss'  // ❌ Not needed for localhost
  }
}
```

#### **4. Why This Matters:**

**Issue:** Vite HMR WebSocket fails with errors like:
```
Firefox can't establish a connection to the server at 
wss://xxx.preview.nourivex.com:3000/
```

**Root Cause:**
- HMR (Hot Module Replacement) tries to connect via external URL
- WebSocket connection fails because it expects localhost

**Solution:**
- Always use `localhost` in HMR config
- Never use preview/external URLs in Vite config
- Browser will access via external URL, but HMR MUST use localhost

#### **5. Backend API Calls:**

**In React Components:**
```typescript
// ✅ CORRECT - Use environment variable:
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

// ❌ WRONG - Hardcoded:
const BACKEND_URL = 'http://localhost:8001';  // Don't hardcode!
const BACKEND_URL = 'http://0.0.0.0:8001';   // Wrong host!
```

#### **6. Supervisor Configuration:**

**Backend server.py:**
```python
# ✅ CORRECT:
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001, debug=False)

# ❌ WRONG:
if __name__ == '__main__':
    app.run(host='localhost', port=8001)  # Won't accept external connections!
```

**Why `0.0.0.0`?**
- Backend binds to `0.0.0.0:8001` to accept connections from anywhere
- Frontend calls it via `localhost:8001` (from .env)
- Supervisor maps external requests correctly

#### **7. Common Mistakes to Avoid:**

```typescript
// ❌ MISTAKE 1: External URL in HMR
hmr: {
  host: 'preview.nourivex.com'  // ❌ NEVER!
}

// ❌ MISTAKE 2: Hardcoded backend URL
const API_URL = "http://localhost:8001/api";  // ❌ No env var!

// ❌ MISTAKE 3: Wrong host
const API_URL = process.env.VITE_BACKEND_URL.replace('localhost', '0.0.0.0');  // ❌ WHY?!

// ❌ MISTAKE 4: Modifying .env with external URLs
VITE_BACKEND_URL=https://external-api.com  // ❌ Should be localhost!
```

#### **8. Verification Checklist:**

Before committing any code, verify:
- [ ] `vite.config.ts` HMR uses `localhost:3000`
- [ ] `.env` files use `localhost` URLs only
- [ ] No hardcoded URLs in React components
- [ ] Backend binds to `0.0.0.0` (not `localhost`)
- [ ] Frontend calls backend via `VITE_BACKEND_URL` env var
- [ ] No preview URLs in any config files

---

## 🎯 Core Principles

### 1. **Code Quality First**
- ✅ Write clean, readable, and maintainable code
- ✅ Follow DRY (Don't Repeat Yourself) principle
- ✅ Use meaningful variable and function names
- ✅ Keep functions small and focused (Single Responsibility Principle)

### 2. **Performance Matters**
- ⚡ Optimize database queries (use indexes, avoid N+1 queries)
- ⚡ Compress images before storage/transmission
- ⚡ Use lazy loading for heavy resources
- ⚡ Cache frequently accessed data

### 3. **Security by Default**
- 🔒 Never store passwords in plain text (use bcrypt)
- 🔒 Validate and sanitize all user inputs
- 🔒 Use JWT tokens with proper expiration
- 🔒 Implement rate limiting on sensitive endpoints
- 🔒 Use HTTPS in production

### 4. **User Experience Excellence**
- 🎨 Responsive design (mobile-first approach)
- 🎨 Clear error messages and feedback
- 🎨 Loading states for async operations
- 🎨 Accessibility (WCAG 2.1 Level AA)

---

## 💻 Code Standards

### **Backend (Python/Flask)**

#### 1. **File Structure**
```
backend/
├── server.py              # Main Flask application
├── models.py             # SQLAlchemy models
├── config.py             # Configuration management
├── utils/
│   ├── image_processing.py  # Image enhancement & OCR
│   ├── face_detection.py    # Face recognition utilities
│   ├── validators.py        # Input validation
│   └── logger.py            # Logging configuration
├── routes/
│   ├── auth.py           # Authentication endpoints
│   ├── attendance.py     # Attendance management
│   ├── chat.py           # Real-time chat endpoints
│   └── ocr.py            # OCR & document processing
└── tests/                # Unit and integration tests
```

#### 2. **Naming Conventions**
```python
# Variables & Functions: snake_case
user_name = "John Doe"
def get_user_by_id(user_id: int) -> User:
    pass

# Classes: PascalCase
class EmployeeAttendance:
    pass

# Constants: UPPER_SNAKE_CASE
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf']
```

#### 3. **Type Hints (Mandatory)**
```python
from typing import Optional, List, Dict, Tuple

def process_image(
    image_data: bytes, 
    enhance: bool = True
) -> Tuple[np.ndarray, Optional[str]]:
    """
    Process image with optional enhancement.
    
    Args:
        image_data: Raw image bytes
        enhance: Apply auto-enhancement if True
        
    Returns:
        Tuple of (processed_image_array, error_message)
        error_message is None if successful
    """
    pass
```

#### 4. **Error Handling**
```python
# ✅ GOOD: Specific exceptions with proper logging
try:
    face_encoding = extract_face_encoding(image)
except ValueError as e:
    logger.error(f"Invalid image format: {str(e)}")
    return jsonify({'status': 'error', 'message': 'Format gambar tidak valid'}), 400
except Exception as e:
    logger.exception("Unexpected error in face encoding")
    return jsonify({'status': 'error', 'message': 'Terjadi kesalahan sistem'}), 500

# ❌ BAD: Generic exceptions without context
try:
    process_something()
except:
    pass
```

#### 5. **Logging Standards**
```python
import logging

# Use structured logging
logger = logging.getLogger(__name__)

# Log levels:
logger.debug("Detailed debugging info")      # Development only
logger.info("General information")           # Normal operations
logger.warning("Warning message")            # Potential issues
logger.error("Error occurred", exc_info=True) # Errors with traceback
logger.critical("Critical failure")          # System failures
```

---

### **Frontend (React TypeScript)**

#### 1. **File Structure**
```
frontend/src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── layout/          # Layout components (Header, Sidebar)
│   └── features/        # Feature-specific components
├── pages/               # Page components (routes)
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── services/            # API service functions
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
└── assets/              # Images, icons, styles
```

#### 2. **Component Structure**
```typescript
// ✅ GOOD: Functional component with TypeScript
import React, { useState, useEffect } from 'react';

interface EmployeeCardProps {
  employeeId: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  onSelect?: (id: string) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ 
  employeeId, 
  name, 
  role,
  onSelect 
}) => {
  const [isSelected, setIsSelected] = useState(false);
  
  const handleClick = () => {
    setIsSelected(!isSelected);
    onSelect?.(employeeId);
  };
  
  return (
    <div 
      data-testid={`employee-card-${employeeId}`}
      onClick={handleClick}
      className="p-4 border rounded-lg hover:shadow-md transition"
    >
      <h3>{name}</h3>
      <span>{role}</span>
    </div>
  );
};

export default EmployeeCard;
```

#### 3. **State Management**
```typescript
// Use React Context for global state
// Use local state (useState) for component-specific state
// Avoid prop drilling - use Context when passing props > 2 levels

// Example: Theme Context
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
```

#### 4. **API Calls**
```typescript
// Centralize API calls in services/
// services/employeeService.ts

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

export const employeeService = {
  async getEmployees(): Promise<Employee[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw error;
    }
  }
};
```

---

## 🗺️ Path Management & Portability

### ❌ DON'T: Hardcode Paths
```python
# ❌ BAD: Hardcoded absolute paths
DATABASE_URL = "sqlite:////app/backend/instance/attendance.db"
UPLOAD_FOLDER = "/app/uploads"
LOG_FILE = "/app/logs/app.log"
```

### ✅ DO: Use Dynamic Paths
```python
# ✅ GOOD: Portable paths using os.path
import os

# Get base directory dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
LOG_DIR = os.path.join(BASE_DIR, 'logs')

# Create directories if they don't exist
os.makedirs(INSTANCE_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

# Database URL
DATABASE_URL = f"sqlite:///{os.path.join(INSTANCE_DIR, 'attendance.db')}"
```

### Environment-Based Configuration
```python
# config.py - Centralized configuration
import os
from pathlib import Path

class Config:
    # Base directory - works anywhere
    BASE_DIR = Path(__file__).parent.absolute()
    
    # Database
    INSTANCE_DIR = BASE_DIR / 'instance'
    DATABASE_URL = os.environ.get('DATABASE_URL') or \
                   f"sqlite:///{INSTANCE_DIR / 'attendance.db'}"
    
    # File uploads
    UPLOAD_FOLDER = BASE_DIR / 'uploads' / 'files'
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # Logging
    LOG_DIR = BASE_DIR / 'logs'
    LOG_DIR.mkdir(exist_ok=True)
    LOG_FILE = LOG_DIR / 'app.log'
    
    # JWT Secret (MUST be in environment)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'change-this-in-production')

# Usage in app
from config import Config
app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER
```

### Frontend Path Management
```typescript
// ❌ BAD: Hardcoded backend URL
const API_URL = "http://localhost:8001/api";

// ✅ GOOD: Environment-based
const API_URL = import.meta.env.VITE_BACKEND_URL || 
                process.env.REACT_APP_BACKEND_URL || 
                "http://localhost:8001/api";

// Create centralized API service
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8001",
  ENDPOINTS: {
    LOGIN: '/api/login',
    EMPLOYEES: '/api/employees',
    ATTENDANCE: '/api/attendance',
    CHAT: '/api/chat',
  }
};
```

---

## 🌐 Multi-Language Support (i18n)

### 1. **Database Schema for Language Preference**
```python
class Employee(Base):
    # ... other fields
    language_preference = Column(String(10), default='id')  # 'id', 'en'
    date_format_preference = Column(String(20), default='indonesian')  # 'indonesian', 'standard'
```

### 2. **Backend Translation System**
```python
# utils/i18n.py - Translation utility
from typing import Dict

TRANSLATIONS = {
    'id': {
        'welcome': 'Selamat datang',
        'attendance_marked': 'Absensi berhasil dicatat',
        'face_not_detected': 'Wajah tidak terdeteksi',
        'mask_detected': 'Harap lepas masker',
        'login_success': 'Login berhasil',
        'invalid_credentials': 'NIP atau password salah',
        'unauthorized': 'Anda tidak memiliki akses',
        'server_error': 'Terjadi kesalahan server',
    },
    'en': {
        'welcome': 'Welcome',
        'attendance_marked': 'Attendance marked successfully',
        'face_not_detected': 'Face not detected',
        'mask_detected': 'Please remove mask',
        'login_success': 'Login successful',
        'invalid_credentials': 'Invalid employee ID or password',
        'unauthorized': 'You do not have access',
        'server_error': 'Server error occurred',
    }
}

def translate(key: str, lang: str = 'id') -> str:
    """Get translated message"""
    return TRANSLATIONS.get(lang, {}).get(key, key)

def get_user_language(employee_id: str) -> str:
    """Get employee's language preference from database"""
    # Query database for employee's language_preference
    # Return 'id' as default
    pass

# Usage in API responses
@app.route('/api/attendance/mark')
@jwt_required()
def mark_attendance():
    employee_id = get_jwt_identity()
    lang = get_user_language(employee_id)
    
    # ... attendance logic
    
    return jsonify({
        'status': 'success',
        'message': translate('attendance_marked', lang)
    })
```

### 3. **Frontend i18n with React**
```typescript
// src/i18n/translations.ts
export const translations = {
  id: {
    common: {
      welcome: 'Selamat datang',
      logout: 'Keluar',
      save: 'Simpan',
      cancel: 'Batal',
      loading: 'Memuat...',
    },
    dashboard: {
      title: 'Dasbor Karyawan',
      attendance: 'Absensi',
      employees: 'Karyawan',
      chat: 'Percakapan',
    },
    attendance: {
      markAttendance: 'Tandai Absensi',
      todayStatus: 'Status Hari Ini',
      alreadyMarked: 'Sudah absen hari ini',
    },
    errors: {
      faceNotDetected: 'Wajah tidak terdeteksi',
      maskDetected: 'Harap lepas masker',
      serverError: 'Terjadi kesalahan server',
    }
  },
  en: {
    common: {
      welcome: 'Welcome',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
    },
    dashboard: {
      title: 'Employee Dashboard',
      attendance: 'Attendance',
      employees: 'Employees',
      chat: 'Conversations',
    },
    attendance: {
      markAttendance: 'Mark Attendance',
      todayStatus: "Today's Status",
      alreadyMarked: 'Already attended today',
    },
    errors: {
      faceNotDetected: 'Face not detected',
      maskDetected: 'Please remove mask',
      serverError: 'Server error occurred',
    }
  }
};

// src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations';

interface LanguageContextType {
  language: 'id' | 'en';
  setLanguage: (lang: 'id' | 'en') => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC = ({ children }) => {
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  
  const t = (path: string): string => {
    const keys = path.split('.');
    let value: any = translations[language];
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    return value || path;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

// Usage in components
import { useLanguage } from '../contexts/LanguageContext';

function Dashboard() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button>{t('attendance.markAttendance')}</button>
    </div>
  );
}
```

### 4. **Date & Time Formatting**
```python
# utils/date_formatter.py
from datetime import datetime
import locale

def format_datetime(dt: datetime, format_type: str = 'indonesian') -> str:
    """
    Format datetime based on user preference
    
    Args:
        dt: datetime object
        format_type: 'indonesian' or 'standard'
    
    Returns:
        Formatted datetime string
    """
    if format_type == 'indonesian':
        # "1 Agustus 2025, 14:30 WIB"
        months_id = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ]
        return f"{dt.day} {months_id[dt.month - 1]} {dt.year}, {dt.strftime('%H:%M')} WIB"
    else:
        # "2025-08-01 14:30"
        return dt.strftime('%Y-%m-%d %H:%M')
```

```typescript
// src/utils/dateFormatter.ts
export const formatDate = (
  date: Date, 
  format: 'indonesian' | 'standard' = 'indonesian'
): string => {
  if (format === 'indonesian') {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `${day} ${month} ${year}, ${time} WIB`;
  }
  
  // Standard format
  return date.toISOString().slice(0, 16).replace('T', ' ');
};
```

---

## 📊 Indonesian Business Standards

### 1. **Standard Departemen (Departments)**
```python
# Common Indonesian company departments
STANDARD_DEPARTMENTS = [
    'Teknologi Informasi',       # IT
    'Sumber Daya Manusia',       # HR
    'Keuangan',                  # Finance
    'Pemasaran',                 # Marketing
    'Penjualan',                 # Sales
    'Operasional',               # Operations
    'Produksi',                  # Production
    'Logistik',                  # Logistics
    'Penelitian & Pengembangan', # R&D
    'Layanan Pelanggan',         # Customer Service
    'Hukum & Kepatuhan',         # Legal & Compliance
    'Administrasi',              # Administration
]
```

### 2. **Standard Posisi/Jabatan (Positions)**
```python
# Common Indonesian job positions
STANDARD_POSITIONS = {
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
```

### 3. **Indonesian Employee ID Format**
```python
# NIP (Nomor Induk Pegawai) Format
# Example: EMP202501001
# Format: EMP + YYYY (year) + MM (month) + NNN (sequential)

def generate_employee_id(hire_date: datetime = None) -> str:
    """Generate Indonesian-style employee ID"""
    if hire_date is None:
        hire_date = datetime.now()
    
    # Get last employee ID for this month
    year = hire_date.strftime('%Y')
    month = hire_date.strftime('%m')
    
    # Query last sequential number
    last_employee = session.query(Employee)\
        .filter(Employee.employee_id.like(f'EMP{year}{month}%'))\
        .order_by(Employee.employee_id.desc())\
        .first()
    
    if last_employee:
        last_seq = int(last_employee.employee_id[-3:])
        new_seq = last_seq + 1
    else:
        new_seq = 1
    
    return f"EMP{year}{month}{new_seq:03d}"

# Example: EMP202508001, EMP202508002, ...
```

### 4. **Work Hours & Attendance Rules**
```python
# Indonesian standard work hours
WORK_SCHEDULE = {
    'start_time': '08:00',     # 8 AM
    'end_time': '17:00',       # 5 PM
    'late_threshold': 15,      # Minutes: late if after 08:15
    'early_leave_threshold': 30,  # Minutes: early if before 16:30
}

# Attendance status in Indonesian
ATTENDANCE_STATUS = {
    'hadir': 'Hadir',           # Present
    'terlambat': 'Terlambat',   # Late
    'izin': 'Izin',             # Excused
    'sakit': 'Sakit',           # Sick
    'alpha': 'Alpha',           # Absent
    'cuti': 'Cuti',             # Leave/Vacation
}
```

### 5. **Indonesian Document Types**
```python
# Common document types in Indonesian companies
DOCUMENT_TYPES = {
    'ktp': 'KTP (Kartu Tanda Penduduk)',
    'kk': 'Kartu Keluarga',
    'npwp': 'NPWP (Nomor Pokok Wajib Pajak)',
    'bpjs': 'BPJS Kesehatan/Ketenagakerjaan',
    'ijazah': 'Ijazah',
    'cv': 'Curriculum Vitae',
    'surat_lamaran': 'Surat Lamaran',
    'kontrak': 'Kontrak Kerja',
    'sk': 'Surat Keputusan',
    'surat_peringatan': 'Surat Peringatan',
    'slip_gaji': 'Slip Gaji',
}
```

---

## 🏗️ Architecture Guidelines

### 1. **Separation of Concerns**
- **Backend:** Business logic, data validation, database operations
- **Frontend:** UI rendering, user interactions, state management
- **API Layer:** RESTful endpoints with clear contracts

### 2. **Modular Design**
```
Feature-based organization:

Employee Management Module
├── Backend: routes/employees.py
├── Frontend: pages/Employees.tsx
├── Components: components/features/employees/
└── Types: types/employee.ts

Attendance Module
├── Backend: routes/attendance.py
├── Frontend: pages/Attendance.tsx
└── Utils: utils/face_detection.py

Chat Module
├── Backend: routes/chat.py (REST) + socket_handlers.py (WebSocket)
├── Frontend: pages/Chat.tsx
└── Services: services/chatService.ts
```

### 3. **Scalability Principles**
- Use pagination for large datasets (default: 50 items per page)
- Implement lazy loading for images
- Use WebSocket for real-time features (chat, online status)
- Database connection pooling

---

## 🗄️ Database Best Practices

### 1. **Schema Design**
```python
# ✅ GOOD: Clear relationships with proper constraints

class Employee(Base):
    __tablename__ = 'employees'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    department = Column(String(100), index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="sender")
```

### 2. **Indexing Strategy**
- ✅ Index foreign keys
- ✅ Index columns used in WHERE clauses
- ✅ Index columns used in JOIN operations
- ✅ Composite indexes for multi-column queries

```python
# Example: Composite index for date-range queries
Index('idx_attendance_employee_date', Attendance.employee_id, Attendance.timestamp)
```

### 3. **Query Optimization**
```python
# ✅ GOOD: Eager loading to avoid N+1 queries
employees = session.query(Employee).options(
    joinedload(Employee.attendances)
).all()

# ❌ BAD: N+1 query problem
employees = session.query(Employee).all()
for emp in employees:
    print(emp.attendances)  # Triggers separate query for each employee
```

### 4. **Data Validation**
- ✅ Use database constraints (NOT NULL, UNIQUE, CHECK)
- ✅ Validate data in application layer before database insertion
- ✅ Use transactions for multi-table operations

---

## 🔒 Security Standards

### 1. **Authentication & Authorization**
```python
# JWT Token Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')  # Must be in .env
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

# Role-based access control
def require_role(required_roles: List[str]):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            if user_role not in required_roles:
                return jsonify({'error': 'Akses ditolak'}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator

# Usage
@app.route('/api/admin/users')
@require_role(['admin'])
def admin_users():
    pass
```

### 2. **Input Validation**
```python
# ✅ GOOD: Validate and sanitize inputs
def validate_employee_id(employee_id: str) -> bool:
    """Validate employee ID format (alphanumeric, 6-10 chars)"""
    if not employee_id or not isinstance(employee_id, str):
        return False
    if not re.match(r'^[A-Z0-9]{6,10}$', employee_id):
        return False
    return True

# Sanitize file uploads
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename: str) -> bool:
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
```

### 3. **Rate Limiting**
```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: get_jwt_identity())

# Limit sensitive endpoints
@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")  # Max 5 login attempts per minute
def login():
    pass
```

### 4. **Secure File Handling**
```python
# ✅ GOOD: Validate file content, not just extension
from PIL import Image

def validate_image(file_data: bytes) -> bool:
    try:
        img = Image.open(io.BytesIO(file_data))
        img.verify()  # Verify it's actually an image
        return True
    except:
        return False
```

---

## 🖼️ Image Processing Guidelines

### 1. **Face Detection Standards**
```python
# Minimum image requirements
MIN_IMAGE_WIDTH = 640
MIN_IMAGE_HEIGHT = 480
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB

# Face detection parameters
FACE_DETECTION_MODEL = 'hog'  # 'hog' (fast) or 'cnn' (accurate)
FACE_RECOGNITION_TOLERANCE = 0.6  # Lower = stricter
```

### 2. **Image Enhancement Pipeline**
```python
def enhance_image(image: np.ndarray) -> np.ndarray:
    """
    Standard image enhancement pipeline:
    1. Resize to optimal size
    2. Adjust brightness/contrast (histogram equalization)
    3. Reduce noise (bilateral filter)
    4. Sharpen (unsharp mask)
    """
    # Resize
    if image.shape[0] > 1920:
        scale = 1920 / image.shape[0]
        image = cv2.resize(image, None, fx=scale, fy=scale)
    
    # Convert to LAB color space for better enhancement
    lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    
    # Merge and convert back
    lab = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    
    return enhanced
```

### 3. **OCR Best Practices**
```python
# Preprocessing for OCR
def preprocess_for_ocr(image: np.ndarray) -> np.ndarray:
    """
    Optimize image for OCR:
    1. Convert to grayscale
    2. Binarization (threshold)
    3. Noise removal
    4. Deskew (rotate to correct orientation)
    """
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    
    # Adaptive thresholding
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    
    # Noise removal
    denoised = cv2.fastNlMeansDenoising(binary)
    
    return denoised

# OCR confidence threshold
MIN_OCR_CONFIDENCE = 60  # Reject results below 60% confidence
```

### 4. **Mask Detection**
```python
# Face mask detection algorithm
def detect_face_mask(face_encoding: np.ndarray, face_landmarks: dict) -> bool:
    """
    Detect if person is wearing mask by analyzing:
    1. Visibility of nose and mouth landmarks
    2. Face coverage percentage
    3. Color distribution in lower face region
    
    Returns: True if mask detected, False otherwise
    """
    # Check if nose and mouth landmarks are obscured
    # Implementation using face_recognition landmarks
    pass
```

---

## 💬 Real-time Communication

### 1. **Socket.IO Architecture**
```python
# Backend: socket_handlers.py
from flask_socketio import SocketIO, emit, join_room, leave_room

socketio = SocketIO(app, cors_allowed_origins="*")

# Event handlers
@socketio.on('connect')
def handle_connect():
    emit('connected', {'status': 'Connected to chat server'})

@socketio.on('join_chat')
def handle_join_chat(data):
    employee_id = data['employee_id']
    join_room(f'user_{employee_id}')
    
    # Update online status
    update_online_status(employee_id, True)
    
    # Notify others
    emit('user_online', {'employee_id': employee_id}, broadcast=True)

@socketio.on('send_message')
def handle_send_message(data):
    # Validate and save message
    message = save_chat_message(data)
    
    # Emit to recipient
    emit('new_message', message, room=f"user_{data['recipient_id']}")
```

### 2. **Chat Data Model**
```python
class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    
    id = Column(Integer, primary_key=True)
    sender_id = Column(String(50), ForeignKey('employees.employee_id'), index=True)
    recipient_id = Column(String(50), ForeignKey('employees.employee_id'), index=True)
    message_text = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)  # For file attachments
    file_type = Column(String(50), nullable=True)  # 'image', 'document', 'pdf'
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    sender = relationship("Employee", foreign_keys=[sender_id])
    recipient = relationship("Employee", foreign_keys=[recipient_id])

# Index for efficient chat history queries
Index('idx_chat_conversation', ChatMessage.sender_id, ChatMessage.recipient_id, ChatMessage.created_at)
```

### 3. **Online Status Management**
```python
# Use Redis for real-time status (or in-memory dict for SQLite)
online_users = {}  # {employee_id: last_seen_timestamp}

def update_online_status(employee_id: str, is_online: bool):
    if is_online:
        online_users[employee_id] = datetime.now()
    else:
        online_users.pop(employee_id, None)

def get_online_users() -> List[str]:
    # Consider user online if last seen < 5 minutes ago
    cutoff = datetime.now() - timedelta(minutes=5)
    return [uid for uid, last_seen in online_users.items() if last_seen > cutoff]
```

---

## 🌐 API Design

### 1. **RESTful Conventions**
```
# Employee endpoints
GET    /api/employees           # List all employees
GET    /api/employees/:id       # Get single employee
POST   /api/employees           # Create employee (admin only)
PUT    /api/employees/:id       # Update employee
DELETE /api/employees/:id       # Delete employee (admin only)

# Attendance endpoints
GET    /api/attendance          # Get all attendance records
POST   /api/attendance/mark     # Mark attendance (face recognition)
GET    /api/attendance/today    # Today's attendance status

# Chat endpoints
GET    /api/chat/conversations  # Get user's conversations
GET    /api/chat/messages/:id   # Get messages with specific user
POST   /api/chat/upload         # Upload file for chat
```

### 2. **Response Format**
```json
// ✅ SUCCESS Response
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    "employee_id": "EMP001",
    "name": "John Doe"
  },
  "meta": {
    "timestamp": "2025-08-01T10:00:00Z",
    "version": "1.0"
  }
}

// ❌ ERROR Response
{
  "status": "error",
  "message": "Employee not found",
  "error_code": "EMPLOYEE_NOT_FOUND",
  "details": {
    "employee_id": "EMP999"
  }
}
```

### 3. **Pagination**
```python
# Standard pagination parameters
@app.route('/api/employees')
def get_employees():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    pagination = Employee.query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'status': 'success',
        'data': [emp.to_dict() for emp in pagination.items],
        'meta': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })
```

---

## 🧪 Testing Requirements

### 1. **Unit Tests**
```python
# tests/test_face_detection.py
import pytest
from utils.face_detection import detect_face, extract_face_encoding

def test_detect_face_valid_image():
    """Test face detection with valid image"""
    with open('tests/fixtures/face_sample.jpg', 'rb') as f:
        image_data = f.read()
    
    result = detect_face(image_data)
    assert result['detected'] == True
    assert result['face_count'] == 1

def test_detect_face_no_face():
    """Test face detection with image containing no face"""
    with open('tests/fixtures/no_face.jpg', 'rb') as f:
        image_data = f.read()
    
    result = detect_face(image_data)
    assert result['detected'] == False
```

### 2. **Integration Tests**
```python
# tests/test_attendance_api.py
def test_mark_attendance_success(client, auth_token):
    """Test successful attendance marking"""
    response = client.post(
        '/api/attendance/mark',
        json={'image': base64_test_image},
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    
    assert response.status_code == 200
    assert response.json['status'] == 'success'
```

### 3. **Test Coverage**
- ✅ Aim for minimum 70% code coverage
- ✅ Test all critical paths (auth, face recognition, attendance)
- ✅ Test error scenarios (invalid inputs, missing data)

---

## 📖 Documentation Standards

### 1. **Code Documentation**
```python
def process_employee_face(
    employee_id: str, 
    image_data: bytes,
    check_mask: bool = True
) -> Dict[str, Any]:
    """
    Process employee face image for attendance or registration.
    
    This function performs the following steps:
    1. Validates image format and size
    2. Detects face in image
    3. Checks for face mask if check_mask=True
    4. Extracts face encoding
    5. Returns processing result
    
    Args:
        employee_id: Unique employee identifier (format: EMP001)
        image_data: Raw image bytes (JPEG/PNG, max 5MB)
        check_mask: If True, validates that face is not wearing mask
        
    Returns:
        Dictionary containing:
        - status: 'success' or 'error'
        - message: Human-readable message
        - face_encoding: numpy array (128-d) if successful
        - mask_detected: boolean if check_mask=True
        
    Raises:
        ValueError: If image format is invalid
        ImageProcessingError: If face detection fails
        
    Example:
        >>> with open('employee_photo.jpg', 'rb') as f:
        ...     image_data = f.read()
        >>> result = process_employee_face('EMP001', image_data)
        >>> print(result['status'])
        'success'
    """
    pass
```

### 2. **API Documentation**
- Use docstrings for all endpoints
- Document request/response formats
- Include example requests
- List possible error codes

### 3. **README Updates**
- Keep README.md up-to-date with new features
- Include setup instructions
- Document environment variables
- Add troubleshooting section

---

## 🎨 UI/UX Guidelines

### 1. **Color Palette**
```css
/* Primary Colors (Maroon Theme) */
--primary-maroon: #8B0000;
--primary-maroon-dark: #5F0000;
--primary-maroon-light: #B22222;

/* Accent Colors */
--accent-gold: #FFD700;
--accent-blue: #1E40AF;

/* Dark Mode Colors */
--dark-bg: #1a1a1a;
--dark-surface: #2d2d2d;
--dark-text: #e0e0e0;

/* Light Mode Colors */
--light-bg: #f8f9fa;
--light-surface: #ffffff;
--light-text: #212529;

/* Semantic Colors */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

### 2. **Responsive Breakpoints**
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### 3. **Accessibility**
- ✅ Use semantic HTML tags
- ✅ Add ARIA labels for screen readers
- ✅ Keyboard navigation support (Tab, Enter, Esc)
- ✅ Sufficient color contrast (WCAG AA: 4.5:1 for text)
- ✅ Focus indicators for interactive elements

---

## 🚀 Performance Optimization

### 1. **Image Optimization**
```python
# Compress images before storage
def compress_image(image: Image, quality: int = 85) -> bytes:
    output = io.BytesIO()
    image.save(output, format='JPEG', quality=quality, optimize=True)
    return output.getvalue()

# Generate thumbnails for chat attachments
THUMBNAIL_SIZE = (200, 200)
def create_thumbnail(image: Image) -> bytes:
    image.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
    output = io.BytesIO()
    image.save(output, format='JPEG', quality=80)
    return output.getvalue()
```

### 2. **Database Query Optimization**
- Use select_related() / joinedload() for relationships
- Implement pagination for large datasets
- Use database indexes on frequently queried columns
- Cache frequently accessed data (e.g., employee directory)

### 3. **Frontend Optimization**
- Lazy load images and components
- Code splitting with React.lazy()
- Debounce search inputs
- Use React.memo() for expensive components

---

## 🐛 Error Handling & Logging

### 1. **Logging Configuration**
```python
# config/logging.py
import logging
from logging.handlers import RotatingFileHandler

def setup_logging(app):
    """Configure application logging"""
    
    # Create logs directory
    os.makedirs('logs', exist_ok=True)
    
    # File handler with rotation
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    file_handler.setLevel(logging.INFO)
    
    # Format
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )
    file_handler.setFormatter(formatter)
    
    # Add handler to app
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
```

### 2. **Error Response Standards**
```python
# Common error codes
ERROR_CODES = {
    'INVALID_INPUT': 'Input data tidak valid',
    'UNAUTHORIZED': 'Anda tidak memiliki akses',
    'NOT_FOUND': 'Data tidak ditemukan',
    'FACE_NOT_DETECTED': 'Wajah tidak terdeteksi',
    'MASK_DETECTED': 'Harap lepas masker',
    'DUPLICATE_ENTRY': 'Data sudah ada',
    'FILE_TOO_LARGE': 'Ukuran file terlalu besar',
    'INVALID_FILE_TYPE': 'Tipe file tidak didukung'
}

def error_response(error_code: str, status_code: int = 400, **kwargs):
    return jsonify({
        'status': 'error',
        'error_code': error_code,
        'message': ERROR_CODES.get(error_code, 'Terjadi kesalahan'),
        **kwargs
    }), status_code
```

---

## 🔄 Version Control Best Practices

### 1. **Git Commit Messages**
```
Format: <type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code formatting (no logic change)
- refactor: Code refactoring
- test: Adding tests
- chore: Build/config changes

Examples:
feat(chat): implement real-time messaging with Socket.IO
fix(attendance): resolve mask detection false positives
docs(api): update employee endpoints documentation
refactor(image): optimize face detection pipeline
```

### 2. **Branch Strategy**
```
main          - Production-ready code
├── develop   - Integration branch
    ├── feature/chat-system
    ├── feature/ocr-enhancement
    ├── feature/dark-mode
    └── bugfix/mask-detection
```

---

## ✅ Definition of Done (DoD)

Before marking any feature as "complete", ensure:

- [ ] Code follows all standards in this document
- [ ] Type hints and docstrings added
- [ ] Unit tests written and passing
- [ ] Manual testing completed
- [ ] Error handling implemented
- [ ] Logging added for debugging
- [ ] Performance tested (no bottlenecks)
- [ ] Security reviewed (no vulnerabilities)
- [ ] Documentation updated
- [ ] Code reviewed (self-review minimum)
- [ ] Dark mode compatibility checked
- [ ] Mobile responsiveness verified

---

## 📞 Support & Maintenance

### 1. **Issue Reporting**
When reporting bugs, include:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs
- Environment details (browser, OS)

### 2. **Code Review Checklist**
- [ ] Code is readable and well-structured
- [ ] No hardcoded credentials or sensitive data
- [ ] Error handling is comprehensive
- [ ] Performance is acceptable
- [ ] No security vulnerabilities
- [ ] Follows golden rules

---

## 🎓 Learning Resources

### Recommended Tools & Libraries:
- **Face Recognition:** face_recognition, dlib, OpenCV
- **OCR:** Tesseract OCR, EasyOCR
- **Real-time:** Socket.IO, Flask-SocketIO
- **Image Processing:** Pillow, OpenCV, scikit-image
- **Testing:** pytest, unittest
- **Type Checking:** mypy
- **Code Quality:** flake8, black, isort

### Documentation:
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [face_recognition Library](https://github.com/ageitgey/face_recognition)
- [Tesseract OCR](https://tesseract-ocr.github.io/)

---

**Remember:** These golden rules are living documents. Update them as the project evolves and new patterns emerge.

**Last Updated:** 2025-08-01  
**Maintained by:** Development Team

---

