from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, ProjectUser, User, UserRole, Client
from ..auth import get_current_user, get_current_admin

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/")
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.ADMIN:
        return db.query(Project).all()

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

    if current_user.role == UserRole.ADMIN:
        return project

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

@router.post("/")
def create_project(
    name: str,
    client_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    project = Project(name=name, client_id=client_id)
    db.add(project)
    db.commit()
    db.refresh(project)

    return project

@router.post("/{project_id}/assign/{user_id}")
def assign_user_to_project(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    assignment = ProjectUser(project_id=project_id, user_id=user_id)
    db.add(assignment)
    db.commit()

    return {"message": "User assigned to project"}