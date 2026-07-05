// RCA/frontend/src/components/ui/toast.js

/**
 * Regular auto-dismiss toast (as before).
 */
export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded shadow text-white z-50 ${
    type === "error" ? "bg-red-500" : type === "success" ? "bg-green-500" : "bg-blue-500"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/**
 * Persistent toast for displaying a passcode with a copy button.
 * Only disappears when the user clicks the × close button.
 */
export function showPasscodeToast(message, passcode) {
  const toast = document.createElement("div");
  toast.className =
    "fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm";
  toast.innerHTML = `
    <div class="flex items-start">
      <div class="flex-1">
        <p class="text-sm font-semibold text-gray-800">${escapeHtml(message)}</p>
        <div class="mt-2 flex items-center">
          <code class="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm font-mono">${escapeHtml(passcode)}</code>
          <button class="copy-btn ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium">Copy</button>
        </div>
      </div>
      <button class="close-btn text-gray-400 hover:text-gray-600 ml-3 text-xl leading-none" aria-label="Close">&times;</button>
    </div>
  `;
  document.body.appendChild(toast);

  const copyBtn = toast.querySelector(".copy-btn");
  const closeBtn = toast.querySelector(".close-btn");

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(passcode).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = passcode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
    });
  });

  closeBtn.addEventListener("click", () => toast.remove());
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// end of RCA/frontend/src/components/ui/toast.js