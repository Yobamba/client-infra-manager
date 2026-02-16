from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Client
from ..auth import get_current_admin
from ..schemas import ClientUpdate

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

@router.get("/")
def get_clients(
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    return db.query(Client).all()

@router.patch("/{client_id}")
def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    client = db.query(Client).filter(Client.id == client_id).first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )

    if client_data.name is not None:
        client.name = client_data.name

    db.commit()
    db.refresh(client)

    return client

@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin)
):
    client = db.query(Client).filter(Client.id == client_id).first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )

    db.delete(client)
    db.commit()

    return {"message": "Client deleted successfully"}
