from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import auth, projects, clients, instances, users

from .auth import get_current_user
from .models import User

app = FastAPI()

# Allowed origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# 3. Add the middleware to your app instance
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows GET, POST, PUT, DELETE, etc.
    allow_headers=["*"], # Allows Authorization headers, Content-Type, etc.
)

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
app.include_router(instances.router)
app.include_router(users.router)
