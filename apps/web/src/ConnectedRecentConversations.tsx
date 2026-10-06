import { useEffect, useState } from "react";

import { TENANT_ID, listConversations, type ConversationSummary } from "./api";

function statusFor(item: ConversationSummary) {
  if (item.automation_paused || item.state === "human_handoff") {
    return { className: "status-humano", label: "Humano" };
  }
  if (item.state === "awaiting_confirmation" || item.state === "awaiting_tool") {
    return { className: "status-aguardando", label: "Aguardando" };
  }
  return { className: "status-ia", label: "ZEUS AGENT" };
}

function contactName(item: ConversationSummary) {
  return item.contact_display_name?.trim() || `Contato · ${item.contact_external_id.slice(-6)}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CT";
}

function relativeTime(value: string | null) {
  if (!value) return "sem atividade";
  const diffMinutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, "minute");
  const hours = Math.round(diffMinutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export default function ConnectedRecentConversations() {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(Boolean(TENANT_ID));

  useEffect(() => {
    if (!TENANT_ID) return;
    let active = true;
    listConversations(TENANT_ID, 4)
      .then((data) => active && setItems(data))
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (!TENANT_ID) {
    return <div className="recent-empty">Configure <code>VITE_TENANT_ID</code> para exibir conversas reais.</div>;
  }

  if (loading) {
    return <div className="recent-empty"><span className="loading-spinner" /> Carregando conversas…</div>;
  }

  if (!items.length) {
    return <div className="recent-empty">Nenhuma conversa persistida para este tenant.</div>;
  }

  return (
    <>
      {items.map((conversation) => {
        const name = contactName(conversation);
        const status = statusFor(conversation);
        return (
          <div className="conversation-row" key={conversation.id}>
            <div className="avatar">{initials(name)}</div>
            <div className="conversation-main">
              <div className="conversation-name">
                <strong>{name}</strong>
                <span className={"channel channel-" + conversation.channel}>
                  {conversation.channel === "whatsapp" ? "W" : conversation.channel === "instagram" ? "IG" : "?"}
                </span>
              </div>
              <p>{conversation.last_message_text || "Conversa sem mensagens."}</p>
            </div>
            <span className={"status-pill " + status.className}>{status.label}</span>
            <time>{relativeTime(conversation.last_message_at)}</time>
          </div>
        );
      })}
    </>
  );
}
