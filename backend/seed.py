"""Seed script to create initial admin and komting accounts"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User
from passlib.hash import bcrypt
import os
import numpy as np

def create_seed_accounts():
    """Create initial admin and komting accounts with dummy face encodings"""
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
        # Check if accounts already exist
        admin_exists = session.query(User).filter_by(student_id='ADMIN001').first()
        komting_exists = session.query(User).filter_by(student_id='KOMTING001').first()
        
        # Create dummy face encoding (128-dimensional zero vector)
        dummy_encoding = np.zeros(128, dtype=np.float64)
        
        if not admin_exists:
            admin = User(
                name='Administrator',
                student_id='ADMIN001',
                password=bcrypt.hash('admin123'),  # Default password: admin123
                role='admin',
                face_encoding=dummy_encoding.tobytes()
            )
            session.add(admin)
            print("✓ Admin account created: ADMIN001 / admin123")
        else:
            print("ℹ Admin account already exists")
        
        if not komting_exists:
            komting = User(
                name='Ketua Komting',
                student_id='KOMTING001',
                password=bcrypt.hash('komting123'),  # Default password: komting123
                role='komting',
                face_encoding=dummy_encoding.tobytes()
            )
            session.add(komting)
            print("✓ Komting account created: KOMTING001 / komting123")
        else:
            print("ℹ Komting account already exists")
        
        session.commit()
        print("\n✅ Seed completed successfully!")
        print("\nDefault Accounts:")
        print("  Admin:   ADMIN001 / admin123")
        print("  Komting: KOMTING001 / komting123")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error during seeding: {str(e)}")
    finally:
        session.close()

if __name__ == '__main__':
    create_seed_accounts()
