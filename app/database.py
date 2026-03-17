import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool 

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")  
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "auth_token": TURSO_AUTH_TOKEN,
        "check_same_thread": False
    },
    poolclass=StaticPool
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()