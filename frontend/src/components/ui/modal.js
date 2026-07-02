// RCA/frontend/src/components/ui/modal.js
export function openModal(content, onOpen) {
  const existing = document.getElementById("ddm-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "ddm-modal";
  modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-white p-6 rounded shadow-lg max-w-md w-full">
      <div id="modal-content">${content}</div>
      <button id="modal-close" class="mt-4 text-gray-500 hover:underline">Close</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Add a close method to the element so callers can do modal.close()
  modal.close = () => modal.remove();

  modal.querySelector("#modal-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });

  if (onOpen) onOpen(modal);
  return modal;
}
// end of RCA/frontend/src/components/ui/modal.js