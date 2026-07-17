// RCA/frontend/src/components/ui/modal.js

export function openModal(content, onOpen) {
    document.getElementById("ddm-modal")?.remove();

    const modal = document.createElement("div");
    modal.id = "ddm-modal";
    modal.innerHTML = `
        <div class="ddm-modal-card">
            <div id="modal-content">${content}</div>
            <div class="modal-footer">
                <button id="modal-close">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.close = () => modal.remove();
    modal.querySelector("#modal-close").onclick = () => modal.close();
    modal.onclick = e => {
        if (e.target === modal) modal.close();
    };
    if (onOpen) onOpen(modal);
    return modal;
}

export function confirmModal({
    title = "Confirm",
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    danger = false,
}) {
    const content = `
        <h3>${title}</h3>
        <p style="margin: 1rem 0;">${message}</p>
    `;
    openModal(content, (modal) => {
        const footer = modal.querySelector(".modal-footer");
        footer.innerHTML = ""; // clear default close button
        const cancelBtn = document.createElement("button");
        cancelBtn.id = "modal-cancel";
        cancelBtn.textContent = cancelText;
        cancelBtn.className = "btn";
        cancelBtn.onclick = () => modal.close();

        const confirmBtn = document.createElement("button");
        confirmBtn.id = "modal-confirm";
        confirmBtn.textContent = confirmText;
        confirmBtn.className = `btn ${danger ? "btn-danger" : "btn-primary"}`;
        confirmBtn.onclick = () => {
            if (onConfirm) onConfirm();
            modal.close();
        };

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);
    });
}
// end of RCA/frontend/src/components/ui/modal.js