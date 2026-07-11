// RCA/frontend/src/components/ddm/announcement-panel.js
export default class AnnouncementPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.fetchAndRender();
    }

    async fetchAndRender() {
        try {
            const res = await fetch('/api/ddm/announcements/', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load announcements');
            const data = await res.json();
            this.render(data);
        } catch (err) {
            console.error('AnnouncementPanel error:', err);
            this.container.innerHTML = '<p class="text-red-500">Unable to load announcements.</p>';
        }
    }

    render(announcements) {
        if (!announcements || announcements.length === 0) {
            this.container.innerHTML = '<p class="text-gray-500 italic">No announcements at this time.</p>';
            return;
        }
        let html = '<div class="announcements-panel">';
        announcements.forEach(a => {
            html += `
                <div class="announcement-item">
                    <h3>${this.escapeHtml(a.title)}</h3>
                    <p>${this.escapeHtml(a.body)}</p>
                    <span class="text-sm text-gray-400">${new Date(a.created_at).toLocaleDateString()}</span>
                </div>
            `;
        });
        html += '</div>';
        this.container.innerHTML = html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
// end of RCA/frontend/src/components/ddm/announcement-panel.js