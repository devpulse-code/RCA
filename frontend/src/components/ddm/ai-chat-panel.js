// RCA/frontend/src/components/ddm/ai-chat-panel.js
import { aiService } from "../../services/ddm/ai-service.js";
import { sessionStore } from "../../stores/session-store.js";
import { showToast } from "../ui/toast.js";

export default class AiChatPanel {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.currentFile = null;
    this._createPanel();
  }

  _createPanel() {
    // The FAB is already in HTML; only create the chat panel itself (no extra FAB)
    this.panel = document.createElement("div");
    this.panel.id = "ai-chat-panel";
    this.panel.className = "ai-chat-panel hidden";
    this.panel.innerHTML = `
      <div class="ai-chat-header">
        <span class="ai-chat-title">AI Assistant</span>
        <button id="ai-chat-close" class="ai-chat-close">&times;</button>
      </div>
      <div id="ai-file-context" class="hidden text-xs p-2 border-b bg-gray-50 dark:bg-gray-800"></div>
      <div id="ai-chat-messages" class="ai-chat-messages"></div>
      <div class="ai-chat-input-area">
        <input type="text" id="ai-chat-input" placeholder="Ask a question..." class="ai-chat-input">
        <button id="ai-chat-send" class="ai-chat-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
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
    this.panel.querySelector("#ai-chat-send").addEventListener("click", () => {
      const text = this.input.value.trim();
      if (text) {
        this.sendMessage(text);
        this.input.value = "";
      }
    });
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
      div.className = `ai-message ${msg.type === 'user' ? 'ai-message-user' : 'ai-message-assistant'}`;
      if (msg.text) {
        div.textContent = msg.text;
      } else if (msg.files) {
        const list = document.createElement("ul");
        msg.files.forEach(f => {
          const li = document.createElement("li");
          li.textContent = f.name;
          list.appendChild(li);
        });
        div.appendChild(list);
      } else if (msg.answer) {
        div.innerHTML = `<p>${msg.answer}</p>`;
        if (msg.citations && msg.citations.length) {
          const cite = document.createElement("p");
          cite.className = "ai-citations";
          cite.textContent = `Sources: ${msg.citations.join(", ")}`;
          div.appendChild(cite);
        }
      }
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