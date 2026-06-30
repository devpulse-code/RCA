# D:\Development\Website\rca-platform\backend\src\modules\ddm\schemas\auth.py
from pydantic import BaseModel, Field

class PasscodeLoginRequest(BaseModel):
    passcode: str = Field(..., min_length=8, max_length=64)

class PasscodeLoginResponse(BaseModel):
    message: str = "Login successful"
    redirect: str = "/dashboard"

class ErrorResponse(BaseModel):
    error: str
    message: str
    retry_after: int | None = None

# end of D:\Development\Website\rca-platform\backend\src\modules\ddm\schemas\auth.py