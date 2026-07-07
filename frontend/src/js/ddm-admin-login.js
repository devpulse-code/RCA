// RCA/frontend/src/js/ddm-admin-login.js
const form = document.getElementById("login-form");
const errorMsg = document.getElementById("error-message");
const totpSection = document.getElementById("totp-section");
const recoverySection = document.getElementById("recovery-section");
const loginSection = document.getElementById("login-section");

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
}

async function verifySession() {
    try {
        const res = await fetch("/api/ddm/auth/session", { credentials: "include" });
        if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.role === "admin") {
                window.location.href = "/pages/ddm/admin-panel.html";
            }
        }
    } catch (e) {}
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.style.display = "none";
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("/api/auth/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Login failed" }));
            showError(err.detail || "Login failed");
            return;
        }

        const data = await res.json();
        if (data.require_totp) {
            loginSection.style.display = "none";
            totpSection.style.display = "block";
        } else {
            window.location.href = "/pages/ddm/admin-panel.html";
        }
    } catch (err) {
        showError("Network error. Please try again.");
    }
});

document.getElementById("totp-submit").addEventListener("click", async () => {
    const code = document.getElementById("totp-code").value;
    try {
        const res = await fetch("/api/auth/admin/2fa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ totp_code: code })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Invalid code" }));
            showError(err.detail || "Invalid code");
            return;
        }
        window.location.href = "/pages/ddm/admin-panel.html";
    } catch (err) {
        showError("Network error.");
    }
});

document.getElementById("recovery-submit").addEventListener("click", async () => {
    const code = document.getElementById("recovery-code").value;
    try {
        const res = await fetch("/api/auth/admin/2fa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ recovery_code: code })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Invalid recovery code" }));
            showError(err.detail || "Invalid code");
            return;
        }
        window.location.href = "/pages/ddm/admin-panel.html";
    } catch (err) {
        showError("Network error.");
    }
});

document.getElementById("show-recovery").addEventListener("click", () => {
    totpSection.style.display = "none";
    recoverySection.style.display = "block";
});

verifySession();
// end of RCA/frontend/src/js/ddm-admin-login.js