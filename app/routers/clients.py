from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Client
from ..auth import get_current_admin

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.post("/")
def create_client(
    name: str,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    client = Client(name=name)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client
