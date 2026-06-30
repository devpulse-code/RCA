# RCA/backend/src/core/db/seed.py
import asyncio
from sqlalchemy import select
from backend.src.core.db.database import async_session, engine
from backend.src.modules.ddm.models.admin import Admin
from backend.src.modules.ddm.models.group import Group
from backend.src.core.models.base import Base
from backend.src.core.utils.encryption import hash_password


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Check if admin exists
        result = await session.execute(select(Admin).limit(1))
        admin = result.scalar_one_or_none()
        if admin is None:
            admin = Admin(
                username="superadmin",
                password_hash=hash_password("Admin12345!"),   # meets complexity rules
                must_change_password=True,
            )
            session.add(admin)
            # Create default groups
            groups = ["staff", "management", "guests"]
            for name in groups:
                group = Group(name=name)
                session.add(group)
            await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
# end of RCA/backend/src/core/db/seed.py