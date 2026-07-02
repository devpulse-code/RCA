// RCA/frontend/src/services/ddm/auth-service.js
const API_BASE = "/api";

export async function passcodeLogin(passcode) {
  const res = await fetch(`${API_BASE}/auth/passcode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function adminLogin(username, password, totp = null) {
  const res = await fetch(`${API_BASE}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, totp }),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}
// end of RCA/frontend/src/services/ddm/auth-service.js