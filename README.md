# ZEUS AGENT — Atendimento Inteligente para Empresas

Repositório do **ZEUS AGENT**, evoluído a partir do estudo de viabilidade original **HERMES Agent / Projeto de Negócio** (versão 1.0, 15/09/2026).

## Estado atual — Sprint 1

A primeira fundação executável já está implementada:

- persistência SQLAlchemy para **empresa, contato, conversa, mensagem e evento de execução**;
- base de conhecimento aprovada por empresa;
- migration Alembic inicial para PostgreSQL;
- idempotência por `tenant + canal + external_message_id`;
- isolamento de consultas por `tenant_id`;
- estado persistente da conversa;
- handoff humano que pausa a automação;
- revalidação do bloqueio antes de gravar resposta automática;
- integração do ZEUS AGENT com o motor técnico atual, **Hermes Agent API Server**, via `/v1/chat/completions`;
- modo de desenvolvimento seguro quando o motor do ZEUS AGENT ainda não estiver em execução;
- endpoint de teste ponta a ponta para `mensagem -> conversa -> ZEUS AGENT/fallback -> resposta`;
- testes automatizados de saúde, idempotência, isolamento, handoff e persistência do fluxo.

> O estudo é um planejamento com hipóteses. Integrações Meta, filas, custos e métricas reais ainda precisam ser homologados no piloto.

## Objetivo da primeira versão

Entregar um piloto multiempresa capaz de:

- receber mensagens de **WhatsApp** e **Instagram Direct**;
- responder dúvidas com base em conteúdo aprovado pela empresa;
- registrar interessados e histórico por empresa/contato;
- consultar/solicitar agendamento;
- transferir a conversa para atendimento humano;
- persistir estado da conversa e impedir respostas tardias da IA após handoff;
- registrar eventos, falhas e custo operacional;
- manter isolamento entre empresas no servidor.

## Arquitetura

```text
WhatsApp / Instagram
        |
        v
   Webhooks/API
        |
        v
Tenant + Idempotência + Persistência
        |
        +--> Conversa / Mensagens / Eventos (PostgreSQL)
        |
        +--> Processador
                 |
                 +--> regra de handoff humano
                 +--> base aprovada do tenant
                 +--> ZEUS AGENT
                          +--> Hermes Agent API Server (provider atual)
                            |
                            v
                    resposta gerada
                 |
                 v
          revalidação do handoff
```

A fila persistente com Redis é o próximo passo antes de considerar os webhooks prontos para produção.

## Stack

- **API:** Python + FastAPI
- **ORM:** SQLAlchemy 2
- **Migrations:** Alembic
- **Banco:** PostgreSQL
- **Fila planejada:** Redis
- **Agente:** ZEUS AGENT; provider técnico atual: Hermes Agent API Server compatível com OpenAI
- **Painel:** React + TypeScript + Vite
- **Containerização:** Docker Compose

## Estrutura principal

```text
apps/
  api/
    migrations/                 migrations Alembic
    src/hermes_api/
      api/routes/               endpoints HTTP
      services/                 agente, handoff e processamento
      database.py               conexão SQLAlchemy
      models.py                 entidades persistentes
      repository.py             regras de persistência/tenant
  web/                          painel web inicial
infra/
docs/
```

## Subir localmente

### 1. Variáveis de ambiente

```bash
cp .env.example .env
```

### 2. PostgreSQL e Redis

```bash
docker compose up -d postgres redis
```

### 3. API

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e '.[dev]'
alembic upgrade head
uvicorn hermes_api.main:app --reload
```

A documentação interativa fica em `http://localhost:8000/docs`.

## Testar o fluxo sem Meta

### Criar uma empresa de desenvolvimento

```bash
curl -X POST http://localhost:8000/dev/companies \
  -H "Content-Type: application/json" \
  -d '{"name":"Studio Aurora","slug":"studio-aurora"}'
```

Copie o `id` retornado e use como `tenant_id`.

### Adicionar informação aprovada

```bash
curl -X POST http://localhost:8000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id":"SEU-TENANT-ID",
    "title":"Horário de atendimento",
    "content":"Atendimento de segunda a sexta, das 9h às 18h.",
    "approved_by":"responsavel-piloto"
  }'
```

### Enviar uma mensagem de teste

```bash
curl -X POST http://localhost:8000/dev/messages \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id":"SEU-TENANT-ID",
    "channel":"whatsapp",
    "external_message_id":"msg-001",
    "external_contact_id":"contato-001",
    "text":"Qual é o horário?"
  }'
```

Se `HERMES_ENABLED=false`, o ZEUS AGENT usa um fallback explícito de desenvolvimento. Ele **não finge ser IA**: apenas permite validar banco, idempotência e fluxo.

## Conectar o motor atual do ZEUS AGENT

O ZEUS AGENT usa, nesta fase, o Hermes Agent API Server como provider técnico compatível com OpenAI. Depois de iniciar o gateway desse provider com o API Server habilitado, ajuste:

```dotenv
HERMES_ENABLED=true
HERMES_BASE_URL=http://localhost:8642
HERMES_API_KEY=change-me-local-dev
HERMES_MODEL=hermes-agent
```

O backend do ZEUS AGENT envia somente o histórico da conversa atual e os artigos ativos da empresa atual ao endpoint `/v1/chat/completions`.

## Front-end conectado ao backend

O console React agora lê as conversas persistidas no PostgreSQL através do FastAPI.

No arquivo `.env` da raiz, configure:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_TENANT_ID=UUID-DA-EMPRESA
```

O Vite está configurado para carregar as variáveis da raiz do repositório.

Para obter um tenant em desenvolvimento:

```bash
curl -X POST http://localhost:8000/dev/companies \
  -H "Content-Type: application/json" \
  -d '{"name":"Studio Aurora","slug":"studio-aurora"}'
```

Use o `id` retornado em `VITE_TENANT_ID` e inicie o painel:

```bash
cd apps/web
npm install
npm run dev
```

A tela **Conversas** passa a usar dados reais dos endpoints:

- `GET /conversations?tenant_id=...`
- `GET /conversations/{id}?tenant_id=...`
- `POST /conversations/{id}/handoff?tenant_id=...`
- `POST /conversations/{id}/resume?tenant_id=...`

As consultas e ações do painel são filtradas pelo tenant no servidor. O envio manual de mensagem ainda permanece desativado até a integração real do canal estar pronta.

## Handoff humano

Uma solicitação explícita como:

```text
Quero falar com um atendente
```

faz a conversa entrar em `human_handoff` e define `automation_paused=true`. Uma resposta automática em processamento precisa revalidar esse estado antes de ser registrada/enviada.

Para retomar manualmente:

```bash
POST /conversations/{conversation_id}/resume
```

## Endpoints atuais

- `GET /health`
- `POST /webhooks/whatsapp`
- `POST /webhooks/instagram`
- `GET /conversations/{conversation_id}`
- `POST /conversations/{conversation_id}/handoff`
- `POST /conversations/{conversation_id}/resume`
- `POST /knowledge`
- `POST /dev/companies`
- `GET /dev/companies`
- `POST /dev/messages`

Os endpoints `/dev/*` ficam desativados quando `APP_ENV=production`.

## Testes

```bash
cd apps/api
pytest -q
```

Estado atual: **7 testes passando**.

## Próximo marco — Sprint 2

1. Transformar o processamento síncrono em **fila persistente Redis + worker**.
2. Implementar validação real de assinatura dos webhooks da Meta.
3. Criar tabela de conexões de canal para resolver o tenant pela conta autenticada, retirando `tenant_id` do contrato externo.
4. Implementar envio de resposta ao WhatsApp Cloud API em conta de teste.
5. Adicionar inbox humano inicial no painel web.
6. Adicionar testes de concorrência: mensagem duplicada, handoff durante geração e duas reservas simultâneas.
