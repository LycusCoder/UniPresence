"""Seed script to create initial admin, manager, and employee accounts"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Employee
from passlib.hash import bcrypt
import os
import numpy as np

def create_seed_accounts():
    """Create initial admin, manager, and employee accounts with dummy face encodings"""
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
    os.makedirs(INSTANCE_DIR, exist_ok=True)
    
    DATABASE_URL = f"sqlite:///{os.path.join(INSTANCE_DIR, 'attendance.db')}"
    engine = create_engine(DATABASE_URL, echo=True)
    SessionLocal = sessionmaker(bind=engine)
    
    # Create tables if they don't exist
    Base.metadata.create_all(engine)
    
    session = SessionLocal()
    
    try:
        # Create dummy face encoding (128-dimensional zero vector)
        dummy_encoding = np.zeros(128, dtype=np.float64)
        
        # Seed accounts data
        seed_accounts = [
            {
                'employee_id': 'EMP001',
                'name': 'System Administrator',
                'email': 'admin@company.com',
                'phone': '081234567890',
                'department': 'IT',
                'position': 'System Administrator',
                'password': 'admin123',
                'role': 'admin'
            },
            {
                'employee_id': 'EMP002',
                'name': 'HR Manager',
                'email': 'manager@company.com',
                'phone': '081234567891',
                'department': 'Human Resources',
                'position': 'HR Manager',
                'password': 'manager123',
                'role': 'manager'
            },
            {
                'employee_id': 'EMP003',
                'name': 'John Doe',
                'email': 'john.doe@company.com',
                'phone': '081234567892',
                'department': 'Engineering',
                'position': 'Software Engineer',
                'password': 'employee123',
                'role': 'employee'
            }
        ]
        
        created_count = 0
        for account_data in seed_accounts:
            # Check if account already exists
            existing = session.query(Employee).filter_by(employee_id=account_data['employee_id']).first()
            
            if not existing:
                employee = Employee(
                    employee_id=account_data['employee_id'],
                    name=account_data['name'],
                    email=account_data['email'],
                    phone=account_data['phone'],
                    department=account_data['department'],
                    position=account_data['position'],
                    password=bcrypt.hash(account_data['password']),
                    role=account_data['role'],
                    face_encoding=dummy_encoding.tobytes(),
                    is_active=True
                )
                session.add(employee)
                print(f"✓ {account_data['role'].title()} account created: {account_data['employee_id']} / {account_data['password']}")
                created_count += 1
            else:
                print(f"ℹ {account_data['role'].title()} account already exists: {account_data['employee_id']}")
        
        session.commit()
        
        if created_count > 0:
            print(f"\n✅ Seed completed successfully! Created {created_count} new account(s).")
        else:
            print("\n✅ All seed accounts already exist.")
            
        print("\n📋 Default Accounts:")
        print("  Admin:    EMP001 / admin123")
        print("  Manager:  EMP002 / manager123")
        print("  Employee: EMP003 / employee123")
        print("\n🔐 Please change these default passwords in production!")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == '__main__':
    create_seed_accounts()
