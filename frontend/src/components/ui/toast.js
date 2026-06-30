// RCA/frontend/src/components/ui/toast.js
export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded shadow text-white z-50 ${
    type === "error" ? "bg-red-500" : type === "success" ? "bg-green-500" : "bg-blue-500"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
// end of RCA/frontend/src/components/ui/toast.js