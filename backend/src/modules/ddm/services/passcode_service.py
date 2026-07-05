# RCA/backend/src/modules/ddm/services/passcode_service.py
import secrets
import string
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.src.modules.ddm.models.user import User
from backend.src.core.utils.encryption import encrypt_data, decrypt_data


def generate_passcode(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


async def create_passcode_for_user(db: AsyncSession, user: User) -> str:
    """Generate a new passcode, encrypt and store it, deactivate previous."""
    user.passcode_active = False
    passcode = generate_passcode()
    user.encrypted_passcode = encrypt_data(passcode)
    user.passcode_active = True
    await db.commit()
    return passcode


async def revoke_passcode(db: AsyncSession, user: User):
    """Revoke current passcode."""
    user.passcode_active = False
    await db.commit()


async def get_passcode(db: AsyncSession, user: User) -> str:
    """Decrypt and return the active passcode (for admin)."""
    if not user.passcode_active:
        raise ValueError("Passcode is not active")
    return decrypt_data(user.encrypted_passcode)


async def verify_passcode(db: AsyncSession, passcode: str) -> User | None:
    """Find user with matching active passcode, eagerly loading groups."""
    result = await db.execute(
        select(User)
        .where(User.passcode_active == True)
        .options(selectinload(User.groups))
    )
    users = result.scalars().all()
    for user in users:
        try:
            if decrypt_data(user.encrypted_passcode) == passcode:
                return user
        except Exception:
            continue
    return None
# end of RCA/backend/src/modules/ddm/services/passcode_service.py