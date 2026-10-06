import { useEffect, useMemo, useState } from "react";

import {
  TENANT_ID,
  getConversation,
  handoffConversation,
  listConversations,
  resumeConversation,
  type ConversationDetail,
  type ConversationSummary,
} from "./api";

type UiStatus = "ia" | "humano" | "aguardando";

function statusFor(
  item: Pick<ConversationSummary, "state" | "automation_paused">,
): UiStatus {
  if (item.automation_paused || item.state === "human_handoff") return "humano";
  if (item.state === "awaiting_confirmation" || item.state === "awaiting_tool") {
    return "aguardando";
  }
  return "ia";
}

function StatusPill({ status }: { status: UiStatus }) {
  const labels = {
    ia: "Hermes",
    humano: "Humano",
    aguardando: "Aguardando",
  } as const;

  return <span className={"status-pill status-" + status}>{labels[status]}</span>;
}

function ChannelBadge({ channel }: { channel: string }) {
  const label =
    channel === "whatsapp"
      ? "WhatsApp"
      : channel === "instagram"
        ? "Instagram"
        : channel;

  return (
    <span className={"channel channel-" + channel} title={label}>
      {channel === "whatsapp" ? "W" : channel === "instagram" ? "IG" : "?"}
    </span>
  );
}

function contactName(
  item: Pick<ConversationSummary, "contact_display_name" | "contact_external_id">,
) {
  if (item.contact_display_name?.trim()) return item.contact_display_name.trim();
  const suffix = item.contact_external_id.slice(-6);
  return suffix ? `Contato · ${suffix}` : "Contato";
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CT"
  );
}

function relativeTime(value: string | null) {
  if (!value) return "Sem atividade";

  const diff = new Date(value).getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

function clockTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ConnectedInbox() {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(TENANT_ID));
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "human" | "hermes">("all");

  const loadList = async (preferredId?: string) => {
    if (!TENANT_ID) return;

    setLoading(true);
    setError(null);

    try {
      const data = await listConversations(TENANT_ID);
      setItems(data);

      const nextId =
        preferredId && data.some((item) => item.id === preferredId)
          ? preferredId
          : selectedId && data.some((item) => item.id === selectedId)
            ? selectedId
            : data[0]?.id ?? null;

      setSelectedId(nextId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar conversas.");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (conversationId: string) => {
    if (!TENANT_ID) return;

    setDetailLoading(true);
    setError(null);

    try {
      setDetail(await getConversation(TENANT_ID, conversationId));
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : "Falha ao carregar a conversa.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadList();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    void loadDetail(selectedId);
  }, [selectedId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");

    return items.filter((item) => {
      const status = statusFor(item);
      const matchesFilter =
        filter === "all" ||
        (filter === "human" && status === "humano") ||
        (filter === "hermes" && status === "ia");

      const name = contactName(item).toLocaleLowerCase("pt-BR");
      const preview = (item.last_message_text ?? "").toLocaleLowerCase("pt-BR");

      return matchesFilter && (!query || name.includes(query) || preview.includes(query));
    });
  }, [items, search, filter]);

  const counts = useMemo(
    () => ({
      all: items.length,
      human: items.filter((item) => statusFor(item) === "humano").length,
      hermes: items.filter((item) => statusFor(item) === "ia").length,
    }),
    [items],
  );

  const selectedSummary = items.find((item) => item.id === selectedId) ?? null;
  const selectedName = selectedSummary ? contactName(selectedSummary) : "Conversa";
  const selectedStatus = selectedSummary ? statusFor(selectedSummary) : "ia";

  const toggleHandoff = async () => {
    if (!selectedSummary || !TENANT_ID) return;

    setActionLoading(true);
    setActionMessage(null);
    setError(null);

    try {
      const isHuman =
        selectedSummary.automation_paused ||
        selectedSummary.state === "human_handoff";

      if (isHuman) {
        await resumeConversation(TENANT_ID, selectedSummary.id);
        setActionMessage("Conversa devolvida ao Hermes.");
      } else {
        await handoffConversation(TENANT_ID, selectedSummary.id);
        setActionMessage("Atendimento assumido pela equipe.");
      }

      await loadList(selectedSummary.id);
      await loadDetail(selectedSummary.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o atendimento.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (!TENANT_ID) {
    return (
      <div className="page-stack">
        <section className="page-heading">
          <div className="page-heading-copy">
            <h1>Conversas</h1>
            <p>Conecte um tenant para carregar a Inbox persistida do HERMES.</p>
          </div>
        </section>

        <section className="surface empty-state">
          <h2>Defina a empresa deste painel</h2>
          <p>
            Adicione <code>VITE_TENANT_ID</code> ao ambiente do front-end com o UUID
            da empresa que deve ser exibida.
          </p>
          <code>VITE_TENANT_ID=uuid-da-empresa</code>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div className="page-heading-copy">
          <h1>Conversas</h1>
          <p>
            Acompanhe o histórico persistido, assuma um atendimento ou devolva a
            conversa ao Hermes.
          </p>
        </div>
        <div className="page-heading-action">
          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadList(selectedId ?? undefined)}
            disabled={loading}
          >
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
      </section>

      {error ? (
        <div className="feedback error" role="alert">
          <strong>Não foi possível concluir a ação.</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {actionMessage ? (
        <div className="feedback success" role="status">
          <strong>Atualizado</strong>
          <span>{actionMessage}</span>
        </div>
      ) : null}

      <section className="inbox-layout">
        <div className="conversation-list-panel">
          <div className="conversation-tools">
            <label className="search-field" htmlFor="conversation-search">
              <span>Buscar conversas</span>
              <div>
                <span aria-hidden="true">⌕</span>
                <input
                  id="conversation-search"
                  placeholder="Nome ou mensagem"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </label>

            <div className="inbox-tabs" role="group" aria-label="Filtrar conversas">
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
                aria-pressed={filter === "all"}
              >
                Todas <b>{counts.all}</b>
              </button>
              <button
                type="button"
                className={filter === "human" ? "active" : ""}
                onClick={() => setFilter("human")}
                aria-pressed={filter === "human"}
              >
                Humano <b>{counts.human}</b>
              </button>
              <button
                type="button"
                className={filter === "hermes" ? "active" : ""}
                onClick={() => setFilter("hermes")}
                aria-pressed={filter === "hermes"}
              >
                Hermes <b>{counts.hermes}</b>
              </button>
            </div>
          </div>

          <div className="inbox-conversations">
            {loading ? (
              <div className="inbox-list-state">
                <span className="loading-spinner" aria-hidden="true" />
                Carregando conversas…
              </div>
            ) : filtered.length === 0 ? (
              <div className="inbox-list-state">
                Nenhuma conversa corresponde a este filtro.
              </div>
            ) : (
              filtered.map((conversation) => {
                const name = contactName(conversation);

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    className={
                      "inbox-item " +
                      (selectedId === conversation.id ? "selected" : "")
                    }
                    onClick={() => setSelectedId(conversation.id)}
                    aria-current={selectedId === conversation.id ? "true" : undefined}
                  >
                    <div className="avatar">{initials(name)}</div>
                    <div className="inbox-item-main">
                      <div className="inbox-item-title">
                        <strong>{name}</strong>
                        <time>{relativeTime(conversation.last_message_at)}</time>
                      </div>
                      <p>{conversation.last_message_text || "Conversa sem mensagens."}</p>
                      <div className="inbox-item-meta">
                        <ChannelBadge channel={conversation.channel} />
                        <StatusPill status={statusFor(conversation)} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="chat-panel">
          {!selectedSummary ? (
            <div className="empty-state chat-empty">
              <h2>Selecione uma conversa</h2>
              <p>
                Escolha um atendimento na coluna ao lado para abrir o histórico e
                as ações operacionais.
              </p>
            </div>
          ) : (
            <>
              <header className="chat-header">
                <div className="chat-contact">
                  <div className="avatar large">{initials(selectedName)}</div>
                  <div>
                    <strong>{selectedName}</strong>
                    <span>
                      <ChannelBadge channel={selectedSummary.channel} />
                      {selectedSummary.channel === "whatsapp"
                        ? "WhatsApp"
                        : selectedSummary.channel === "instagram"
                          ? "Instagram"
                          : selectedSummary.channel}
                    </span>
                  </div>
                </div>

                <div className="chat-actions">
                  <StatusPill status={selectedStatus} />
                  <button
                    className={
                      selectedStatus === "humano"
                        ? "secondary-button"
                        : "primary-button"
                    }
                    type="button"
                    onClick={() => void toggleHandoff()}
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Salvando…"
                      : selectedStatus === "humano"
                        ? "Devolver ao Hermes"
                        : "Assumir conversa"}
                  </button>
                </div>
              </header>

              <div className="chat-body">
                <div className="timeline-label">Histórico persistido</div>

                {detailLoading ? (
                  <div className="inbox-list-state">
                    <span className="loading-spinner" aria-hidden="true" />
                    Carregando histórico…
                  </div>
                ) : detail?.messages.length ? (
                  detail.messages.map((message) => {
                    if (message.direction === "internal") {
                      return (
                        <div className="message-internal" key={message.id}>
                          {message.text}
                        </div>
                      );
                    }

                    const inbound = message.direction === "inbound";

                    return (
                      <div
                        className={
                          "message " +
                          (inbound ? "message-client" : "message-agent")
                        }
                        key={message.id}
                      >
                        {!inbound ? (
                          <div className="message-agent-label">Hermes</div>
                        ) : null}
                        <span>{message.text || "(mensagem sem texto)"}</span>
                        <time>{clockTime(message.created_at)}</time>
                      </div>
                    );
                  })
                ) : (
                  <div className="inbox-list-state">
                    Esta conversa ainda não possui mensagens.
                  </div>
                )}

                {selectedStatus === "humano" ? (
                  <div className="handoff-note" role="note">
                    <strong>Automação pausada</strong>
                    <p>
                      {detail?.assigned_to
                        ? `Atendimento sob responsabilidade de ${detail.assigned_to}.`
                        : "A equipe humana assumiu esta conversa."}
                    </p>
                  </div>
                ) : null}
              </div>

              <footer className="channel-send-note">
                <div>
                  <strong>Envio manual ainda não está disponível</strong>
                  <span>
                    A leitura do banco e o handoff já funcionam. O envio será liberado
                    quando o adaptador real do canal estiver conectado.
                  </span>
                </div>
              </footer>
            </>
          )}
        </div>

        <aside className="contact-panel">
          {selectedSummary ? (
            <>
              <div className="contact-hero">
                <div className="avatar xlarge">{initials(selectedName)}</div>
                <strong>{selectedName}</strong>
                <span>{selectedSummary.contact_external_id}</span>
              </div>

              <div className="contact-section">
                <h2>Contexto</h2>
                <dl>
                  <div>
                    <dt>Canal</dt>
                    <dd>{selectedSummary.channel}</dd>
                  </div>
                  <div>
                    <dt>Responsável</dt>
                    <dd>
                      {selectedSummary.assigned_to ||
                        (selectedStatus === "humano" ? "Equipe" : "Hermes")}
                    </dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{selectedSummary.state}</dd>
                  </div>
                </dl>
              </div>

              <div className="contact-section">
                <h2>Identificadores</h2>
                <dl>
                  <div>
                    <dt>Contato</dt>
                    <dd title={selectedSummary.contact_id}>
                      {selectedSummary.contact_id.slice(0, 8)}…
                    </dd>
                  </div>
                  <div>
                    <dt>Conversa</dt>
                    <dd title={selectedSummary.id}>
                      {selectedSummary.id.slice(0, 8)}…
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
