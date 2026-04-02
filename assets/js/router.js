// ============================================================
//  ROUTER.JS — Xử lý điều hướng giữa các notes
//  Dùng URL hash (#about-work, #projects...) để điều hướng
//  VD: website.com/#projects → hiển thị note "projects"
// ============================================================

const Router = {
  // Note đang được hiển thị hiện tại
  currentNoteId: null,

  // Khởi động router: đọc URL hiện tại và hiển thị đúng note
  init() {
    // Lắng nghe khi người dùng nhấn nút Back/Forward của trình duyệt
    window.addEventListener("hashchange", () => this.handleRoute());

    // Xử lý URL lần đầu load trang
    this.handleRoute();
  },

  // Đọc hash từ URL và hiển thị note tương ứng
  handleRoute() {
    // Lấy hash từ URL (VD: "#projects" → "projects")
    const hash = window.location.hash.slice(1);

    if (hash) {
      // Nếu có hash → tìm note tương ứng
      const note = NOTES.find((n) => n.id === hash);
      if (note) {
        this.showNote(note.id);
        return;
      }
    }

    // Mặc định: hiển thị note pinned đầu tiên
    const firstPinned = NOTES.find((n) => n.pinned);
    if (firstPinned) {
      this.showNote(firstPinned.id);
    }
  },

  // Chuyển đến một note theo id
  navigateTo(noteId) {
    window.location.hash = noteId;
  },

  // Hiển thị nội dung note lên màn hình
  showNote(noteId) {
    const note = NOTES.find((n) => n.id === noteId);
    if (!note) return;

    this.currentNoteId = noteId;

    // Cập nhật title trên tab trình duyệt
    document.title = `${note.emoji} ${note.title}`;

    // Render nội dung
    App.renderContent(note);

    // Cập nhật trạng thái active trên sidebar
    App.updateSidebarActive(noteId);
  },
};
