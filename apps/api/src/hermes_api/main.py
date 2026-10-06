from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from hermes_api.api.routes import conversations, dev, health, knowledge, webhooks
from hermes_api.config import get_settings

settings = get_settings()

app = FastAPI(
    title="ZEUS AGENT API",
    version="0.2.0",
    description=(
        "Piloto multiempresa para atendimento inteligente com estado persistente, "
        "idempotência e handoff humano."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(webhooks.router)
app.include_router(conversations.router)
app.include_router(knowledge.router)
app.include_router(dev.router)
