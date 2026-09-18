from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from hermes_api.database import get_db
from hermes_api.domain import Channel
from hermes_api.repository import HermesRepository, TenantNotFoundError
from hermes_api.schemas import IncomingMessage, WebhookAccepted

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _accept(payload: IncomingMessage, db: Session) -> WebhookAccepted:
    repo = HermesRepository(db)
    try:
        duplicate, conversation, _message, event = repo.accept_incoming(payload)
    except TenantNotFoundError as exc:
        raise HTTPException(status_code=404, detail="tenant_not_found") from exc

    return WebhookAccepted(
        duplicate=duplicate,
        event_id=event.id,
        conversation_id=conversation.id,
        state=conversation.state,
    )


@router.post("/whatsapp", response_model=WebhookAccepted, status_code=status.HTTP_202_ACCEPTED)
def whatsapp_webhook(
    payload: IncomingMessage,
    db: Session = Depends(get_db),
) -> WebhookAccepted:
    return _accept(payload.model_copy(update={"channel": Channel.WHATSAPP}), db)


@router.post("/instagram", response_model=WebhookAccepted, status_code=status.HTTP_202_ACCEPTED)
def instagram_webhook(
    payload: IncomingMessage,
    db: Session = Depends(get_db),
) -> WebhookAccepted:
    return _accept(payload.model_copy(update={"channel": Channel.INSTAGRAM}), db)
