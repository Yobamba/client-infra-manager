from app.database import SessionLocal
from app.models import User, UserRole
from app.routers.auth import hash_password

def create_admin():
    db = SessionLocal()
    admin = db.query(User).filter(User.email == "admin@much.com").first()
    
    if not admin:
        admin_user = User(
            email="admin@much.com",
            hashed_password=hash_password("admin123"), 
            role=UserRole.ADMIN 
        )
        db.add(admin_user)
        db.commit()
        print("✅ Admin created: admin@much.com / admin123")
    else:
        print("ℹ️ Admin already exists.")
    db.close()

if __name__ == "__main__":
    create_admin()