// ============================================================
//  MAIN.JS — Khởi tạo và điều phối toàn bộ app
// ============================================================

const App = {
  // ── Khởi động ─────────────────────────────────────────────
  init() {
    this.renderSidebar();
    this.initActions();
    this.initMobile();
    Router.init();
  },

  // ── Mobile navigation ─────────────────────────────────────
  initMobile() {
    document.getElementById("mobile-back")?.addEventListener("click", () => {
      document.querySelector(".window-body")?.classList.remove("note-open");
    });
  },

  openNoteOnMobile() {
    if (window.innerWidth <= 540) {
      document.querySelector(".window-body")?.classList.add("note-open");
    }
  },

  // ── Action buttons ────────────────────────────────────────
  initActions() {
    // Nút AA: cycle qua 3 cỡ chữ trong content
    const sizes = ["14.5px", "16px", "18px"];
    let sizeIdx = 0;
    document.getElementById("btn-font")?.addEventListener("click", () => {
      sizeIdx = (sizeIdx + 1) % sizes.length;
      document.querySelectorAll(".content-body p, .content-body li").forEach((el) => {
        el.style.fontSize = sizes[sizeIdx];
      });
    });

    // Nút New Note: cuộn sidebar xuống cuối và focus vào note đầu tiên chưa pinned
    document.getElementById("btn-new-note")?.addEventListener("click", () => {
      const first = NOTES.find((n) => !n.pinned);
      if (first) Router.navigateTo(first.id);
    });
  },

  // ── Sidebar ───────────────────────────────────────────────
  renderSidebar() {
    const pinnedList = document.getElementById("pinned-list");
    const notesList  = document.getElementById("notes-list");

    const pinned = NOTES.filter((n) => n.pinned);
    const others = NOTES.filter((n) => !n.pinned);

    pinnedList.innerHTML = pinned.map((n) => this.noteItemHTML(n)).join("");
    notesList.innerHTML  = others.map((n) => this.noteItemHTML(n)).join("");

    this.bindNoteClicks();
    this.initSearch();
  },

  // Gắn sự kiện click cho tất cả note items
  bindNoteClicks() {
    document.querySelectorAll(".note-item").forEach((el) => {
      el.addEventListener("click", () => Router.navigateTo(el.dataset.id));
    });
  },

  // ── Search ────────────────────────────────────────────────
  initSearch() {
    const input        = document.getElementById("search-input");
    const clearBtn     = document.getElementById("search-clear");
    const pinnedList   = document.getElementById("pinned-list");
    const notesList    = document.getElementById("notes-list");
    const labelPinned  = document.getElementById("label-pinned");
    const labelNotes   = document.getElementById("label-notes");
    const labelResults = document.getElementById("label-results");
    const resultsEl    = document.getElementById("search-results");
    const emptyEl      = document.getElementById("search-empty");

    const showNormal = () => {
      pinnedList.hidden   = false;
      notesList.hidden    = false;
      labelPinned.hidden  = false;
      labelNotes.hidden   = false;
      labelResults.hidden = true;
      resultsEl.hidden    = true;
      emptyEl.hidden      = true;
      clearBtn.hidden     = true;
    };

    const showSearch = (query) => {
      const q = query.toLowerCase().trim();

      pinnedList.hidden   = true;
      notesList.hidden    = true;
      labelPinned.hidden  = true;
      labelNotes.hidden   = true;
      labelResults.hidden = false;
      resultsEl.hidden    = false;
      clearBtn.hidden     = false;

      // Tìm trong title và body (sau khi strip HTML)
      const matches = NOTES.filter((n) => {
        const bodyText = n.body.replace(/<[^>]*>/g, " ").toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          bodyText.includes(q)
        );
      });

      if (matches.length === 0) {
        resultsEl.innerHTML = "";
        emptyEl.hidden = false;
      } else {
        emptyEl.hidden = true;
        resultsEl.innerHTML = matches
          .map((n) => this.noteItemHTML(n, q))
          .join("");
        // Bind click cho kết quả mới render
        resultsEl.querySelectorAll(".note-item").forEach((el) => {
          el.addEventListener("click", () => Router.navigateTo(el.dataset.id));
        });
      }

      // Cập nhật active state
      App.updateSidebarActive(Router.currentNoteId);
    };

    input.addEventListener("input", () => {
      const q = input.value.trim();
      if (q === "") showNormal();
      else showSearch(q);
    });

    clearBtn.addEventListener("click", () => {
      input.value = "";
      input.focus();
      showNormal();
    });
  },

  // Lấy preview text từ thẻ <p> đầu tiên trong body
  getPreview(body) {
    const match = body.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (!match) return "";
    const text = match[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text.length > 80 ? text.slice(0, 80) + "…" : text;
  },

  // Tạo HTML cho 1 note item trong sidebar
  // query (tuỳ chọn): nếu có sẽ highlight từ khóa
  noteItemHTML(note, query = "") {
    const date = new Date(note.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const preview = this.getPreview(note.body);

    const highlight = (text) => {
      if (!query) return text;
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
      return text.replace(regex, "<mark>$1</mark>");
    };

    return `
      <div class="note-item" data-id="${note.id}">
        <div class="note-item-title">${note.emoji} ${highlight(note.title)}</div>
        <div class="note-item-meta">
          <span class="note-item-date">${date}</span>
          <span class="note-item-excerpt">${highlight(preview)}</span>
        </div>
      </div>
    `;
  },

  // Đánh dấu note đang active trong sidebar
  updateSidebarActive(noteId) {
    document.querySelectorAll(".note-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === noteId);
    });
  },

  // ── Content area ──────────────────────────────────────────
  renderContent(note) {
    this.openNoteOnMobile();
    const contentEl = document.getElementById("note-content");
    if (!contentEl) return;

    // Thêm class để trigger animation
    contentEl.classList.remove("fade-in");
    void contentEl.offsetWidth; // trick để reset animation
    contentEl.classList.add("fade-in");

    const date = new Date(note.date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    contentEl.innerHTML = `
      <div class="content-date">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${date}
      </div>
      <div class="content-body">${note.body}</div>
    `;
  },
};

// ── Khởi động khi trang đã load xong ─────────────────────────
document.addEventListener("DOMContentLoaded", () => App.init());
