// RCA/frontend/src/components/ui/modal.js
export function openModal(content, onOpen) {
  const existing = document.getElementById("ddm-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "ddm-modal";
  modal.className = "fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50";

  modal.innerHTML = `
    <div class="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 relative modal-enter"
         style="box-shadow: 0 0 30px rgba(13,94,140,0.15);">
      <div id="modal-content">${content}</div>
      <button id="modal-close" class="mt-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline transition-colors text-sm">Close</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.close = () => {
    modal.querySelector(".modal-enter")?.classList.add("modal-exit");
    setTimeout(() => modal.remove(), 200);
  };

  modal.querySelector("#modal-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });

  // Trigger entrance animation after a tick
  requestAnimationFrame(() => {
    const inner = modal.querySelector(".modal-enter");
    if (inner) inner.classList.add("modal-entering");
  });

  if (onOpen) onOpen(modal);
  return modal;
}
// end of RCA/frontend/src/components/ui/modal.js