from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import OdooInstance, OdooInstanceType, Project, UserRole, ProjectUser
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

@router.patch("/{instance_id}")
def update_instance(
    instance_id: int,
    name: str = None,
    url: str = None,
    instance_type: OdooInstanceType = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Fetch the existing record
    instance = db.query(OdooInstance).filter(OdooInstance.id == instance_id).first()
    
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    # 2. Project Isolation (Security Check)
    if current_user.role != UserRole.ADMIN:
        # We check the project associated with THIS specific instance
        is_assigned = db.query(ProjectUser).filter(
            ProjectUser.project_id == instance.project_id,
            ProjectUser.user_id == current_user.id
        ).first()
        
        if not is_assigned:
            raise HTTPException(status_code=403, detail="Unauthorized access to this project")

    # 3. THE SINGLE PRODUCTION RULE (Validation)
    # We check if the NEW state being requested would violate the rule
    target_type = instance_type if instance_type is not None else instance.instance_type
    target_active = is_active if is_active is not None else instance.is_active

    if target_type == OdooInstanceType.PRODUCTION and target_active:
        conflict = db.query(OdooInstance).filter(
            OdooInstance.project_id == instance.project_id,
            OdooInstance.instance_type == OdooInstanceType.PRODUCTION,
            OdooInstance.is_active == True,
            OdooInstance.id != instance_id  # EXCLUDE the record we are currently updating
        ).first()

        if conflict:
            raise HTTPException(
                status_code=400, 
                detail="Conflict: Another active Production instance already exists for this project."
            )

    # 4. Apply the updates only if they were provided
    if name is not None: instance.name = name
    if url is not None: instance.url = url
    if instance_type is not None: instance.instance_type = instance_type
    if is_active is not None: instance.is_active = is_active

    db.commit()
    db.refresh(instance)
    return instance