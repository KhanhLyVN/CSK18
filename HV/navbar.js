/* =========================================================
   HỌC VIÊN - SHARED NAVBAR
   File dùng chung cho toàn bộ trang HV
   ========================================================= */
   (function () {
    "use strict";
    /* =====================================================
       CẤU HÌNH
       ===================================================== */
    const COLLAPSE_KEY =
        "student-navbar-collapsed";
    const MOBILE_BREAKPOINT =
        860;
    /* =====================================================
       ICON
       ===================================================== */
    const icons = {
        home: `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <path d="M9 22V12h6v10"></path>
            </svg>
        `,
        create: `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            </svg>
        `,
        sent: `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M22 12h-6l-2 3h-4l-2-3H2"></path>
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"></path>
            </svg>
        `,
        chat: `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"></path>
            </svg>
        `,
        faq: `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                ></circle>
                <path
                    d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"
                ></path>
                <path
                    d="M12 17h.01"
                ></path>
            </svg>
        `,
        account: `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    d="M20 21a8 8 0 0 0-16 0"
                ></path>
                <circle
                    cx="12"
                    cy="7"
                    r="4"
                ></circle>
            </svg>
        `
    };
    /* =====================================================
       TIỆN ÍCH
       ===================================================== */
    function safeGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }
    function safeSet(key, value) {
        try {
            localStorage.setItem(
                key,
                value
            );
        } catch (error) {
            // Không làm crash navbar
        }
    }
    function isMobile() {
        return (
            window.innerWidth <=
            MOBILE_BREAKPOINT
        );
    }
    /* =====================================================
       TÌM CONTENT CỦA TRANG
       ===================================================== */
    function findContent(app) {
        const selectors = [
            ":scope > .exchange-shell",
            ":scope > main",
            ":scope > .main",
            ":scope > .sent-tickets-page",
                        ":scope > .homepage",
            ":scope > .faq-page-content",
            ":scope > [data-page-content]"

        ];
        for (
            const selector
            of selectors
        ) {
            const element =
                app.querySelector(
                    selector
                );
            if (element) {
                return element;
            }
        }
        return null;
    }
    /* =====================================================
       ICON NAVBAR
       ===================================================== */
    function applyIcons(sidebar) {
        const links =
            sidebar.querySelectorAll(
                "[data-nav-page]"
            );
        links.forEach(link => {
            const key =
                link.dataset.navPage;
            const label =
                link.textContent.trim();
            link.innerHTML = `
                ${icons[key] || ""}
                <span>
                    ${label}
                </span>
            `;
        });
    }
    /* =====================================================
       XÁC ĐỊNH TRANG ĐANG ĐỨNG
       ===================================================== */
    function setActive(sidebar) {
        const currentPage =
            document.body.dataset.navPage ||
            "";
        const links =
            sidebar.querySelectorAll(
                "[data-nav-page]"
            );
        links.forEach(link => {
            const isActive =
                link.dataset.navPage ===
                currentPage;
            link.classList.toggle(
                "active",
                isActive
            );
            if (isActive) {
                link.setAttribute(
                    "aria-current",
                    "page"
                );
            } else {
                link.removeAttribute(
                    "aria-current"
                );
            }
        });
    }
    /* =====================================================
       NAVIGATION
       ===================================================== */
    function createTopbar() {
        const topbar =
            document.createElement(
                "header"
            );
        topbar.className =
            "student-navbar-topbar";
        topbar.innerHTML = `
            <button
                class="student-navbar-toggle"
                type="button"
                aria-label="Mở điều hướng"
                aria-expanded="false"
                aria-controls="studentNavbarSidebar"
            >
                ☰
            </button>
            <a
                class="student-navbar-brand"
                href="/HV/homepage-hv/homepage.html"
                aria-label="Trang chủ Hệ thống Hỗ trợ Học viên"
            >
                <span
                    class="student-navbar-mark"
                >
                    HV
                </span>
                <span
                    class="student-navbar-brand-copy"
                >
                    <strong>
                        Hệ thống Hỗ trợ Học viên
                    </strong>
                    <small>
                        Trung tâm Customer Success
                    </small>
                </span>
            </a>
                        <div
                class="student-navbar-actions"
                data-navbar-actions
            >
                <button class="student-navbar-notification-button" id="notificationButton" type="button" aria-label="Mở thông báo" aria-expanded="false">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>
                    <span class="student-navbar-notification-count" id="notificationCount" hidden>0</span>
                </button>
            </div>

        `;
        return topbar;
    }
    function createSidebar() {
        const sidebar =
            document.createElement(
                "aside"
            );
        sidebar.className =
            "student-navbar-sidebar";
        sidebar.id =
            "studentNavbarSidebar";
        sidebar.setAttribute(
            "aria-label",
            "Điều hướng học viên"
        );
        sidebar.innerHTML = `
            <nav
                class="student-navbar-menu"
            >
                <a
                    data-nav-page="home"
                    href="/HV/homepage-hv/homepage.html"
                >
                    Trang chủ
                </a>
                <a
                    data-nav-page="create"
                    href="/HV/tickets/phieuhotro.html"
                >
                    Tạo phiếu hỗ trợ
                </a>
                <a
                    data-nav-page="sent"
                    href="/HV/ticketssent/ticketssent.html"
                >
                    Ticket đã gửi
                </a>
                <a
                    data-nav-page="chat"
                    href="/HV/chat-hv/trao-doi-ticket.html"
                >
                    Trao đổi ticket
                </a>
                <a
                    data-nav-page="faq"
                    href="/FAQs/faq.html"
                >
                    Hỏi đáp
                </a>
                <a
                    data-nav-page="account"
                    href="/HV/account-HV.html"
                >
                    Tài khoản
                </a>
            </nav>
            <div
                class="student-navbar-note"
            >
                <i></i>
                <span>
                    Hỗ trợ trực tuyến
                </span>
            </div>
        `;
        return sidebar;
    }
    /* =====================================================
       OVERLAY MOBILE
       ===================================================== */
    function createOverlay() {
        const overlay =
            document.createElement(
                "button"
            );
        overlay.type =
            "button";
        overlay.className =
            "student-navbar-overlay";
        overlay.setAttribute(
            "aria-label",
            "Đóng điều hướng"
        );
        return overlay;
    }
        function ensureNotificationPanel() {
        let panel = document.getElementById("notificationPanel");
        if (!panel) {
            panel = document.createElement("aside");
            panel.className = "student-notification-panel";
            panel.id = "notificationPanel";
            panel.setAttribute("aria-hidden", "true");
            panel.innerHTML = `
                <div class="student-notification-head"><div><span class="student-notification-kicker">CẬP NHẬT MỚI</span><h2>Thông báo</h2><p>Các thay đổi mới từ Customer Success.</p></div><button class="student-notification-close" id="notificationClose" type="button" aria-label="Đóng thông báo">×</button></div>
                <div class="student-notification-toolbar"><span id="notificationUnreadLabel">Chưa có thông báo</span></div>
                <div class="student-notification-list" id="notificationList"></div>
                <div class="student-notification-empty" id="notificationEmpty">Khi CS cập nhật ticket, thông báo sẽ xuất hiện tại đây.</div>
            `;
            document.body.appendChild(panel);
        }
        let backdrop = document.getElementById("notificationBackdrop");
        if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.className = "student-notification-backdrop";
            backdrop.id = "notificationBackdrop";
            backdrop.hidden = true;
            document.body.appendChild(backdrop);
        }
        return { panel, backdrop };
    }

    function bindNotifications() {
        if (window.__studentNotificationManager) return;
        window.__studentNotificationManager = true;
        const button = document.getElementById("notificationButton");
        const { panel, backdrop } = ensureNotificationPanel();
        const count = document.getElementById("notificationCount");
        const list = document.getElementById("notificationList");
        const empty = document.getElementById("notificationEmpty");
        const unreadLabel = document.getElementById("notificationUnreadLabel");
        const close = document.getElementById("notificationClose");
        let records = [];

        const millis = value => {
            if (!value) return 0;
            if (typeof value.toMillis === "function") return value.toMillis();
            if (typeof value.toDate === "function") return value.toDate().getTime();
            return new Date(value).getTime() || 0;
        };
        const esc = value => { const node = document.createElement("div"); node.textContent = value == null ? "" : String(value); return node.innerHTML; };
        const render = () => {
            const total = records.length;
            if (count) { count.hidden = total === 0; count.textContent = total > 99 ? "99+" : String(total); }
            if (unreadLabel) unreadLabel.textContent = total ? `${total} thông báo mới nhất` : "Chưa có thông báo";
            if (empty) empty.classList.toggle("show", total === 0);
            if (list) list.innerHTML = records.map(item => `<a class="student-notification-item" href="/HV/chat-hv/trao-doi-ticket.html?ticket=${encodeURIComponent(item.ticketId)}"><div class="student-notification-item-head"><strong>${esc(item.ticketNum || "Ticket")}</strong><span>${esc(item.time || "")}</span></div><b>${esc(item.title || "Ticket hỗ trợ")}</b><p>${esc(item.preview || "Customer Success đã cập nhật ticket.")}</p></a>`).join("");
        };
        const closePanel = () => { panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true"); button?.setAttribute("aria-expanded", "false"); backdrop.classList.remove("show"); window.setTimeout(() => { backdrop.hidden = true; }, 180); };
        const openPanel = () => { panel.classList.add("open"); panel.setAttribute("aria-hidden", "false"); button?.setAttribute("aria-expanded", "true"); backdrop.hidden = false; requestAnimationFrame(() => backdrop.classList.add("show")); };
        button?.addEventListener("click", () => panel.classList.contains("open") ? closePanel() : openPanel());
        close?.addEventListener("click", closePanel);
        backdrop.addEventListener("click", closePanel);
        document.addEventListener("keydown", event => { if (event.key === "Escape") closePanel(); });
        const authInstance = window.auth || (typeof auth !== "undefined" ? auth : null);
        const database = window.db || (typeof db !== "undefined" ? db : null);
        if (authInstance && database) {
            authInstance.onAuthStateChanged(user => {
                if (!user) { records = []; render(); return; }
                database.collection("tickets").where("studentId", "==", user.uid).onSnapshot(snapshot => {
                    records = snapshot.docs.flatMap(doc => { const ticket = { id: doc.id, ...doc.data() }; return (Array.isArray(ticket.notificationHistory) ? ticket.notificationHistory : []).map(item => ({ ...item, ticketId: item.ticketId || ticket.id, ticketNum: item.ticketNum || ticket.ticketNum || ticket.ticket_num || ticket.id, title: item.title || ticket.title || "Ticket hỗ trợ", time: new Date(millis(item.createdAt || item.updatedAt)).toLocaleString("vi-VN") })); }).sort((a, b) => millis(b.createdAt) - millis(a.createdAt)).slice(0, 50);
                    render();
                }, error => console.warn("[Student Notifications] Không thể tải thông báo", error));
            });
        }
        render();
    }

    /* =====================================================
              KHỞI TẠO NAVBAR
       ===================================================== */

    function initNavbar() {

        const app =
            document.querySelector(
                ".app"
            );
        if (!app) {
            console.warn(
                "[HV Navbar] Không tìm thấy .app"
            );
            return;
        }
        if (
            app.dataset.studentNavbarReady ===
            "true"
        ) {
            return;
        }
        const content =
            findContent(app);
        if (!content) {
            console.warn(
                "[HV Navbar] Không tìm thấy content của trang"
            );
            return;
        }
        app.dataset.studentNavbarReady =
            "true";
        /* -------------------------------------------------
           TẠO COMPONENT
           ------------------------------------------------- */
                const topbar =
            createTopbar();

        const layout =
            document.createElement(
                "div"
            );
        layout.className =
            "student-navbar-layout";
        const sidebar =
            createSidebar();
        const overlay =
            createOverlay();
        /* -------------------------------------------------
           GẮN CLASS CONTENT
           ------------------------------------------------- */
        content.classList.add(
            "student-navbar-content"
        );
        /* -------------------------------------------------
           GẮN VÀO DOM
           ------------------------------------------------- */
        app.insertBefore(
            topbar,
            content
        );
        app.insertBefore(
            layout,
            content
        );
        layout.append(
            sidebar,
            content
        );
        document.body.appendChild(
            overlay
        );
        /* -------------------------------------------------
           ICON + ACTIVE
           ------------------------------------------------- */
                applyIcons(
            sidebar
        );
        bindNotifications();

        setActive(
            sidebar
        );
        /* -------------------------------------------------
           MOBILE / DESKTOP
           ------------------------------------------------- */
        const toggle =
            topbar.querySelector(
                ".student-navbar-toggle"
            );
        function closeMobile() {
            layout.classList.remove(
                "is-mobile-open"
            );
            overlay.classList.remove(
                "is-visible"
            );
            toggle.setAttribute(
                "aria-expanded",
                "false"
            );
        }
        function syncLayout() {
            if (isMobile()) {
                layout.classList.remove(
                    "is-collapsed"
                );
                closeMobile();
            } else {
                layout.classList.toggle(
                    "is-collapsed",
                    safeGet(
                        COLLAPSE_KEY
                    ) === "true"
                );
                toggle.setAttribute(
                    "aria-expanded",
                    String(
                        !layout.classList.contains(
                            "is-collapsed"
                        )
                    )
                );
            }
        }
        /* -------------------------------------------------
           TOGGLE
           ------------------------------------------------- */
        toggle.addEventListener(
            "click",
            function () {
                if (isMobile()) {
                    const opening =
                        !layout.classList.contains(
                            "is-mobile-open"
                        );
                    layout.classList.toggle(
                        "is-mobile-open",
                        opening
                    );
                    overlay.classList.toggle(
                        "is-visible",
                        opening
                    );
                    toggle.setAttribute(
                        "aria-expanded",
                        String(opening)
                    );
                    return;
                }
                const collapsed =
                    !layout.classList.contains(
                        "is-collapsed"
                    );
                layout.classList.toggle(
                    "is-collapsed",
                    collapsed
                );
                safeSet(
                    COLLAPSE_KEY,
                    String(collapsed)
                );
                toggle.setAttribute(
                    "aria-expanded",
                    String(!collapsed)
                );
            }
        );
        /* -------------------------------------------------
           MOBILE OVERLAY
           ------------------------------------------------- */
        overlay.addEventListener(
            "click",
            closeMobile
        );
        /* -------------------------------------------------
           ESC
           ------------------------------------------------- */
        document.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key ===
                    "Escape"
                ) {
                    closeMobile();
                }
            }
        );
        /* -------------------------------------------------
           RESIZE
           ------------------------------------------------- */
        window.addEventListener(
            "resize",
            syncLayout,
            {
                passive: true
            }
        );
        /* -------------------------------------------------
           INITIAL
           ------------------------------------------------- */
        syncLayout();
    }
    /* =====================================================
       CHẠY SAU KHI DOM READY
       ===================================================== */
        initNavbar();

})();