# Roadmap de 8–12 semanas

## Semanas 1–2 — Descoberta
- [ ] escolher empresa piloto real;
- [ ] mapear fluxos, FAQ, regras e responsável humano;
- [ ] confirmar agenda/CRM e contas de canal.

### Fundação técnica já concluída
- [x] modelo multiempresa;
- [x] persistência de contato, conversa, mensagem e evento;
- [x] base aprovada por tenant;
- [x] migration inicial;
- [x] idempotência;
- [x] handoff e retomada;
- [x] adapter para Hermes Agent API Server;
- [x] testes centrais do fluxo.

## Semanas 2–3 — Prova dos canais
- [ ] validar assinatura e traduzir eventos Meta;
- [ ] resolver tenant pela conexão do canal;
- [ ] receber e responder em contas de teste nos dois canais;
- [x] provar idempotência no contrato normalizado.

## Semanas 3–6 — Operação e integração
- [x] isolamento básico por tenant no banco/repositório;
- [x] handoff humano;
- [ ] agenda/solicitação;
- [x] persistência de estado;
- [ ] fila durável e worker por conversa.

## Semanas 5–7 — Painel e indicadores
- [ ] login e papéis;
- [ ] fila humana;
- [ ] histórico operacional no frontend;
- [ ] custos e eventos.

## Semanas 7–10 — Homologação e piloto
- [ ] cenários de aceite;
- [ ] operação supervisionada;
- [ ] métricas de qualidade e falha.

## Semanas 10–12 — Ajuste comercial
- [ ] revisar escopo, custo, preço e suporte;
- [ ] decidir se há base para implantação repetível.
