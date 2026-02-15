from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import OdooInstance, OdooInstanceType, Project, UserRole, ProjectUser
from ..auth import get_current_user

from .. import schemas

router = APIRouter(prefix="/instances", tags=["Instances"])

@router.get("/")
def get_instances(
    project_id: int = None, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    query = db.query(OdooInstance)
    
    # 1. If project_id is provided, filter by it
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # 2. Security Check: Only allow if Admin or assigned to the project
        if current_user.role != UserRole.ADMIN:
            assigned = db.query(ProjectUser).filter(
                ProjectUser.project_id == project_id,
                ProjectUser.user_id == current_user.id
            ).first()
            if not assigned:
                raise HTTPException(status_code=403, detail="Access denied to this project's instances")
        
        query = query.filter(OdooInstance.project_id == project_id)
    
    # 3. If no project_id, non-admins should only see instances of projects they belong to
    elif current_user.role != UserRole.ADMIN:
        query = query.join(Project).join(ProjectUser).filter(ProjectUser.user_id == current_user.id)

    return query.all()

@router.get("/{instance_id}")
def get_instance(
    instance_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    instance = db.query(OdooInstance).filter(OdooInstance.id == instance_id).first()
    
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    # Security Check
    if current_user.role != UserRole.ADMIN:
        assigned = db.query(ProjectUser).filter(
            ProjectUser.project_id == instance.project_id,
            ProjectUser.user_id == current_user.id
        ).first()
        if not assigned:
            raise HTTPException(status_code=403, detail="Unauthorized")

    return instance

@router.post("/")
def create_instance(
    data: schemas.InstanceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == data.project_id).first()

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
    if data.instance_type == OdooInstanceType.PRODUCTION and data.is_active:
        existing_production = (
            db.query(OdooInstance)
            .filter(
                OdooInstance.project_id == data.project_id,
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
        name=data.name,
        url=data.url,
        instance_type=data.instance_type,
        is_active=data.is_active,
        project_id=data.project_id
    )

    db.add(instance)
    db.commit()
    db.refresh(instance)

    return instance

@router.patch("/{instance_id}")
def update_instance(
    instance_id: int,
    data: schemas.InstanceUpdate,
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
    target_type = data.instance_type if data.instance_type is not None else instance.instance_type
    target_active = data.is_active if data.is_active is not None else instance.is_active


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
    if data.name is not None:
        instance.name = data.name
    if data.url is not None:
        instance.url = data.url
    if data.instance_type is not None:
        instance.instance_type = data.instance_type
    if data.is_active is not None:
        instance.is_active = data.is_active


    db.commit()
    db.refresh(instance)
    return instance