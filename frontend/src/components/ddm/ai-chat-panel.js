// RCA/frontend/src/components/ddm/ai-chat-panel.js
import { aiService } from "../../services/ddm/ai-service.js";
import { sessionStore } from "../../stores/session-store.js";
import { showToast } from "../ui/toast.js";

export default class AiChatPanel {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.currentFile = null; // { id, name }
    this._initFloatingButton();
    this._createPanel();
    document.addEventListener('ai-chat-message', (e) => {
      if (e.detail && e.detail.text) {
        this.sendMessage(e.detail.text);
      }
    });
  }

  _initFloatingButton() {
    const btn = document.createElement("button");
    btn.id = "ai-chat-toggle";
    btn.className = "fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-2xl z-50";
    btn.innerHTML = "💬";
    btn.addEventListener("click", () => this.toggle());
    document.body.appendChild(btn);
  }

  _createPanel() {
    this.panel = document.createElement("div");
    this.panel.id = "ai-chat-panel";
    this.panel.className = "fixed bottom-24 right-6 w-80 max-h-96 rounded-lg shadow-2xl border z-50 hidden flex flex-col";
    this.panel.innerHTML = `
      <div class="flex justify-between items-center p-3 border-b">
        <span class="font-semibold text-sm">AI Assistant</span>
        <button id="ai-chat-close" class="ai-chat-close text-lg leading-none">&times;</button>
      </div>
      <div id="ai-file-context" class="hidden text-xs p-2 border-b"></div>
      <div id="ai-chat-messages" class="flex-1 overflow-y-auto p-3 space-y-2 text-sm"></div>
      <div class="p-2 border-t">
        <input type="text" id="ai-chat-input" placeholder="Ask a question..." class="w-full border p-2 rounded text-sm">
      </div>
    `;
    document.body.appendChild(this.panel);

    this.messagesDiv = this.panel.querySelector("#ai-chat-messages");
    this.input = this.panel.querySelector("#ai-chat-input");
    this.fileContextDiv = this.panel.querySelector("#ai-file-context");

    this.panel.querySelector("#ai-chat-close").addEventListener("click", () => this.close());
    this.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const text = this.input.value.trim();
        if (text) {
          this.sendMessage(text);
          this.input.value = "";
        }
      }
    });

    this._showContentToggleBanner();
  }

  _showContentToggleBanner() {
    const banner = document.createElement("div");
    banner.id = "ai-content-banner";
    banner.className = `text-xs p-2 text-center`;
    banner.classList.add(
      sessionStore.contentSearchEnabled ? 'banner-on' : 'banner-off'
    );
    banner.textContent = sessionStore.contentSearchEnabled
      ? "Content search is ON – I can answer questions using file contents."
      : "Content search disabled – I can only help find files by name and description.";
    this.panel.insertBefore(banner, this.messagesDiv);
  }

  setFileContext(file) {
    this.currentFile = file;
    if (file) {
      this.fileContextDiv.textContent = `📎 Asking about: ${file.name}`;
      this.fileContextDiv.classList.remove("hidden");
    } else {
      this.fileContextDiv.classList.add("hidden");
      this.currentFile = null;
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.panel.classList.toggle("hidden", !this.isOpen);
  }

  close() {
    this.isOpen = false;
    this.panel.classList.add("hidden");
  }

  addMessage(type, content) {
    this.messages.push({ type, ...content });
    this.renderMessages();
  }

  renderMessages() {
    this.messagesDiv.innerHTML = "";
    this.messages.forEach(msg => {
      const div = document.createElement("div");
      div.className = `mb-2 ${msg.type === 'user' ? 'text-right' : 'text-left'}`;
      const bubble = document.createElement("span");
      bubble.className = `inline-block p-2 rounded ${
        msg.type === 'user' ? 'ai-bubble-user' : 'ai-bubble-assistant'
      }`;

      if (msg.text) {
        bubble.textContent = msg.text;
      } else if (msg.files) {
        const list = document.createElement("ul");
        msg.files.forEach(f => {
          const li = document.createElement("li");
          li.className = "text-xs";
          li.textContent = f.name;
          list.appendChild(li);
        });
        bubble.appendChild(list);
      } else if (msg.answer) {
        bubble.innerHTML = `<p>${msg.answer}</p>`;
        if (msg.citations && msg.citations.length) {
          const cite = document.createElement("p");
          cite.className = "text-xs opacity-75 mt-1";
          cite.textContent = `Sources: ${msg.citations.join(", ")}`;
          bubble.appendChild(cite);
        }
      }

      div.appendChild(bubble);
      this.messagesDiv.appendChild(div);
    });
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }

  async sendMessage(text) {
    this.addMessage("user", { text });
    const contentEnabled = sessionStore.contentSearchEnabled;
    try {
      const response = await aiService.chat(text, contentEnabled, this.currentFile?.id);
      const { mode, message, files, answer, citations } = response;
      if (mode === "file_finding") {
        this.addMessage("ai", { files, text: message || "Here are some files:" });
      } else if (mode === "content_qa") {
        this.addMessage("ai", { answer, citations, text: null });
      } else if (mode === "fallback") {
        this.addMessage("ai", { text: message, files: files || [] });
      } else {
        this.addMessage("ai", { text: "Sorry, something went wrong." });
      }
    } catch (err) {
      showToast("AI chat failed", "error");
      this.addMessage("ai", { text: "Error connecting to AI assistant." });
    }
  }
}
// end of RCA/frontend/src/components/ddm/ai-chat-panel.js