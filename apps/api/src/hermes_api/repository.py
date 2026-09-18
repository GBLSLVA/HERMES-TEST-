from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from hermes_api.domain import ConversationState, MessageDirection, MessageStatus
from hermes_api.models import Company, Contact, Conversation, ExecutionEvent, KnowledgeArticle, Message
from hermes_api.schemas import IncomingMessage


class TenantNotFoundError(LookupError):
    pass


class ConversationNotFoundError(LookupError):
    pass


class HermesRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_company(self, *, name: str, slug: str) -> Company:
        company = Company(name=name, slug=slug)
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)
        return company

    def list_companies(self) -> list[Company]:
        return list(self.db.scalars(select(Company).order_by(Company.name)))

    def ensure_tenant(self, tenant_id: UUID) -> Company:
        company = self.db.get(Company, tenant_id)
        if company is None or not company.active:
            raise TenantNotFoundError("tenant_not_found")
        return company

    def get_or_create_contact(self, message: IncomingMessage) -> Contact:
        contact = self.db.scalar(
            select(Contact).where(
                Contact.tenant_id == message.tenant_id,
                Contact.channel == message.channel.value,
                Contact.external_contact_id == message.external_contact_id,
            )
        )
        if contact is not None:
            return contact
        contact = Contact(
            tenant_id=message.tenant_id,
            channel=message.channel.value,
            external_contact_id=message.external_contact_id,
        )
        self.db.add(contact)
        self.db.flush()
        return contact

    def get_or_create_conversation(self, message: IncomingMessage, contact: Contact) -> Conversation:
        conversation = self.db.scalar(
            select(Conversation).where(
                Conversation.tenant_id == message.tenant_id,
                Conversation.contact_id == contact.id,
                Conversation.channel == message.channel.value,
            )
        )
        if conversation is not None:
            return conversation
        conversation = Conversation(
            tenant_id=message.tenant_id,
            contact_id=contact.id,
            channel=message.channel.value,
            state=ConversationState.NEW.value,
        )
        self.db.add(conversation)
        self.db.flush()
        return conversation

    def accept_incoming(self, payload: IncomingMessage) -> tuple[bool, Conversation, Message, ExecutionEvent]:
        self.ensure_tenant(payload.tenant_id)
        existing = self.db.scalar(
            select(Message).where(
                Message.tenant_id == payload.tenant_id,
                Message.channel == payload.channel.value,
                Message.external_message_id == payload.external_message_id,
            )
        )
        if existing is not None:
            conversation = self.db.get(Conversation, existing.conversation_id)
            assert conversation is not None
            event = self.db.scalar(
                select(ExecutionEvent)
                .where(
                    ExecutionEvent.message_id == existing.id,
                    ExecutionEvent.event_type == "message_received",
                )
                .order_by(ExecutionEvent.created_at.asc())
            )
            if event is None:
                event = ExecutionEvent(
                    tenant_id=payload.tenant_id,
                    conversation_id=conversation.id,
                    message_id=existing.id,
                    event_type="message_duplicate",
                    status="ignored",
                    detail={"external_message_id": payload.external_message_id},
                )
                self.db.add(event)
                self.db.commit()
                self.db.refresh(event)
            return True, conversation, existing, event

        contact = self.get_or_create_contact(payload)
        conversation = self.get_or_create_conversation(payload, contact)
        now = datetime.now(UTC)
        conversation.last_message_at = now
        if conversation.state == ConversationState.NEW.value:
            conversation.state = ConversationState.COLLECTING_INFORMATION.value

        message = Message(
            tenant_id=payload.tenant_id,
            conversation_id=conversation.id,
            direction=MessageDirection.INBOUND.value,
            channel=payload.channel.value,
            external_message_id=payload.external_message_id,
            text=payload.text,
            status=MessageStatus.RECEIVED.value,
            raw_payload=payload.raw,
        )
        self.db.add(message)
        self.db.flush()

        event = ExecutionEvent(
            tenant_id=payload.tenant_id,
            conversation_id=conversation.id,
            message_id=message.id,
            event_type="message_received",
            status="ok",
            detail={"channel": payload.channel.value},
        )
        self.db.add(event)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            return self.accept_incoming(payload)

        self.db.refresh(conversation)
        self.db.refresh(message)
        self.db.refresh(event)
        return False, conversation, message, event

    def set_handoff(self, conversation_id: UUID, *, reason: str, assigned_to: str | None = None) -> Conversation:
        conversation = self.db.get(Conversation, conversation_id)
        if conversation is None:
            raise ConversationNotFoundError("conversation_not_found")
        conversation.state = ConversationState.HUMAN_HANDOFF.value
        conversation.automation_paused = True
        conversation.handoff_reason = reason
        conversation.assigned_to = assigned_to
        self.db.add(
            ExecutionEvent(
                tenant_id=conversation.tenant_id,
                conversation_id=conversation.id,
                event_type="human_handoff",
                status="ok",
                detail={"reason": reason, "assigned_to": assigned_to},
            )
        )
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def resume(self, conversation_id: UUID) -> Conversation:
        conversation = self.db.get(Conversation, conversation_id)
        if conversation is None:
            raise ConversationNotFoundError("conversation_not_found")
        conversation.state = ConversationState.COLLECTING_INFORMATION.value
        conversation.automation_paused = False
        conversation.handoff_reason = None
        conversation.assigned_to = None
        self.db.add(
            ExecutionEvent(
                tenant_id=conversation.tenant_id,
                conversation_id=conversation.id,
                event_type="automation_resumed",
                status="ok",
            )
        )
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def create_outbound_message(
        self,
        conversation: Conversation,
        *,
        text: str,
        status: str = MessageStatus.GENERATED.value,
    ) -> Message:
        self.db.refresh(conversation)
        if conversation.automation_paused or conversation.state == ConversationState.HUMAN_HANDOFF.value:
            raise PermissionError("automation_paused")
        message = Message(
            tenant_id=conversation.tenant_id,
            conversation_id=conversation.id,
            direction=MessageDirection.OUTBOUND.value,
            channel=conversation.channel,
            external_message_id=None,
            text=text,
            status=status,
            raw_payload={},
        )
        self.db.add(message)
        self.db.flush()
        self.db.add(
            ExecutionEvent(
                tenant_id=conversation.tenant_id,
                conversation_id=conversation.id,
                message_id=message.id,
                event_type="assistant_response_generated",
                status="ok",
            )
        )
        self.db.commit()
        self.db.refresh(message)
        return message

    def add_event(
        self,
        *,
        tenant_id: UUID,
        conversation_id: UUID | None,
        message_id: UUID | None,
        event_type: str,
        status: str,
        detail: dict | None = None,
    ) -> ExecutionEvent:
        event = ExecutionEvent(
            tenant_id=tenant_id,
            conversation_id=conversation_id,
            message_id=message_id,
            event_type=event_type,
            status=status,
            detail=detail or {},
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_conversation(self, conversation_id: UUID) -> Conversation:
        conversation = self.db.scalar(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id)
        )
        if conversation is None:
            raise ConversationNotFoundError("conversation_not_found")
        return conversation

    def history_for_agent(self, conversation_id: UUID, limit: int = 12) -> list[Message]:
        rows = list(
            self.db.scalars(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.desc())
                .limit(limit)
            )
        )
        rows.reverse()
        return rows

    def active_knowledge(self, tenant_id: UUID) -> list[KnowledgeArticle]:
        return list(
            self.db.scalars(
                select(KnowledgeArticle)
                .where(
                    KnowledgeArticle.tenant_id == tenant_id,
                    KnowledgeArticle.active.is_(True),
                )
                .order_by(KnowledgeArticle.title)
            )
        )

    def create_knowledge(
        self,
        *,
        tenant_id: UUID,
        title: str,
        content: str,
        approved_by: str | None,
    ) -> KnowledgeArticle:
        self.ensure_tenant(tenant_id)
        article = KnowledgeArticle(
            tenant_id=tenant_id,
            title=title,
            content=content,
            approved_by=approved_by,
            approved_at=datetime.now(UTC),
            active=True,
        )
        self.db.add(article)
        self.db.commit()
        self.db.refresh(article)
        return article
