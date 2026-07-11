// RCA/frontend/src/components/ui/modal.js
export function openModal(content, onOpen) {
  const existing = document.getElementById("ddm-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "ddm-modal";
  // Dark overlay with backdrop blur
  modal.className = "fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50";

  modal.innerHTML = `
    <div class="bg-[#0a0f16] border border-[rgba(13,94,140,0.25)] rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 relative"
         style="box-shadow: 0 0 30px rgba(13,94,140,0.15);">
      <div id="modal-content">${content}</div>
      <button id="modal-close" class="mt-4 text-[#7B8494] hover:text-[#E1E6EC] hover:underline transition-colors text-sm">Close</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.close = () => modal.remove();

  modal.querySelector("#modal-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });

  if (onOpen) onOpen(modal);
  return modal;
}
// end of RCA/frontend/src/components/ui/modal.js