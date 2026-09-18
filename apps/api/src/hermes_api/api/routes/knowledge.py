from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from hermes_api.database import get_db
from hermes_api.repository import HermesRepository, TenantNotFoundError
from hermes_api.schemas import KnowledgeArticleCreate, KnowledgeArticleRead

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.post("", response_model=KnowledgeArticleRead, status_code=201)
def create_article(
    payload: KnowledgeArticleCreate,
    db: Session = Depends(get_db),
) -> KnowledgeArticleRead:
    repo = HermesRepository(db)
    try:
        article = repo.create_knowledge(
            tenant_id=payload.tenant_id,
            title=payload.title,
            content=payload.content,
            approved_by=payload.approved_by,
        )
    except TenantNotFoundError as exc:
        raise HTTPException(status_code=404, detail="tenant_not_found") from exc
    return KnowledgeArticleRead(
        id=article.id,
        tenant_id=article.tenant_id,
        title=article.title,
        content=article.content,
        active=article.active,
        approved_by=article.approved_by,
        approved_at=article.approved_at,
    )
