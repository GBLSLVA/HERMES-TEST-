from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from hermes_api.config import get_settings
from hermes_api.database import get_db
from hermes_api.repository import HermesRepository, TenantNotFoundError
from hermes_api.schemas import CompanyCreate, CompanyRead, IncomingMessage, TestMessageResult
from hermes_api.services.processing import process_incoming

router = APIRouter(prefix="/dev", tags=["development"])


def _ensure_dev() -> None:
    if get_settings().app_env.casefold() == "production":
        raise HTTPException(status_code=404, detail="not_found")


@router.post("/companies", response_model=CompanyRead, status_code=201)
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)) -> CompanyRead:
    _ensure_dev()
    repo = HermesRepository(db)
    try:
        company = repo.create_company(name=payload.name, slug=payload.slug)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="company_slug_already_exists") from exc
    return CompanyRead(id=company.id, name=company.name, slug=company.slug, active=company.active)


@router.get("/companies", response_model=list[CompanyRead])
def list_companies(db: Session = Depends(get_db)) -> list[CompanyRead]:
    _ensure_dev()
    repo = HermesRepository(db)
    return [
        CompanyRead(id=item.id, name=item.name, slug=item.slug, active=item.active)
        for item in repo.list_companies()
    ]


@router.post("/messages", response_model=TestMessageResult)
def send_test_message(
    payload: IncomingMessage,
    db: Session = Depends(get_db),
) -> TestMessageResult:
    _ensure_dev()
    repo = HermesRepository(db)
    try:
        return process_incoming(repo, payload)
    except TenantNotFoundError as exc:
        raise HTTPException(status_code=404, detail="tenant_not_found") from exc
