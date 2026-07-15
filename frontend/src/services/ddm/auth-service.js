// RCA/frontend/src/services/ddm/auth-service.js
const API_BASE = "/api";

export async function passcodeLogin(passcode) {
  const res = await fetch(`${API_BASE}/ddm/auth/passcode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.detail || body.message || "Login failed");
    error.data = body;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function adminLogin(username, password, totp = null) {
  const res = await fetch(`${API_BASE}/ddm/auth/admin/login`, {   // <-- corrected path
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, totp }),
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.detail || body.message || "Login failed");
    error.data = body;
    error.status = res.status;
    throw error;
  }
  return res.json();
}
// end of RCA/frontend/src/services/ddm/auth-service.js