from fastapi import FastAPI

from hermes_api.api.routes import conversations, dev, health, knowledge, webhooks

app = FastAPI(
    title="HERMES API",
    version="0.2.0",
    description=(
        "Piloto multiempresa para atendimento inteligente com estado persistente, "
        "idempotência e handoff humano."
    ),
)

app.include_router(health.router)
app.include_router(webhooks.router)
app.include_router(conversations.router)
app.include_router(knowledge.router)
app.include_router(dev.router)
