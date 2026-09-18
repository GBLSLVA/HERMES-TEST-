# Sprint 1 — Persistência, isolamento e primeiro fluxo

Data de implementação: 18/09/2026.

## Entregue

- [x] SQLAlchemy e PostgreSQL como fonte de verdade.
- [x] Alembic com migration inicial.
- [x] Empresa/tenant.
- [x] Contato por tenant e canal.
- [x] Conversa com estado persistente.
- [x] Mensagens inbound/outbound.
- [x] Eventos de execução/auditoria.
- [x] Base de conhecimento aprovada por tenant.
- [x] Idempotência por mensagem externa.
- [x] Handoff humano e pausa de automação.
- [x] Retomada manual.
- [x] Revalidação do handoff antes da resposta automática.
- [x] Adapter HTTP para Hermes Agent API Server.
- [x] Endpoint de desenvolvimento para executar o fluxo sem Meta.
- [x] Testes automatizados centrais.

## Ainda não entregue

- [ ] Validação real de assinatura Meta.
- [ ] Resolução de tenant por conexão de canal autenticada.
- [ ] Fila Redis/worker.
- [ ] Envio real de resposta para WhatsApp e Instagram.
- [ ] Agenda/CRM.
- [ ] Autenticação e papéis do painel.
- [ ] Indicadores e custo real.

## Critérios cobertos do estudo

A implementação já cria base técnica para os testes de:

- evento entregue duas vezes;
- pedido explícito de humano;
- isolamento entre empresas;
- estado persistente da conversa;
- bloqueio de resposta automática depois do handoff.

Os critérios de reserva duplicada, falha após gravação de reserva e janela de envio dependem das integrações das próximas sprints.
