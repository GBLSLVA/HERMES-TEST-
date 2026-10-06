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

function statusFor(item: Pick<ConversationSummary, "state" | "automation_paused">): UiStatus {
  if (item.automation_paused || item.state === "human_handoff") return "humano";
  if (item.state === "awaiting_confirmation" || item.state === "awaiting_tool") return "aguardando";
  return "ia";
}

function StatusPill({ status }: { status: UiStatus }) {
  const labels = { ia: "Hermes", humano: "Humano", aguardando: "Aguardando" } as const;
  return <span className={"status-pill status-" + status}>{labels[status]}</span>;
}

function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span className={"channel channel-" + channel}>
      {channel === "whatsapp" ? "W" : channel === "instagram" ? "IG" : "?"}
    </span>
  );
}

function contactName(item: Pick<ConversationSummary, "contact_display_name" | "contact_external_id">) {
  if (item.contact_display_name?.trim()) return item.contact_display_name.trim();
  const suffix = item.contact_external_id.slice(-6);
  return suffix ? `Contato · ${suffix}` : "Contato";
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
  const date = new Date(value);
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / 60000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  return formatter.format(days, "day");
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
      const data = await getConversation(TENANT_ID, conversationId);
      setDetail(data);
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
      if (selectedSummary.automation_paused || selectedSummary.state === "human_handoff") {
        await resumeConversation(TENANT_ID, selectedSummary.id);
        setActionMessage("Conversa devolvida ao Hermes.");
      } else {
        await handoffConversation(TENANT_ID, selectedSummary.id);
        setActionMessage("Atendimento assumido pela equipe.");
      }
      await loadList(selectedSummary.id);
      await loadDetail(selectedSummary.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar o atendimento.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!TENANT_ID) {
    return (
      <div className="page-stack">
        <section className="page-heading compact-heading">
          <div>
            <p className="overline">CONVERSAS</p>
            <h1>Inbox conectado</h1>
            <p className="page-subtitle">O front-end está pronto para usar as conversas persistidas do FastAPI.</p>
          </div>
        </section>
        <section className="panel inbox-empty-state">
          <div className="empty-state-icon">⌁</div>
          <h2>Defina o tenant do painel</h2>
          <p>
            Adicione <code>VITE_TENANT_ID</code> ao ambiente do front-end com o UUID da empresa que deve ser exibida.
          </p>
          <code>VITE_TENANT_ID=uuid-da-empresa</code>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-heading compact-heading">
        <div>
          <p className="overline">CONVERSAS</p>
          <h1>Inbox humano</h1>
          <p className="page-subtitle">
            Dados carregados do PostgreSQL pelo FastAPI. Handoff e retomada já executam ações reais.
          </p>
        </div>
        <button className="secondary-button" onClick={() => void loadList(selectedId ?? undefined)} disabled={loading}>
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </section>

      {error ? <div className="inbox-feedback error">{error}</div> : null}
      {actionMessage ? <div className="inbox-feedback success">{actionMessage}</div> : null}

      <section className="inbox-layout">
        <div className="conversation-list-panel">
          <div className="inbox-search">
            <span>⌕</span>
            <input
              placeholder="Buscar conversa..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="inbox-tabs">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
              Todos <b>{counts.all}</b>
            </button>
            <button className={filter === "human" ? "active" : ""} onClick={() => setFilter("human")}>
              Humanos <b>{counts.human}</b>
            </button>
            <button className={filter === "hermes" ? "active" : ""} onClick={() => setFilter("hermes")}>
              Hermes <b>{counts.hermes}</b>
            </button>
          </div>

          <div className="inbox-conversations">
            {loading ? (
              <div className="inbox-list-state"><span className="loading-spinner" /> Carregando conversas…</div>
            ) : filtered.length === 0 ? (
              <div className="inbox-list-state">Nenhuma conversa encontrada.</div>
            ) : (
              filtered.map((conversation) => {
                const name = contactName(conversation);
                return (
                  <button
                    key={conversation.id}
                    className={"inbox-item " + (selectedId === conversation.id ? "selected" : "")}
                    onClick={() => setSelectedId(conversation.id)}
                  >
                    <div className="avatar">{initials(name)}</div>
                    <div className="inbox-item-main">
                      <div>
                        <strong>{name}</strong>
                        <time>{relativeTime(conversation.last_message_at)}</time>
                      </div>
                      <p>{conversation.last_message_text || "Conversa sem mensagens."}</p>
                      <StatusPill status={statusFor(conversation)} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="chat-panel">
          {!selectedSummary ? (
            <div className="inbox-empty-state chat-empty">
              <div className="empty-state-icon">◫</div>
              <h2>Selecione uma conversa</h2>
              <p>As conversas deste tenant aparecerão aqui quando chegarem ao backend.</p>
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
                      {selectedSummary.channel === "whatsapp" ? "WhatsApp" : selectedSummary.channel === "instagram" ? "Instagram" : selectedSummary.channel}
                    </span>
                  </div>
                </div>
                <div className="chat-actions">
                  <StatusPill status={selectedStatus} />
                  <button
                    className="secondary-button small-button"
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
                  <div className="inbox-list-state"><span className="loading-spinner" /> Carregando histórico…</div>
                ) : detail?.messages.length ? (
                  detail.messages.map((message) => {
                    if (message.direction === "internal") {
                      return <div className="message-internal" key={message.id}>{message.text}</div>;
                    }
                    const inbound = message.direction === "inbound";
                    return (
                      <div className={"message " + (inbound ? "message-client" : "message-agent")} key={message.id}>
                        {!inbound ? (
                          <div className="message-agent-label">
                            <span className="mini-hermes">H</span> Hermes
                          </div>
                        ) : null}
                        <span>{message.text || "(mensagem sem texto)"}</span>
                        <time>{clockTime(message.created_at)}</time>
                      </div>
                    );
                  })
                ) : (
                  <div className="inbox-list-state">Esta conversa ainda não possui mensagens.</div>
                )}

                {selectedStatus === "humano" ? (
                  <div className="handoff-note">
                    <span>↗</span>
                    <div>
                      <strong>Automação pausada</strong>
                      <p>
                        {detail?.assigned_to
                          ? `Atendimento sob responsabilidade de ${detail.assigned_to}.`
                          : "A equipe humana assumiu esta conversa."}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <footer className="composer composer-disabled">
                <textarea
                  placeholder="Envio manual será conectado quando o adaptador do canal estiver pronto."
                  rows={2}
                  disabled
                />
                <div className="composer-actions">
                  <span>Leitura real do banco + handoff real já estão ativos.</span>
                  <button className="primary-button send-button" disabled>Enviar</button>
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
                <p className="panel-eyebrow">CONTEXTO REAL</p>
                <dl>
                  <div><dt>Canal</dt><dd>{selectedSummary.channel}</dd></div>
                  <div><dt>Responsável</dt><dd>{selectedSummary.assigned_to || (selectedStatus === "humano" ? "Equipe" : "Hermes")}</dd></div>
                  <div><dt>Estado</dt><dd>{selectedSummary.state}</dd></div>
                </dl>
              </div>
              <div className="contact-section">
                <p className="panel-eyebrow">IDENTIFICADORES</p>
                <dl>
                  <div><dt>Contato</dt><dd title={selectedSummary.contact_id}>{selectedSummary.contact_id.slice(0, 8)}…</dd></div>
                  <div><dt>Conversa</dt><dd title={selectedSummary.id}>{selectedSummary.id.slice(0, 8)}…</dd></div>
                </dl>
              </div>
            </>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
