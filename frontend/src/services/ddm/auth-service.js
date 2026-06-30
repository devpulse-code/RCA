// D:\Development\Website\rca-platform\frontend\src\services\ddm\auth-service.js
export const authService = { /* placeholder */ };
// end of D:\Development\Website\rca-platform\frontend\src\services\ddm\auth-service.js// RCA/frontend/src/services/ddm/auth-service.js
const API_BASE = "/api";

export async function passcodeLogin(passcode) {
  const res = await fetch(`${API_BASE}/auth/passcode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}
// end of RCA/frontend/src/services/ddm/auth-service.js