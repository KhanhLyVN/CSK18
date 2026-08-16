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
            ></div>
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
    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initNavbar
        );
    } else {
        initNavbar();
    }
})();