# Arquitetura do HERMES

## Sprint 1 implementada

A Sprint 1 troca o armazenamento em memória por persistência relacional e introduz o primeiro fluxo executável do produto.

### Entidades

- `Company`: empresa/tenant comercial.
- `Contact`: contato externo isolado por empresa e canal.
- `Conversation`: estado persistente, handoff e responsável humano.
- `Message`: mensagens de entrada e saída, com idempotência por tenant/canal.
- `ExecutionEvent`: trilha de ações, falhas e resultados.
- `KnowledgeArticle`: informação aprovada por empresa enviada como contexto ao agente.

## Fluxo atual de uma mensagem

1. O servidor recebe um evento normalizado.
2. Confirma que a empresa existe e está ativa.
3. Verifica `tenant + canal + external_message_id` para impedir processamento duplicado.
4. Recupera ou cria contato e conversa dentro do mesmo tenant.
5. Persiste a mensagem de entrada e o evento correspondente.
6. Se houver pedido explícito de humano, ativa `human_handoff` e pausa a automação.
7. Caso contrário, recupera apenas o histórico e a base aprovada daquele tenant.
8. Quando habilitado, chama o API Server do Hermes em `/v1/chat/completions`.
9. Antes de persistir a resposta automática, revalida se o humano assumiu a conversa.
10. Persiste resposta e evento de execução.

## Limite importante da Sprint 1

Os endpoints `/webhooks/*` ainda recebem um contrato **normalizado interno**. A tradução do evento bruto da Meta, validação criptográfica da assinatura e resolução de `tenant_id` pela conexão autenticada do canal entram na Sprint 2.

`tenant_id` nunca deve ser escolhido a partir de texto enviado pelo cliente final.

## Próximo fluxo de produção

```text
Meta webhook bruto
  -> validação de assinatura
  -> resolução da conexão/canal
  -> tenant autenticado
  -> persistência idempotente
  -> Redis/fila durável
  -> worker por conversa
  -> handoff ou Hermes
  -> revalidação de permissão
  -> envio pelo canal
  -> auditoria/custo
```

## Componentes

### API
Webhooks, autenticação, tenant, idempotência, handoff, base aprovada e endpoints do painel.

### PostgreSQL
Fonte de verdade para empresas, contatos, conversas, mensagens, eventos e conhecimento aprovado.

### Redis
Disponível na infraestrutura, mas o worker/fila durável ainda será ligado na Sprint 2.

### Hermes Agent
Integração via API Server compatível com OpenAI. O backend controla o contexto enviado e não dá ao agente acesso irrestrito a dados de outros tenants.

### Painel web
Ainda é uma casca inicial. A inbox humana e o histórico operacional entram no próximo marco.
