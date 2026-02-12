from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import enum

class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    STANDARD = "STANDARD"


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STANDARD)
    projects = relationship("Project", secondary="project_users", back_populates="users")
    
    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"

class Client(Base):
    __tablename__ = 'clients'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    projects = relationship("Project", back_populates="client", cascade="all, delete")
    
    def __repr__(self):
        return f"<Client id={self.id} name={self.name}>"

class Project(Base):
    __tablename__ = 'projects'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    client_id = Column(Integer, ForeignKey('clients.id'), nullable=False)
    client = relationship("Client", back_populates="projects")
    odoo_instances = relationship("OdooInstance", back_populates="project", cascade="all, delete")
    users = relationship("User", secondary="project_users", back_populates="projects")
    
    def __repr__(self):
        return f"<Project id={self.id} name={self.name}>"

class OdooInstanceType(enum.Enum):
    PRODUCTION = "PRODUCTION"
    STAGING = "STAGING"
    DEVELOPMENT = "DEVELOPMENT"
    
class OdooInstance(Base):
    __tablename__ = 'odoo_instances'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    url = Column(String, index=True, nullable=False)
    instance_type = Column(Enum(OdooInstanceType), nullable=False)
    is_active = Column(Boolean, default=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    project = relationship("Project", back_populates="odoo_instances")

class ProjectUser(Base):
    __tablename__ = 'project_users'
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)

