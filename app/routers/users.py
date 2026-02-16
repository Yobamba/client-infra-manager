from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserRole
from ..schemas import UserCreate, UserResponse, UserWithProjects, UserUpdate
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

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    user_to_update = db.query(User).filter(User.id == user_id).first()

    if not user_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user_data.email and user_data.email != user_to_update.email:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user_to_update.email = user_data.email

    if user_data.password:
        user_to_update.hashed_password = hash_password(user_data.password)

    if user_data.role is not None:
        user_to_update.role = user_data.role

    db.commit()
    db.refresh(user_to_update)

    return user_to_update


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    if current_admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot delete their own account."
        )

    user_to_delete = db.query(User).filter(User.id == user_id).first()

    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    db.delete(user_to_delete)
    db.commit()

    return {"message": "User deleted successfully"}
