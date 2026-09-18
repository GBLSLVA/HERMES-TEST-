from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from hermes_api.domain import Channel


class IncomingMessage(BaseModel):
    tenant_id: UUID
    channel: Channel = Channel.WHATSAPP
    external_message_id: str = Field(min_length=1, max_length=255)
    external_contact_id: str = Field(min_length=1, max_length=255)
    text: str = ""
    raw: dict[str, Any] = Field(default_factory=dict)


class WebhookAccepted(BaseModel):
    accepted: bool = True
    duplicate: bool = False
    event_id: UUID
    conversation_id: UUID
    state: str


class HandoffRequest(BaseModel):
    reason: str = "requested_by_user"
    assigned_to: str | None = None


class ConversationActionResult(BaseModel):
    conversation_id: UUID
    state: str
    automation_paused: bool


class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=120)


class CompanyRead(BaseModel):
    id: UUID
    name: str
    slug: str
    active: bool


class KnowledgeArticleCreate(BaseModel):
    tenant_id: UUID
    title: str = Field(min_length=2, max_length=200)
    content: str = Field(min_length=2)
    approved_by: str | None = Field(default=None, max_length=160)


class KnowledgeArticleRead(BaseModel):
    id: UUID
    tenant_id: UUID
    title: str
    content: str
    active: bool
    approved_by: str | None
    approved_at: datetime | None


class MessageRead(BaseModel):
    id: UUID
    direction: str
    channel: str
    text: str
    status: str
    external_message_id: str | None
    created_at: datetime


class ConversationRead(BaseModel):
    id: UUID
    tenant_id: UUID
    contact_id: UUID
    channel: str
    state: str
    automation_paused: bool
    handoff_reason: str | None
    assigned_to: str | None
    messages: list[MessageRead]


class TestMessageResult(BaseModel):
    duplicate: bool
    conversation_id: UUID
    state: str
    inbound_message_id: UUID
    assistant_message_id: UUID | None = None
    assistant_text: str | None = None
    handoff: bool = False
