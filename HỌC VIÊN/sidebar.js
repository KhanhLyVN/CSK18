(() => {
  "use strict";

  const MOBILE_BREAKPOINT = 860;
  const STORAGE_KEY = "student-sidebar-collapsed";
  const OVERLAY_CLASS = "sidebar-overlay";
  const READY_FLAG = "sharedSidebarReady";

  const safeStorage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch { /* Bộ nhớ có thể bị chặn ở chế độ riêng tư. */ }
    }
  };

  const decodePath = value => {
    try { return decodeURIComponent(value || ""); } catch { return value || ""; }
  };

  const normalizePath = value => decodePath(value)
    .split("?")[0]
    .split("#")[0]
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")
    .toLowerCase();

  const fileName = value => {
    const path = normalizePath(value);
    return path.split("/").pop() || "";
  };

  function getElements() {
    const sidebar = document.getElementById("sidebarEl") || document.getElementById("navSidebarEl");
    const toggle = document.getElementById("menuToggle");
    const body = document.getElementById("bodyEl") || document.querySelector(".body");
    return { sidebar, toggle, body };
  }

  function getMenuItems() {
    return Array.from(document.querySelectorAll(
      ".sidebar-menu .menu-item, .nav-menu .menu-item"
    ));
  }

  function setToggleA11y(toggle, expanded, sidebar) {
    if (!toggle) return;
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-label", expanded ? "Thu gọn Sidebar" : "Mở Sidebar");
    toggle.setAttribute("title", expanded ? "Thu gọn Sidebar" : "Mở Sidebar");
    if (sidebar?.id) toggle.setAttribute("aria-controls", sidebar.id);
  }

  function setActiveMenu() {
    const currentPath = normalizePath(window.location.pathname);
    const currentFile = fileName(currentPath);
    const items = getMenuItems();
    let matched = null;
    let bestScore = 0;

    items.forEach(item => item.classList.remove("active"));

    if (!currentPath || !currentFile) return;

    items.forEach(item => {
      const href = item.getAttribute("href") || "";
      if (!href || href === "#" || href.startsWith("javascript:")) return;

      let linkPath = "";
      try {
        linkPath = normalizePath(new URL(href, window.location.href).pathname);
      } catch {
        linkPath = normalizePath(href);
      }

      if (!linkPath) return;

      let score = 0;
      if (linkPath === currentPath) score = 3;
      else if (fileName(linkPath) === currentFile) score = 2;
      else if (currentPath.endsWith(`/${fileName(linkPath)}`)) score = 1;

      if (score > bestScore) {
        bestScore = score;
        matched = item;
      }
    });

    if (matched) matched.classList.add("active");
  }

  function ensureOverlay() {
    let overlay = document.querySelector(`.${OVERLAY_CLASS}`);
    if (!overlay) {
      overlay = document.createElement("button");
      overlay.type = "button";
      overlay.className = OVERLAY_CLASS;
      overlay.setAttribute("aria-label", "Đóng Sidebar");
      overlay.setAttribute("tabindex", "-1");
      document.body.appendChild(overlay);
    }

    if (!document.getElementById("sharedSidebarStyle")) {
      const style = document.createElement("style");
      style.id = "sharedSidebarStyle";
      style.textContent = `
        .${OVERLAY_CLASS} {
          position: fixed;
          inset: 0;
          z-index: 19;
          border: 0;
          padding: 0;
          background: rgba(42, 23, 18, .24);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity .22s ease, visibility .22s ease;
        }
        .${OVERLAY_CLASS}.is-visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        @media (min-width: 861px) {
          .${OVERLAY_CLASS} { display: none !important; }
        }
      `;
      document.head.appendChild(style);
    }

    return overlay;
  }

  function initSidebar() {
    const { sidebar, toggle, body } = getElements();
    if (!sidebar || !toggle) {
      setActiveMenu();
      return;
    }
    if (sidebar.dataset[READY_FLAG] === "true") return;
    sidebar.dataset[READY_FLAG] = "true";

    const overlay = ensureOverlay();
    const isMobile = () => window.innerWidth <= MOBILE_BREAKPOINT;
    let resizeFrame = 0;

    const getMobileOpen = () => sidebar.classList.contains("collapsed") || sidebar.classList.contains("mobile-open");

    const updateOverlay = open => {
      overlay.classList.toggle("is-visible", Boolean(open) && isMobile());
      overlay.setAttribute("aria-hidden", String(!(Boolean(open) && isMobile())));
    };

    const closeMobile = ({ restoreFocus = false } = {}) => {
      if (!isMobile()) return;
      sidebar.classList.remove("collapsed", "mobile-open");
      body?.classList.remove("sidebar-open");
      updateOverlay(false);
      setToggleA11y(toggle, false, sidebar);
      if (restoreFocus) toggle.focus({ preventScroll: true });
    };

    const applyLayout = () => {
      resizeFrame = 0;
      if (isMobile()) {
        // Trên mobile, Sidebar bắt đầu đóng; class collapsed/mobile-open được dùng
        // như trạng thái mở để tương thích cả hai bộ CSS hiện có.
        sidebar.classList.remove("collapsed", "mobile-open");
        body?.classList.remove("sidebar-open");
        updateOverlay(false);
        setToggleA11y(toggle, false, sidebar);
        return;
      }

      const collapsed = safeStorage.get(STORAGE_KEY) === "true";
      sidebar.classList.toggle("collapsed", collapsed);
      sidebar.classList.remove("mobile-open");
      body?.classList.remove("sidebar-open");
      updateOverlay(false);
      setToggleA11y(toggle, !collapsed, sidebar);
    };

    const scheduleLayout = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(applyLayout);
    };

    const openMobile = () => {
      if (!isMobile()) return;
      sidebar.classList.add("collapsed", "mobile-open");
      body?.classList.add("sidebar-open");
      updateOverlay(true);
      setToggleA11y(toggle, true, sidebar);
      const firstLink = sidebar.querySelector("a.menu-item, button:not([disabled])");
      window.setTimeout(() => firstLink?.focus({ preventScroll: true }), 180);
    };

    toggle.addEventListener("click", event => {
      event.preventDefault();
      if (isMobile()) {
        if (getMobileOpen()) closeMobile();
        else openMobile();
        return;
      }

      const collapsed = !sidebar.classList.contains("collapsed");
      sidebar.classList.toggle("collapsed", collapsed);
      safeStorage.set(STORAGE_KEY, String(collapsed));
      setToggleA11y(toggle, !collapsed, sidebar);
    });

    overlay.addEventListener("click", () => closeMobile({ restoreFocus: true }));

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && isMobile() && getMobileOpen()) {
        event.preventDefault();
        closeMobile({ restoreFocus: true });
      }
    });

    // Giữ focus trong Sidebar khi đang mở trên mobile để thao tác bằng bàn phím không bị mất ngữ cảnh.
    sidebar.addEventListener("keydown", event => {
      if (event.key !== "Tab" || !isMobile() || !getMobileOpen()) return;
      const focusable = Array.from(sidebar.querySelectorAll("a[href], button:not([disabled])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", scheduleLayout, { passive: true });
    window.addEventListener("orientationchange", scheduleLayout, { passive: true });

    document.querySelectorAll('.sidebar-menu a[href="#"], .nav-menu a[href="#"]').forEach(item => {
      item.addEventListener("click", event => event.preventDefault());
    });

    applyLayout();
    setActiveMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSidebar, { once: true });
  } else {
    initSidebar();
  }
})();
