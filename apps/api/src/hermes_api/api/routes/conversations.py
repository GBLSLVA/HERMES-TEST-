from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from hermes_api.database import get_db
from hermes_api.repository import ConversationNotFoundError, HermesRepository
from hermes_api.schemas import ConversationActionResult, ConversationRead, HandoffRequest, MessageRead

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _conversation_read(conversation) -> ConversationRead:
    return ConversationRead(
        id=conversation.id,
        tenant_id=conversation.tenant_id,
        contact_id=conversation.contact_id,
        channel=conversation.channel,
        state=conversation.state,
        automation_paused=conversation.automation_paused,
        handoff_reason=conversation.handoff_reason,
        assigned_to=conversation.assigned_to,
        messages=[
            MessageRead(
                id=item.id,
                direction=item.direction,
                channel=item.channel,
                text=item.text,
                status=item.status,
                external_message_id=item.external_message_id,
                created_at=item.created_at,
            )
            for item in conversation.messages
        ],
    )


@router.get("/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
) -> ConversationRead:
    repo = HermesRepository(db)
    try:
        return _conversation_read(repo.get_conversation(conversation_id))
    except ConversationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="conversation_not_found") from exc


@router.post("/{conversation_id}/handoff", response_model=ConversationActionResult)
def handoff(
    conversation_id: UUID,
    payload: HandoffRequest,
    db: Session = Depends(get_db),
) -> ConversationActionResult:
    repo = HermesRepository(db)
    try:
        conversation = repo.set_handoff(
            conversation_id,
            reason=payload.reason,
            assigned_to=payload.assigned_to,
        )
    except ConversationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="conversation_not_found") from exc
    return ConversationActionResult(
        conversation_id=conversation.id,
        state=conversation.state,
        automation_paused=conversation.automation_paused,
    )


@router.post("/{conversation_id}/resume", response_model=ConversationActionResult)
def resume(
    conversation_id: UUID,
    db: Session = Depends(get_db),
) -> ConversationActionResult:
    repo = HermesRepository(db)
    try:
        conversation = repo.resume(conversation_id)
    except ConversationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="conversation_not_found") from exc
    return ConversationActionResult(
        conversation_id=conversation.id,
        state=conversation.state,
        automation_paused=conversation.automation_paused,
    )
