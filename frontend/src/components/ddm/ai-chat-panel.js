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
      <div id="ai-suggestions" class="ai-suggestions p-2 border-t dark:border-gray-700">
        <p class="text-xs text-gray-500 mb-2">Try asking:</p>
        <div class="flex flex-wrap gap-2">
          <button class="ai-suggestion-btn" data-suggestion="Find recent PDFs">Find recent PDFs</button>
          <button class="ai-suggestion-btn" data-suggestion="Summarize the onboarding doc">Summarize the onboarding doc</button>
          <button class="ai-suggestion-btn" data-suggestion="Show all spreadsheets">Show all spreadsheets</button>
          <button class="ai-suggestion-btn" data-suggestion="What are the key points in the policy?">What are the key points?</button>
        </div>
      </div>
      <div class="ai-chat-input-area">
        <input type="text" id="ai-chat-input" placeholder="Ask a question..." class="ai-chat-input">
        <button id="ai-chat-send" class="ai-chat-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    `;
    document.body.appendChild(this.panel);

    this.messagesDiv = this.panel.querySelector("#ai-chat-messages");
    this.input = this.panel.querySelector("#ai-chat-input");
    this.fileContextDiv = this.panel.querySelector("#ai-file-context");
    this.suggestionsDiv = this.panel.querySelector("#ai-suggestions");

    // Suggestion buttons
    this.suggestionsDiv.querySelectorAll(".ai-suggestion-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.input.value = btn.dataset.suggestion;
        this.input.focus();
      });
    });

    // Close button
    this.panel.querySelector("#ai-chat-close").addEventListener("click", () => this.close());

    // Send on Enter
    this.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const text = this.input.value.trim();
        if (text) {
          this.sendMessage(text);
          this.input.value = "";
        }
      }
    });

    // Send button
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
        // Plain text message
        div.textContent = msg.text;
      } else if (msg.answer) {
        // Answer (for content_qa or summarize)
        div.innerHTML = `<p>${msg.answer}</p>`;
        if (msg.citations && msg.citations.length) {
          const cite = document.createElement("p");
          cite.className = "ai-citations";
          cite.textContent = `Sources: ${msg.citations.join(", ")}`;
          div.appendChild(cite);
        }
      } else if (msg.files && msg.files.length) {
        // File list (file_finding)
        const list = document.createElement("ul");
        msg.files.forEach(f => {
          const li = document.createElement("li");
          li.textContent = f.name;
          list.appendChild(li);
        });
        div.appendChild(list);
        if (msg.message) {
          const textNode = document.createElement("p");
          textNode.textContent = msg.message;
          div.prepend(textNode);
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
        this.addMessage("ai", { files, message });
      } else if (mode === "content_qa" || mode === "summarize") {
        this.addMessage("ai", { answer, citations });
      } else if (mode === "general" || mode === "fallback") {
        this.addMessage("ai", { text: message || "Sorry, I couldn't process that." });
      } else {
        // Unknown mode, treat as fallback
        this.addMessage("ai", { text: message || "I'm not sure how to help with that." });
      }
    } catch (err) {
      console.error(err);
      showToast("AI chat failed", "error");
      this.addMessage("ai", { text: "Error connecting to AI assistant." });
    }
  }
}
// end of RCA/frontend/src/components/ddm/ai-chat-panel.js