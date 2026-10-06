const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";

export type ApiHealth = {
  status: string;
};

export type ConversationStatus =
  | "new"
  | "collecting_information"
  | "awaiting_confirmation"
  | "awaiting_tool"
  | "human_handoff"
  | "resolved"
  | "operational_failure"
  | string;

export type ConversationMessage = {
  id: string;
  direction: "inbound" | "outbound" | "internal" | string;
  channel: "whatsapp" | "instagram" | string;
  text: string;
  status: string;
  external_message_id: string | null;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  tenant_id: string;
  contact_id: string;
  contact_display_name: string | null;
  contact_external_id: string;
  channel: "whatsapp" | "instagram" | string;
  state: ConversationStatus;
  automation_paused: boolean;
  handoff_reason: string | null;
  assigned_to: string | null;
  last_message_at: string | null;
  last_message_text: string | null;
  last_message_direction: string | null;
};

export type ConversationDetail = {
  id: string;
  tenant_id: string;
  contact_id: string;
  contact_display_name: string | null;
  contact_external_id: string;
  channel: "whatsapp" | "instagram" | string;
  state: ConversationStatus;
  automation_paused: boolean;
  handoff_reason: string | null;
  assigned_to: string | null;
  last_message_at: string | null;
  messages: ConversationMessage[];
};

export type ConversationActionResult = {
  conversation_id: string;
  state: ConversationStatus;
  automation_paused: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const message =
      detail && typeof detail.detail === "string"
        ? detail.detail
        : `API request failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function tenantQuery(tenantId: string): string {
  return new URLSearchParams({ tenant_id: tenantId }).toString();
}

export function getHealth(): Promise<ApiHealth> {
  return request<ApiHealth>("/health");
}

export function listConversations(
  tenantId: string,
  limit = 50,
): Promise<ConversationSummary[]> {
  const query = new URLSearchParams({
    tenant_id: tenantId,
    limit: String(limit),
  });
  return request<ConversationSummary[]>(`/conversations?${query.toString()}`);
}

export function getConversation(
  tenantId: string,
  conversationId: string,
): Promise<ConversationDetail> {
  return request<ConversationDetail>(
    `/conversations/${conversationId}?${tenantQuery(tenantId)}`,
  );
}

export function handoffConversation(
  tenantId: string,
  conversationId: string,
  assignedTo = "Gabriel",
): Promise<ConversationActionResult> {
  return request<ConversationActionResult>(
    `/conversations/${conversationId}/handoff?${tenantQuery(tenantId)}`,
    {
      method: "POST",
      body: JSON.stringify({
        reason: "operator_takeover",
        assigned_to: assignedTo,
      }),
    },
  );
}

export function resumeConversation(
  tenantId: string,
  conversationId: string,
): Promise<ConversationActionResult> {
  return request<ConversationActionResult>(
    `/conversations/${conversationId}/resume?${tenantQuery(tenantId)}`,
    { method: "POST" },
  );
}
