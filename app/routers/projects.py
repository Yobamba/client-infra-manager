from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, ProjectUser, User, UserRole
from ..auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/")
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin sees everything
    if current_user.role == UserRole.ADMIN:
        return db.query(Project).all()

    # Standard user → only assigned projects
    return (
        db.query(Project)
        .join(ProjectUser)
        .filter(ProjectUser.user_id == current_user.id)
        .all()
    )

@router.get("/{project_id}")
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Admin bypass
    if current_user.role == UserRole.ADMIN:
        return project

    # Check assignment
    assignment = (
        db.query(ProjectUser)
        .filter(
            ProjectUser.project_id == project_id,
            ProjectUser.user_id == current_user.id
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )

    return project
