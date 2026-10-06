import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { getHealth } from "./api";
import ConnectedInbox from "./ConnectedInbox";
import ConnectedRecentConversations from "./ConnectedRecentConversations";
import { activity, knowledgeItems } from "./demo";
import "./styles.css";

type Page = "dashboard" | "inbox" | "knowledge" | "integrations" | "metrics" | "settings";

const navItems: Array<{ id: Page; label: string; icon: string }> = [
  { id: "dashboard", label: "Visão geral", icon: "⌂" },
  { id: "inbox", label: "Conversas", icon: "◫" },
  { id: "knowledge", label: "Conhecimento", icon: "◇" },
  { id: "integrations", label: "Integrações", icon: "↗" },
  { id: "metrics", label: "Indicadores", icon: "⌁" },
];

function Dashboard() {
  const maxActivity = Math.max(...activity.map((item) => item.value));

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="overline">VISÃO GERAL</p>
          <h1>Boa noite, Gabriel.</h1>
          <p className="page-subtitle">Acompanhe atendimento, automação e pontos que precisam da sua equipe.</p>
        </div>
        <button className="primary-button">+ Nova empresa</button>
      </section>

      <div className="demo-banner">
        <span className="demo-dot" />
        <div>
          <strong>Ambiente demonstrativo</strong>
          <span>Os números abaixo usam as premissas do estudo do HERMES, não resultados reais.</span>
        </div>
      </div>

      <section className="metric-grid">
        <article className="metric-card">
          <div className="metric-top"><span>Volume mensal</span><span className="metric-icon">↗</span></div>
          <strong>900</strong>
          <p>casos/mês na hipótese inicial</p>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Casos repetitivos</span><span className="metric-icon">◎</span></div>
          <strong>60%</strong>
          <p>potencial inicial para automação</p>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Capacidade potencial</span><span className="metric-icon">◷</span></div>
          <strong>36h</strong>
          <p>por mês, antes da revisão humana</p>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Handoff explícito</span><span className="metric-icon">✓</span></div>
          <strong>100%</strong>
          <p>meta de encaminhamento para humano</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel activity-panel">
          <div className="panel-header">
            <div><p className="panel-eyebrow">ATENDIMENTO</p><h2>Movimento ao longo do dia</h2></div>
            <button className="ghost-button">Hoje⌄</button>
          </div>
          <div className="chart-wrap">
            <div className="chart-lines"><span /><span /><span /><span /></div>
            <div className="bars">
              {activity.map((item) => (
                <div className="bar-column" key={item.label}>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ height: Math.max(14, (item.value / maxActivity) * 100) + "%" }} />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <span><i className="legend-swatch legend-hermes" /> Hermes</span>
            <span><i className="legend-swatch legend-human" /> Atendimento humano</span>
          </div>
        </article>

        <article className="panel health-panel">
          <div className="panel-header">
            <div><p className="panel-eyebrow">OPERAÇÃO</p><h2>Saúde do atendimento</h2></div>
            <span className="healthy-badge">Estável</span>
          </div>
          <div className="health-ring"><div className="health-ring-inner"><strong>95%</strong><span>meta</span></div></div>
          <div className="health-list">
            <div><span>Respostas corretas</span><strong>Meta 95%</strong></div>
            <div><span>Falhas críticas</span><strong>Meta 0</strong></div>
            <div><span>Custo registrado</span><strong>Meta ≥ 99%</strong></div>
          </div>
        </article>
      </section>

      <section className="panel conversations-panel">
        <div className="panel-header">
          <div><p className="panel-eyebrow">CONVERSAS</p><h2>Atendimentos recentes</h2></div>
          <button className="text-button">Ver todas →</button>
        </div>
        <div className="conversation-table">
          <ConnectedRecentConversations />
        </div>
      </section>
    </div>
  );
}

function Knowledge() {
  return (
    <div className="page-stack">
      <section className="page-heading compact-heading">
        <div><p className="overline">CONHECIMENTO</p><h1>Base aprovada</h1><p className="page-subtitle">Controle exatamente o que o Hermes pode usar nas respostas da empresa.</p></div>
        <button className="primary-button">+ Novo conteúdo</button>
      </section>
      <section className="knowledge-summary">
        <div><strong>4</strong><span>itens demonstrativos</span></div>
        <div><strong>3</strong><span>publicados</span></div>
        <div><strong>1</strong><span>aguardando revisão</span></div>
      </section>
      <section className="panel">
        <div className="knowledge-toolbar">
          <div className="inbox-search knowledge-search"><span>⌕</span><input placeholder="Buscar na base..." /></div>
          <button className="ghost-button">Todos os status⌄</button>
        </div>
        <div className="knowledge-list">
          {knowledgeItems.map((item) => (
            <div className="knowledge-row" key={item.title}>
              <div className="knowledge-icon">◇</div>
              <div><strong>{item.title}</strong><span>{item.updated}</span></div>
              <span className={"knowledge-state " + (item.state === "Publicado" ? "published" : "review")}>{item.state}</span>
              <button className="row-action">→</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Integrations() {
  const cards = [
    { name: "WhatsApp Cloud API", eyebrow: "META", description: "Receba e envie mensagens pela conta autorizada da empresa.", status: "A configurar", monogram: "W" },
    { name: "Instagram Direct", eyebrow: "META", description: "Adaptador previsto para mensagens de contas profissionais.", status: "Planejado", monogram: "IG" },
    { name: "Hermes Agent", eyebrow: "IA", description: "Motor de conversa conectado ao backend por API compatível com OpenAI.", status: "Preparado", monogram: "H" },
    { name: "Agenda / CRM", eyebrow: "OPERAÇÃO", description: "Conector será definido de acordo com a empresa piloto real.", status: "Pendente", monogram: "A" },
  ];

  return (
    <div className="page-stack">
      <section className="page-heading compact-heading">
        <div><p className="overline">INTEGRAÇÕES</p><h1>Canais e ferramentas</h1><p className="page-subtitle">Conexões necessárias para transformar conversa em operação.</p></div>
      </section>
      <section className="integration-grid">
        {cards.map((card) => (
          <article className="integration-card" key={card.name}>
            <div className="integration-icon">{card.monogram}</div>
            <div className="integration-copy"><p className="panel-eyebrow">{card.eyebrow}</p><h2>{card.name}</h2><p>{card.description}</p></div>
            <div className="integration-footer"><span>{card.status}</span><button className="secondary-button small-button">Configurar</button></div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Metrics() {
  return (
    <div className="page-stack">
      <section className="page-heading compact-heading">
        <div><p className="overline">INDICADORES</p><h1>Qualidade antes de escala</h1><p className="page-subtitle">Metas do piloto definidas no estudo de viabilidade.</p></div>
        <button className="ghost-button">Exportar</button>
      </section>
      <section className="target-grid">
        <article className="target-card"><span>01</span><strong>95%</strong><h2>Respostas corretas</h2><p>Na amostra revisada pela empresa.</p></article>
        <article className="target-card"><span>02</span><strong>100%</strong><h2>Pedido de humano</h2><p>Encaminhado ao responsável.</p></article>
        <article className="target-card"><span>03</span><strong>≤ 30s</strong><h2>Primeira resposta útil</h2><p>Percentil 95 em texto e condições normais.</p></article>
        <article className="target-card"><span>04</span><strong>≥ 99%</strong><h2>Custo e resultado</h2><p>Registrados nos casos processados.</p></article>
      </section>
      <section className="panel acceptance-panel">
        <div><p className="panel-eyebrow">CRITÉRIO CRÍTICO</p><h2>Zero vazamento e zero reserva duplicada.</h2><p>Critérios de aceite em teste, não garantia de segurança absoluta.</p></div>
        <div className="shield-mark">✓</div>
      </section>
    </div>
  );
}

function Settings() {
  return (
    <div className="page-stack">
      <section className="page-heading compact-heading">
        <div><p className="overline">CONFIGURAÇÕES</p><h1>Ambiente HERMES</h1><p className="page-subtitle">Preferências de interface e informações do ambiente.</p></div>
      </section>
      <section className="panel settings-panel">
        <div className="settings-group"><div><strong>Empresa ativa</strong><span>Studio Aurora · ambiente demonstrativo</span></div><button className="secondary-button small-button">Alterar</button></div>
        <div className="settings-group"><div><strong>Modo do agente</strong><span>Controle humano e base aprovada</span></div><span className="healthy-badge">Seguro</span></div>
        <div className="settings-group"><div><strong>Endpoint da API</strong><span>Definido por VITE_API_URL</span></div><code>http://localhost:8000</code></div>
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
    getHealth().then(() => active && setApiOnline(true)).catch(() => active && setApiOnline(false));
    return () => { active = false; };
  }, []);

  const title = useMemo(() => navItems.find((item) => item.id === page)?.label ?? "Configurações", [page]);

  const renderPage = () => {
    if (page === "dashboard") return <Dashboard />;
    if (page === "inbox") return <ConnectedInbox />;
    if (page === "knowledge") return <Knowledge />;
    if (page === "integrations") return <Integrations />;
    if (page === "metrics") return <Metrics />;
    return <Settings />;
  };

  const selectPage = (next: Page) => {
    setPage(next);
    setMobileNavOpen(false);
  };

  return (
    <div className="app-shell">
      {mobileNavOpen ? <button className="nav-overlay" onClick={() => setMobileNavOpen(false)} /> : null}
      <aside className={"sidebar " + (mobileNavOpen ? "open" : "")}>
        <div className="brand">
          <div className="brand-mark">H</div>
          <div><strong>HERMES</strong><span>AGENT CONSOLE</span></div>
        </div>

        <button className="company-selector">
          <span className="company-avatar">SA</span>
          <span><strong>Studio Aurora</strong><small>Ambiente piloto</small></span>
          <b>⌄</b>
        </button>

        <nav className="main-nav">
          <p>NAVEGAÇÃO</p>
          {navItems.map((item) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => selectPage(item.id)}>
              <span>{item.icon}</span>{item.label}{item.id === "inbox" ? <b className="nav-count">2</b> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className={page === "settings" ? "active" : ""} onClick={() => selectPage("settings")}><span>⚙</span> Configurações</button>
          <div className="sidebar-profile">
            <div className="avatar">GS</div>
            <div><strong>Gabriel</strong><span>Administrador</span></div>
            <button>•••</button>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMobileNavOpen(true)}>☰</button>
            <span className="topbar-page">{title}</span>
          </div>
          <div className="topbar-actions">
            <div className={"api-status " + (apiOnline === true ? "online" : apiOnline === false ? "offline" : "")}>
              <i /><span>{apiOnline === true ? "API online" : apiOnline === false ? "API offline" : "Verificando API"}</span>
            </div>
            <button className="icon-button">⌕</button>
            <button className="icon-button notification-button">◌<i /></button>
          </div>
        </header>

        <main className="content">{renderPage()}</main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
