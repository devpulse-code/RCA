# D:\Development\Website\rca-platform\backend\src\modules\ddm\services\auth_service.py
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.ddm.models.user import User
from src.modules.ddm.services.passcode_service import get_user_by_passcode
from src.core.middleware.session import create_session

class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Invalid passcode"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

async def authenticate_passcode(db: AsyncSession, passcode: str) -> tuple[User, str]:
    """Validate passcode and create a session. Returns (user, session_id)."""
    user = await get_user_by_passcode(db, passcode)
    if not user:
        raise AuthenticationError("Invalid passcode")
    # Collect group IDs (as strings)
    group_ids = [str(g.id) for g in user.groups]
    session_id = await create_session(
        user_id=str(user.id),
        groups=group_ids,
        is_admin=False
    )
    return user, session_id

# end of D:\Development\Website\rca-platform\backend\src\modules\ddm\services\auth_service.py