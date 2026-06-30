// RCA/frontend/src/components/ddm/ai-chat-panel.js
import { aiService } from "../../services/ddm/ai-service.js";
import { sessionStore } from "../../stores/session-store.js";
import { showToast } from "../ui/toast.js";

export default class AiChatPanel {
  constructor() {
    this.isOpen = false;
    this.messages = [];  // {type: 'user'|'ai', text, files?, citations?, mode?}
    this._initFloatingButton();
    this._createPanel();
  }

  _initFloatingButton() {
    const btn = document.createElement("button");
    btn.id = "ai-chat-toggle";
    btn.className = "fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-2xl z-50";
    btn.innerHTML = "💬";
    btn.addEventListener("click", () => this.toggle());
    document.body.appendChild(btn);
  }

  _createPanel() {
    this.panel = document.createElement("div");
    this.panel.id = "ai-chat-panel";
    this.panel.className = "fixed bottom-24 right-6 w-80 max-h-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 hidden flex flex-col";
    this.panel.innerHTML = `
      <div class="flex justify-between items-center p-3 border-b">
        <span class="font-semibold text-sm">AI Assistant</span>
        <button id="ai-chat-close" class="text-gray-500 hover:text-gray-700">&times;</button>
      </div>
      <div id="ai-chat-messages" class="flex-1 overflow-y-auto p-3 space-y-2 text-sm"></div>
      <div class="p-2 border-t">
        <input type="text" id="ai-chat-input" placeholder="Ask a question..." class="w-full border p-2 rounded text-sm">
      </div>
    `;
    document.body.appendChild(this.panel);

    this.messagesDiv = this.panel.querySelector("#ai-chat-messages");
    this.input = this.panel.querySelector("#ai-chat-input");

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
    banner.className = `text-xs p-2 text-center ${sessionStore.contentSearchEnabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`;
    banner.innerHTML = sessionStore.contentSearchEnabled
      ? "Content search is ON – I can answer questions using file contents."
      : "Content search disabled – I can only help find files by name and description.";
    this.panel.insertBefore(banner, this.messagesDiv);
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
      bubble.className = `inline-block p-2 rounded ${msg.type === 'user' ? 'bg-indigo-100' : 'bg-gray-100'}`;
      
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
          cite.className = "text-xs text-gray-500 mt-1";
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
      const response = await aiService.chat(text, contentEnabled);
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