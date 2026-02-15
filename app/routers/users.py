from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserRole
from ..schemas import UserCreate, UserResponse, UserWithProjects
from ..auth import get_current_admin, hash_password

router = APIRouter(prefix="/users", tags=["Users"])

from sqlalchemy.orm import joinedload

@router.get("/with-projects", response_model=list[UserWithProjects])
def get_users_with_projects(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    return (
        db.query(User)
        .options(joinedload(User.projects))
        .all()
    )


@router.get("/", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    return db.query(User).all()


@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(user_data.password)

    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
