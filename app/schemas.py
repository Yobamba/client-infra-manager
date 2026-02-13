from pydantic import BaseModel
from .models import OdooInstanceType

class InstanceCreate(BaseModel):
    name: str
    url: str
    instance_type: OdooInstanceType
    is_active: bool
    project_id: int