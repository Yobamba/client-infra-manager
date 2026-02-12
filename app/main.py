from fastapi import FastAPI, Depends
from .database import engine, Base
from . import models
from .routers import auth, projects, clients

from .auth import get_current_user
from .models import User

app = FastAPI()

Base.metadata.create_all(bind=engine)


@app.get("/")
def read_root():
    return {"message": "Client & Infrastructure Manager API"}

@app.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(clients.router)
