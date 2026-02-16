from pydantic import BaseModel
from .models import OdooInstanceType
from enum import Enum

class InstanceCreate(BaseModel):
    name: str
    url: str
    instance_type: OdooInstanceType
    is_active: bool
    project_id: int
    
class InstanceUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    instance_type: OdooInstanceType | None = None
    is_active: bool | None = None
    project_id: int | None = None

class ClientUpdate(BaseModel):
    name: str | None = None

class ProjectCreate(BaseModel):
    name: str
    client_id: int


class ProjectUpdate(BaseModel):
    name: str | None = None
    client_id: int | None = None


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STANDARD = "STANDARD"


class UserCreate(BaseModel):
    email: str
    password: str
    role: UserRole


class UserUpdate(BaseModel):
    email: str | None = None
    password: str | None = None
    role: UserRole | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole

    class Config:
        orm_mode = True
        
class UserSimple(BaseModel):
    id: int
    email: str

    class Config:
        orm_mode = True

class ProjectResponse(BaseModel):
    id: int
    name: str
    client_id: int
    users: list[UserSimple] = []

    class Config:
        orm_mode = True

class ProjectSimple(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True


class UserWithProjects(BaseModel):
    id: int
    email: str
    role: UserRole
    projects: list[ProjectSimple] = []

    class Config:
        orm_mode = True
