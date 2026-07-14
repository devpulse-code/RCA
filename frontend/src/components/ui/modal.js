// RCA/frontend/src/components/ui/modal.js

export function openModal(content, onOpen) {

    document.getElementById("ddm-modal")?.remove();

    const modal = document.createElement("div");

    modal.id = "ddm-modal";

    modal.innerHTML = `
        <div class="ddm-modal-card">

            <div id="modal-content">
                ${content}
            </div>

            <div class="modal-footer">

                <button id="modal-close">
                    Close
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    modal.close = () => modal.remove();

    modal.querySelector("#modal-close").onclick = () => modal.close();

    modal.onclick = e => {

        if(e.target === modal){

            modal.close();

        }

    };

    if(onOpen){

        onOpen(modal);

    }

    return modal;

}

// end of RCA/frontend/src/components/ui/modal.js