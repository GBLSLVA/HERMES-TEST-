from enum import StrEnum


class Channel(StrEnum):
    WHATSAPP = "whatsapp"
    INSTAGRAM = "instagram"


class ConversationState(StrEnum):
    NEW = "new"
    COLLECTING_INFORMATION = "collecting_information"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    AWAITING_TOOL = "awaiting_tool"
    HUMAN_HANDOFF = "human_handoff"
    RESOLVED = "resolved"
    OPERATIONAL_FAILURE = "operational_failure"


class MessageDirection(StrEnum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    INTERNAL = "internal"


class MessageStatus(StrEnum):
    RECEIVED = "received"
    GENERATED = "generated"
    SENT = "sent"
    FAILED = "failed"
    BLOCKED = "blocked"
