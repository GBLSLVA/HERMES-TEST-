import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">HERMES / PILOTO</span>
        <h1>Atendimento inteligente com controle humano.</h1>
        <p>
          Painel inicial para acompanhar conversas, handoff, falhas, custos e qualidade por empresa.
        </p>
      </section>

      <section className="grid">
        <article><strong>900</strong><span>casos/mês — hipótese do estudo</span></article>
        <article><strong>60%</strong><span>casos repetitivos — hipótese</span></article>
        <article><strong>0</strong><span>vazamentos aceitáveis</span></article>
        <article><strong>100%</strong><span>pedidos de humano encaminhados</span></article>
      </section>

      <section className="notice">
        <h2>Próxima entrega</h2>
        <p>FAQ aprovado + conta de teste + transferência humana com estado persistido.</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
