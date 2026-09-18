from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from hermes_api.config import get_settings


class Base(DeclarativeBase):
    pass


@lru_cache
def get_engine() -> Engine:
    """Cria o engine apenas quando a aplicação realmente precisa abrir o banco.

    Além de reduzir efeitos colaterais no import, isso permite que testes substituam
    a dependência de banco sem exigir um driver PostgreSQL instalado no host de teste.
    """
    return create_engine(get_settings().database_url, pool_pre_ping=True)


def get_db() -> Generator[Session, None, None]:
    session_factory = sessionmaker(
        bind=get_engine(),
        autoflush=False,
        expire_on_commit=False,
    )
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
