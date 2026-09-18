from __future__ import annotations

from hermes_api.config import get_settings
from hermes_api.models import Message
from hermes_api.repository import HermesRepository
from hermes_api.schemas import IncomingMessage, TestMessageResult
from hermes_api.services.agent import build_agent_gateway
from hermes_api.services.handoff import explicitly_requests_human


def process_incoming(repo: HermesRepository, payload: IncomingMessage) -> TestMessageResult:
    duplicate, conversation, inbound, _event = repo.accept_incoming(payload)
    if duplicate:
        return TestMessageResult(
            duplicate=True,
            conversation_id=conversation.id,
            state=conversation.state,
            inbound_message_id=inbound.id,
            handoff=conversation.automation_paused,
        )

    if explicitly_requests_human(payload.text):
        conversation = repo.set_handoff(
            conversation.id,
            reason="requested_by_user",
        )
        return TestMessageResult(
            duplicate=False,
            conversation_id=conversation.id,
            state=conversation.state,
            inbound_message_id=inbound.id,
            handoff=True,
        )

    if conversation.automation_paused:
        return TestMessageResult(
            duplicate=False,
            conversation_id=conversation.id,
            state=conversation.state,
            inbound_message_id=inbound.id,
            handoff=True,
        )

    company = repo.ensure_tenant(payload.tenant_id)
    history: list[Message] = repo.history_for_agent(conversation.id)
    knowledge = repo.active_knowledge(payload.tenant_id)
    gateway = build_agent_gateway(get_settings())

    try:
        answer = gateway.answer(company=company, history=history, knowledge=knowledge)
        outbound = repo.create_outbound_message(conversation, text=answer.text)
    except PermissionError:
        return TestMessageResult(
            duplicate=False,
            conversation_id=conversation.id,
            state="human_handoff",
            inbound_message_id=inbound.id,
            handoff=True,
        )
    except Exception as exc:
        repo.add_event(
            tenant_id=payload.tenant_id,
            conversation_id=conversation.id,
            message_id=inbound.id,
            event_type="agent_failure",
            status="failed",
            detail={"error_type": type(exc).__name__},
        )
        raise

    return TestMessageResult(
        duplicate=False,
        conversation_id=conversation.id,
        state=conversation.state,
        inbound_message_id=inbound.id,
        assistant_message_id=outbound.id,
        assistant_text=outbound.text,
        handoff=False,
    )
