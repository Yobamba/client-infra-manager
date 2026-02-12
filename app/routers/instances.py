from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import OdooInstance, OdooInstanceType, Project, UserRole
from ..auth import get_current_user

router = APIRouter(prefix="/instances", tags=["Instances"])

@router.post("/")
def create_instance(
    name: str,
    url: str,
    instance_type: OdooInstanceType,
    is_active: bool,
    project_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Project isolation enforcement
    if current_user.role != UserRole.ADMIN:
        assigned = any(user.id == current_user.id for user in project.users)
        if not assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized for this project"
            )

    # SINGLE PRODUCTION RULE
    if instance_type == OdooInstanceType.PRODUCTION and is_active:
        existing_production = (
            db.query(OdooInstance)
            .filter(
                OdooInstance.project_id == project_id,
                OdooInstance.instance_type == OdooInstanceType.PRODUCTION,
                OdooInstance.is_active == True
            )
            .first()
        )

        if existing_production:
            raise HTTPException(
                status_code=400,
                detail="This project already has an active Production instance"
            )

    instance = OdooInstance(
        name=name,
        url=url,
        instance_type=instance_type,
        is_active=is_active,
        project_id=project_id
    )

    db.add(instance)
    db.commit()
    db.refresh(instance)

    return instance
