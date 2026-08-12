(() => {
  const MOBILE_BREAKPOINT = 860;
  const STORAGE_KEY = "student-sidebar-collapsed";

  function decodePath(value) {
    try { return decodeURIComponent(value || ""); } catch { return value || ""; }
  }

  function getFileName(pathname) {
    const cleanPath = decodePath(pathname).split("?")[0].split("#")[0].replace(/\/+$/, "");
    return (cleanPath.split("/").pop() || "").toLowerCase();
  }

  function getElements() {
    const sidebar = document.getElementById("sidebarEl") || document.getElementById("navSidebarEl");
    const toggle = document.getElementById("menuToggle");
    const body = document.getElementById("bodyEl") || document.querySelector(".body");
    return { sidebar, toggle, body };
  }

  function setAria(toggle, expanded) {
    if (!toggle) return;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-label", expanded ? "Thu gọn Sidebar" : "Mở Sidebar");
    toggle.setAttribute("title", expanded ? "Thu gọn Sidebar" : "Mở Sidebar");
  }

  function applyActiveMenu() {
    const currentFile = getFileName(window.location.pathname);
    const menuItems = Array.from(document.querySelectorAll(".sidebar-menu .menu-item, .nav-menu .menu-item"));
    let matchedItem = null;

    menuItems.forEach(item => {
      item.classList.remove("active");
      const href = item.getAttribute("href") || "";
      if (!href || href === "#" || href.startsWith("javascript:")) return;
      try {
        const linkFile = getFileName(new URL(href, window.location.href).pathname);
        if (linkFile && currentFile && linkFile === currentFile) matchedItem = item;
      } catch {
        const linkFile = getFileName(href);
        if (linkFile && currentFile && linkFile === currentFile) matchedItem = item;
      }
    });

    if (matchedItem) matchedItem.classList.add("active");
  }

  function initSidebar() {
    const { sidebar, toggle, body } = getElements();
    if (!sidebar || !toggle) {
      applyActiveMenu();
      return;
    }
    if (sidebar.dataset.sharedSidebarReady === "true") return;
    sidebar.dataset.sharedSidebarReady = "true";

    const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
    const closeMobile = () => {
      if (!isMobile()) return;
      sidebar.classList.remove("collapsed");
      body?.classList.remove("sidebar-open");
      setAria(toggle, false);
    };
    const applyDesktopState = () => {
      if (isMobile()) {
        sidebar.classList.remove("collapsed");
        body?.classList.remove("sidebar-open");
        setAria(toggle, false);
        return;
      }
      const collapsed = localStorage.getItem(STORAGE_KEY) === "true";
      sidebar.classList.toggle("collapsed", collapsed);
      setAria(toggle, !collapsed);
    };

    applyDesktopState();
    toggle.addEventListener("click", event => {
      event.preventDefault();
      if (isMobile()) {
        const opened = sidebar.classList.toggle("collapsed");
        body?.classList.toggle("sidebar-open", opened);
        setAria(toggle, opened);
      } else {
        const collapsed = sidebar.classList.toggle("collapsed");
        localStorage.setItem(STORAGE_KEY, String(collapsed));
        setAria(toggle, !collapsed);
      }
    });

    body?.addEventListener("click", event => {
      if (!isMobile() || !sidebar.classList.contains("collapsed")) return;
      if (!sidebar.contains(event.target) && event.target !== toggle) closeMobile();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMobile();
    });
    window.addEventListener("resize", applyDesktopState);

    document.querySelectorAll('.sidebar-menu a[href="#"], .nav-menu a[href="#"]').forEach(item => {
      item.addEventListener("click", event => event.preventDefault());
    });
    applyActiveMenu();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSidebar, { once: true });
  else initSidebar();
})();
