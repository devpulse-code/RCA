# RCA/backend/src/core/db/database.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from backend.src.config.settings import settings

engine = create_async_engine(
    settings.assembled_database_url,
    echo=False,
    future=True,
)

async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
# end of RCA/backend/src/core/db/database.py