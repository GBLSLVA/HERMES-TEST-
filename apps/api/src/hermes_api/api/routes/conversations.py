from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from hermes_api.database import get_db
from hermes_api.repository import (
    ConversationNotFoundError,
    HermesRepository,
    TenantNotFoundError,
)
from hermes_api.schemas import (
    ConversationActionResult,
    ConversationRead,
    ConversationSummaryRead,
    HandoffRequest,
    MessageRead,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _conversation_read(conversation) -> ConversationRead:
    return ConversationRead(
        id=conversation.id,
        tenant_id=conversation.tenant_id,
        contact_id=conversation.contact_id,
        contact_display_name=conversation.contact.display_name,
        contact_external_id=conversation.contact.external_contact_id,
        channel=conversation.channel,
        state=conversation.state,
        automation_paused=conversation.automation_paused,
        handoff_reason=conversation.handoff_reason,
        assigned_to=conversation.assigned_to,
        last_message_at=conversation.last_message_at,
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


def _conversation_summary(conversation) -> ConversationSummaryRead:
    last_message = conversation.messages[-1] if conversation.messages else None
    return ConversationSummaryRead(
        id=conversation.id,
        tenant_id=conversation.tenant_id,
        contact_id=conversation.contact_id,
        contact_display_name=conversation.contact.display_name,
        contact_external_id=conversation.contact.external_contact_id,
        channel=conversation.channel,
        state=conversation.state,
        automation_paused=conversation.automation_paused,
        handoff_reason=conversation.handoff_reason,
        assigned_to=conversation.assigned_to,
        last_message_at=conversation.last_message_at,
        last_message_text=last_message.text if last_message else None,
        last_message_direction=last_message.direction if last_message else None,
    )


@router.get("", response_model=list[ConversationSummaryRead])
def list_conversations(
    tenant_id: UUID,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[ConversationSummaryRead]:
    repo = HermesRepository(db)
    try:
        conversations = repo.list_conversations(tenant_id, limit=limit)
    except TenantNotFoundError as exc:
        raise HTTPException(status_code=404, detail="tenant_not_found") from exc
    return [_conversation_summary(item) for item in conversations]


@router.get("/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    conversation_id: UUID,
    tenant_id: UUID,
    db: Session = Depends(get_db),
) -> ConversationRead:
    repo = HermesRepository(db)
    try:
        return _conversation_read(
            repo.get_conversation_for_tenant(tenant_id, conversation_id)
        )
    except TenantNotFoundError as exc:
        raise HTTPException(status_code=404, detail="tenant_not_found") from exc
    except ConversationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="conversation_not_found") from exc


@router.post("/{conversation_id}/handoff", response_model=ConversationActionResult)
def handoff(
    conversation_id: UUID,
    payload: HandoffRequest,
    tenant_id: UUID,
    db: Session = Depends(get_db),
) -> ConversationActionResult:
    repo = HermesRepository(db)
    try:
        conversation = repo.set_handoff_for_tenant(
            tenant_id,
            conversation_id,
            reason=payload.reason,
            assigned_to=payload.assigned_to,
        )
    except TenantNotFoundError as exc:
        raise HTTPException(status_code=404, detail="tenant_not_found") from exc
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
    tenant_id: UUID,
    db: Session = Depends(get_db),
) -> ConversationActionResult:
    repo = HermesRepository(db)
    try:
        conversation = repo.resume_for_tenant(tenant_id, conversation_id)
    except TenantNotFoundError as exc:
        raise HTTPException(status_code=404, detail="tenant_not_found") from exc
    except ConversationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="conversation_not_found") from exc
    return ConversationActionResult(
        conversation_id=conversation.id,
        state=conversation.state,
        automation_paused=conversation.automation_paused,
    )
