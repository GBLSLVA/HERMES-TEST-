import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import ConnectedInbox from "./ConnectedInbox";
import ConnectedRecentConversations from "./ConnectedRecentConversations";
import { getHealth } from "./api";
import { activity, knowledgeItems } from "./demo";
import "./styles.css";

type Page =
  | "dashboard"
  | "inbox"
  | "knowledge"
  | "integrations"
  | "metrics"
  | "settings";

const navItems: Array<{ id: Page; label: string; icon: string }> = [
  { id: "dashboard", label: "Visão geral", icon: "⌂" },
  { id: "inbox", label: "Conversas", icon: "◫" },
  { id: "knowledge", label: "Conhecimento", icon: "◇" },
  { id: "integrations", label: "Integrações", icon: "↗" },
  { id: "metrics", label: "Indicadores", icon: "⌁" },
];

const pilotTargets = [
  { value: "95%", label: "Respostas corretas", detail: "na amostra revisada" },
  { value: "100%", label: "Pedido de humano", detail: "encaminhado ao responsável" },
  { value: "≤ 30s", label: "Primeira resposta útil", detail: "percentil 95 em texto" },
  { value: "≥ 99%", label: "Custo e resultado", detail: "registrados no processamento" },
];

function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="page-heading">
      <div className="page-heading-copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="page-heading-action">{action}</div> : null}
    </section>
  );
}

function Dashboard({ onOpenInbox }: { onOpenInbox: () => void }) {
  const maxActivity = Math.max(...activity.map((item) => item.value));

  return (
    <div className="page-stack">
      <PageHeading
        title="Visão geral"
        description="Boa noite, Gabriel. Veja rapidamente o que está acontecendo no atendimento e onde sua equipe precisa agir."
        action={
          <button className="primary-button" type="button" onClick={onOpenInbox}>
            Abrir conversas
          </button>
        }
      />

      <div className="context-note" role="note">
        <span className="context-note-marker" aria-hidden="true" />
        <div>
          <strong>Ambiente demonstrativo</strong>
          <span>As métricas abaixo são premissas do estudo, não resultados reais do piloto.</span>
        </div>
      </div>

      <section className="summary-strip" aria-label="Resumo do piloto">
        <div className="summary-item">
          <span>Volume mensal</span>
          <strong>900</strong>
          <small>casos/mês na hipótese inicial</small>
        </div>
        <div className="summary-item">
          <span>Casos repetitivos</span>
          <strong>60%</strong>
          <small>potencial inicial para automação</small>
        </div>
        <div className="summary-item">
          <span>Capacidade potencial</span>
          <strong>36h</strong>
          <small>por mês, antes da revisão humana</small>
        </div>
        <div className="summary-item">
          <span>Handoff explícito</span>
          <strong>100%</strong>
          <small>meta de encaminhamento para humano</small>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="surface activity-panel">
          <header className="surface-header">
            <div>
              <h2>Movimento ao longo do dia</h2>
              <p>Distribuição demonstrativa do volume por horário.</p>
            </div>
            <span className="quiet-badge">Hoje</span>
          </header>

          <div className="chart-wrap" aria-label="Gráfico demonstrativo de volume por horário">
            <div className="chart-lines" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="bars">
              {activity.map((item) => (
                <div className="bar-column" key={item.label}>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ height: Math.max(16, (item.value / maxActivity) * 100) + "%" }}
                      title={item.value + " atendimentos"}
                    />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="surface target-panel">
          <header className="surface-header">
            <div>
              <h2>Metas do piloto</h2>
              <p>Critérios que precisam ser medidos antes de escalar.</p>
            </div>
          </header>

          <div className="target-list compact">
            {pilotTargets.slice(0, 3).map((target) => (
              <div className="target-row" key={target.label}>
                <strong>{target.value}</strong>
                <div>
                  <span>{target.label}</span>
                  <small>{target.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="surface conversations-panel">
        <header className="surface-header">
          <div>
            <h2>Conversas recentes</h2>
            <p>Dados do tenant ativo quando o backend estiver disponível.</p>
          </div>
          <button className="text-button" type="button" onClick={onOpenInbox}>
            Ver todas
          </button>
        </header>
        <div className="conversation-table">
          <ConnectedRecentConversations />
        </div>
      </section>
    </div>
  );
}

function Knowledge() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleItems = knowledgeItems.filter((item) =>
    !normalizedQuery ||
    item.title.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
    item.updated.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
  );

  return (
    <div className="page-stack">
      <PageHeading
        title="Conhecimento"
        description="Revise o conteúdo que o Hermes pode usar nas respostas da empresa."
      />

      <section className="inline-stats" aria-label="Resumo da base de conhecimento">
        <div><strong>4</strong><span>itens demonstrativos</span></div>
        <div><strong>3</strong><span>publicados</span></div>
        <div><strong>1</strong><span>aguardando revisão</span></div>
      </section>

      <section className="surface">
        <div className="toolbar">
          <label className="search-field" htmlFor="knowledge-search">
            <span>Buscar conteúdo</span>
            <div>
              <span aria-hidden="true">⌕</span>
              <input
                id="knowledge-search"
                placeholder="Título ou termo"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </label>
        </div>

        <div className="knowledge-list">
          {visibleItems.length ? (
            visibleItems.map((item) => (
              <div className="knowledge-row" key={item.title}>
                <div className="knowledge-copy">
                  <strong>{item.title}</strong>
                  <span>{item.updated}</span>
                </div>
                <span className={"knowledge-state " + (item.state === "Publicado" ? "published" : "review")}>
                  {item.state}
                </span>
              </div>
            ))
          ) : (
            <div className="recent-empty">Nenhum conteúdo corresponde à busca.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function Integrations() {
  const integrations = [
    {
      name: "WhatsApp Cloud API",
      description: "Receber e enviar mensagens pela conta autorizada da empresa.",
      status: "A configurar",
      code: "WA",
    },
    {
      name: "Instagram Direct",
      description: "Adaptador previsto para mensagens de contas profissionais.",
      status: "Planejado",
      code: "IG",
    },
    {
      name: "Hermes Agent",
      description: "Motor de conversa conectado ao backend por API compatível com OpenAI.",
      status: "Preparado",
      code: "H",
    },
    {
      name: "Agenda / CRM",
      description: "Conector definido de acordo com a empresa piloto real.",
      status: "Pendente",
      code: "AG",
    },
  ];

  return (
    <div className="page-stack">
      <PageHeading
        title="Integrações"
        description="Canais e ferramentas que transformam a conversa em operação."
      />

      <section className="surface integration-list">
        {integrations.map((integration) => (
          <article className="integration-row" key={integration.name}>
            <div className="integration-code" aria-hidden="true">{integration.code}</div>
            <div className="integration-copy">
              <h2>{integration.name}</h2>
              <p>{integration.description}</p>
            </div>
            <span className="integration-status">{integration.status}</span>
          </article>
        ))}
      </section>
    </div>
  );
}

function Metrics() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Indicadores"
        description="Metas de qualidade do piloto antes de qualquer escala comercial."
      />

      <section className="surface quality-surface">
        <div className="target-list">
          {pilotTargets.map((target) => (
            <article className="quality-row" key={target.label}>
              <strong>{target.value}</strong>
              <div>
                <h2>{target.label}</h2>
                <p>{target.detail}.</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="critical-note">
        <div>
          <strong>Critério crítico</strong>
          <h2>Zero vazamento de dados e zero reserva duplicada nos testes de aceite.</h2>
          <p>Isso é um objetivo de validação do piloto, não uma garantia absoluta de segurança.</p>
        </div>
      </section>
    </div>
  );
}

function Settings() {
  return (
    <div className="page-stack">
      <PageHeading
        title="Configurações"
        description="Informações do ambiente e preferências operacionais do console."
      />

      <section className="surface settings-list">
        <div className="settings-row">
          <div><strong>Empresa ativa</strong><span>Studio Aurora · ambiente demonstrativo</span></div>
          <span className="status-chip">Piloto</span>
        </div>
        <div className="settings-row">
          <div><strong>Modo do agente</strong><span>Controle humano e base aprovada</span></div>
          <span className="status-chip positive">Controlado</span>
        </div>
        <div className="settings-row">
          <div><strong>Endpoint da API</strong><span>Definido pela variável VITE_API_URL</span></div>
          <code>http://localhost:8000</code>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    getHealth()
      .then(() => active && setApiOnline(true))
      .catch(() => active && setApiOnline(false));
    return () => {
      active = false;
    };
  }, []);

  const title = useMemo(
    () => navItems.find((item) => item.id === page)?.label ?? "Configurações",
    [page],
  );

  const selectPage = (next: Page) => {
    setPage(next);
    setMobileNavOpen(false);
  };

  const renderPage = () => {
    if (page === "dashboard") return <Dashboard onOpenInbox={() => selectPage("inbox")} />;
    if (page === "inbox") return <ConnectedInbox />;
    if (page === "knowledge") return <Knowledge />;
    if (page === "integrations") return <Integrations />;
    if (page === "metrics") return <Metrics />;
    return <Settings />;
  };

  return (
    <div className="app-shell">
      {mobileNavOpen ? (
        <button
          className="nav-overlay"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Fechar menu"
          type="button"
        />
      ) : null}

      <aside className={"sidebar " + (mobileNavOpen ? "open" : "")}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">H</div>
          <div>
            <strong>HERMES</strong>
            <span>Console de atendimento</span>
          </div>
        </div>

        <div className="company-selector" aria-label="Empresa ativa: Studio Aurora">
          <span className="company-avatar">SA</span>
          <span>
            <strong>Studio Aurora</strong>
            <small>Ambiente piloto</small>
          </span>
        </div>

        <nav className="main-nav" aria-label="Navegação principal">
          <p>Menu</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => selectPage(item.id)}
              aria-current={page === item.id ? "page" : undefined}
              type="button"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={page === "settings" ? "active" : ""}
            onClick={() => selectPage("settings")}
            type="button"
          >
            <span aria-hidden="true">⚙</span>
            Configurações
          </button>
          <div className="sidebar-profile">
            <div className="avatar">GS</div>
            <div>
              <strong>Gabriel</strong>
              <span>Administrador</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menu"
              type="button"
            >
              ☰
            </button>
            <span className="topbar-page">{title}</span>
          </div>

          <div
            className={
              "api-status " +
              (apiOnline === true ? "online" : apiOnline === false ? "offline" : "")
            }
            role="status"
            aria-live="polite"
          >
            <i aria-hidden="true" />
            <span>
              {apiOnline === true
                ? "API online"
                : apiOnline === false
                  ? "API offline"
                  : "Verificando API"}
            </span>
          </div>
        </header>

        <main className="content">{renderPage()}</main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
