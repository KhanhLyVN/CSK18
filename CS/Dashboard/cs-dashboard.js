/* =====================================================
   CS-DASHBOARD.JS
   Dashboard đọc dữ liệu REAL-TIME từ Firestore
   collection: tickets
===================================================== */
(function () {
    /* =====================================================
       HELPER
    ===================================================== */
    function el(id) {
        return document.getElementById(id);
    }
    /* =====================================================
       NGÀY HÔM NAY
    ===================================================== */
    function renderToday() {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, "0");
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yyyy = now.getFullYear();
        const target = el("todayStr");
        if (target) {
            target.textContent = `${dd}/${mm}/${yyyy}`;
        }
    }
    /* =====================================================
       FORMAT NGÀY
    ===================================================== */
    function getDateKey(date) {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }
    /* =====================================================
       CHECK NGÀY
    ===================================================== */
    function isSameDay(date1, date2) {
        return getDateKey(date1) === getDateKey(date2);
    }
    /* =====================================================
       LẤY THỨ 2 ĐẦU TUẦN
    ===================================================== */
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    /* =====================================================
       LẤY NGÀY TRONG TUẦN
    ===================================================== */
    function getWeekDay(date, monday) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const diff =
            Math.floor(
                (d - monday) / (1000 * 60 * 60 * 24)
            );
        return diff;
    }
    /* =====================================================
       GÁN GIÁ TRỊ STAT
    ===================================================== */
    function setStat(
        valueId,
        subId,
        value,
        sub,
        unit
    ) {
        const valueEl = el(valueId);
        const subEl = el(subId);
        if (!valueEl) return;
        const hasData =
            value !== null &&
            value !== undefined;
        if (!hasData) {
            valueEl.innerHTML =
                `<span class="stat-empty">—</span>`;
            if (subEl) {
                subEl.textContent =
                    "Chưa có dữ liệu";
            }
            return;
        }
        valueEl.innerHTML =
            `<span>${value}</span>` +
            (unit
                ? `<span class="unit">${unit}</span>`
                : "");
        if (subEl) {
            subEl.textContent = sub || "";
        }
    }
    /* =====================================================
       THANH TIẾN ĐỘ
    ===================================================== */
    function setProgress(value) {
        const fill = el("completionFill");
        if (!fill) return;
        if (
            value === null ||
            value === undefined
        ) {
            fill.style.width = "0%";
            return;
        }
        const safeValue =
            Math.min(
                100,
                Math.max(0, Number(value))
            );
        fill.style.width =
            `${safeValue}%`;
    }
    /* =====================================================
       RESET BIỂU ĐỒ
    ===================================================== */
    function resetBarsEmpty() {
        document
            .querySelectorAll("#weekBarChart .bar")
            .forEach(bar => {
                bar.classList.remove(
                    "this-week",
                    "last-week"
                );
                bar.style.height = "4%";
                bar.removeAttribute("title");
            });
        const note = el("chartNote");
        if (note) {
            note.innerHTML =
                `Biểu đồ sẽ tự động cập nhật khi có ` +
                `<strong>ticket</strong>.`;
        }
    }
    /* =====================================================
       RENDER BIỂU ĐỒ
    ===================================================== */
    function renderBarChart(
        thisWeek,
        lastWeek
    ) {
        const max =
            Math.max(
                ...thisWeek,
                ...lastWeek,
                1
            );
        /* ---------- TUẦN NÀY ---------- */
        thisWeek.forEach((value, index) => {
            const bar =
                el(`barThis${index}`);
            if (!bar) return;
            bar.classList.add("this-week");
            bar.classList.remove("last-week");
            bar.style.height =
                `${Math.max(
                    (value / max) * 100,
                    4
                )}%`;
            bar.title =
                `${value} ticket`;
        });
        /* ---------- TUẦN TRƯỚC ---------- */
        lastWeek.forEach((value, index) => {
            const bar =
                el(`barLast${index}`);
            if (!bar) return;
            bar.classList.add("last-week");
            bar.classList.remove("this-week");
            bar.style.height =
                `${Math.max(
                    (value / max) * 100,
                    4
                )}%`;
            bar.title =
                `${value} ticket`;
        });
        /* ---------- TỔNG ---------- */
        const totalThis =
            thisWeek.reduce(
                (sum, value) =>
                    sum + value,
                0
            );
        const totalLast =
            lastWeek.reduce(
                (sum, value) =>
                    sum + value,
                0
            );
        const diff =
            totalThis - totalLast;
        const pct =
            totalLast === 0
                ? 0
                : Math.round(
                    (diff / totalLast) * 100
                );
        const sign =
            diff >= 0 ? "+" : "";
        const trend =
            diff >= 0
                ? "tăng"
                : "giảm";
        const note =
            el("chartNote");
        if (note) {
            note.innerHTML =
                `Tổng tuần này: ` +
                `<strong>${totalThis} ticket</strong> · ` +
                `Tuần trước: ` +
                `<strong>${totalLast} ticket</strong> ` +
                `(${sign}${diff}, ${trend} ` +
                `${Math.abs(pct)}%)`;
        }
    }
    /* =====================================================
       RESET DASHBOARD
    ===================================================== */
    function renderEmptyState() {
        setStat(
            "valToday",
            "subToday",
            null
        );
        setStat(
            "valCompleted",
            "subCompleted",
            null
        );
        setStat(
            "valInProgress",
            "subInProgress",
            null
        );
        setStat(
            "valCompletionRate",
            "subCompletionRate",
            null,
            null,
            "%"
        );
        setProgress(null);
        resetBarsEmpty();
    }
    /* =====================================================
       TÍNH DASHBOARD TỪ TICKETS
    ===================================================== */
    function calculateDashboard(
        tickets
    ) {
        const now = new Date();
        const today =
            getDateKey(now);
        /* =================================================
           TUẦN NÀY
        ================================================= */
        const mondayThis =
            getMonday(now);
        /* =================================================
           TUẦN TRƯỚC
        ================================================= */
        const mondayLast =
            new Date(mondayThis);
        mondayLast.setDate(
            mondayLast.getDate() - 7
        );
        /* =================================================
           MẢNG BIỂU ĐỒ
        ================================================= */
        const thisWeek =
            [0, 0, 0, 0, 0, 0, 0];
        const lastWeek =
            [0, 0, 0, 0, 0, 0, 0];
        let ticketsToday = 0;
        let completedThisWeek = 0;
        let inProgress = 0;
        let totalThisWeek = 0;
        /* =================================================
           DUYỆT TICKET
        ================================================= */
        tickets.forEach(ticket => {
            if (!ticket) return;
            /* ---------------------------------------------
               LẤY NGÀY TẠO
            --------------------------------------------- */
            let createdAt =
                ticket.createdAt;
            if (!createdAt) return;
            /*
             * Firebase Timestamp
             */
            if (
                createdAt &&
                typeof createdAt.toDate === "function"
            ) {
                createdAt =
                    createdAt.toDate();
            }
            else {
                createdAt =
                    new Date(createdAt);
            }
            if (
                isNaN(
                    createdAt.getTime()
                )
            ) {
                return;
            }
            /* =================================================
               TICKET HÔM NAY
            ================================================= */
            if (
                getDateKey(createdAt) === today
            ) {
                ticketsToday++;
            }
            /* =================================================
               TICKET TUẦN NÀY
            ================================================= */
            const dayThis =
                getWeekDay(
                    createdAt,
                    mondayThis
                );
            if (
                dayThis >= 0 &&
                dayThis < 7
            ) {
                thisWeek[dayThis]++;
                totalThisWeek++;
            }
            /* =================================================
               TICKET TUẦN TRƯỚC
            ================================================= */
            const dayLast =
                getWeekDay(
                    createdAt,
                    mondayLast
                );
            if (
                dayLast >= 0 &&
                dayLast < 7
            ) {
                lastWeek[dayLast]++;
            }
            /* =================================================
               STATUS
            ================================================= */
            const status =
                String(
                    ticket.status || ""
                ).toLowerCase();
            /*
             * Ticket đang xử lý
             */
            if (
                status === "in_progress" ||
                status === "processing" ||
                status === "pending"
            ) {
                inProgress++;
            }
            /*
             * Ticket hoàn thành trong tuần
             *
             * Hiện tại ticketData của bé
             * lưu status = "open".
             *
             * Nếu CS đổi thành "completed"
             * thì ticket sẽ được tính.
             */
            if (
                status === "completed" ||
                status === "closed" ||
                status === "resolved"
            ) {
                if (
                    createdAt >= mondayThis
                ) {
                    completedThisWeek++;
                }
            }
        });
        /* =================================================
           TỶ LỆ HOÀN THÀNH
        =====================================================
           Công thức:
           completed / tổng ticket tuần này × 100
        */
        const completionRate =
            totalThisWeek === 0
                ? 0
                : Math.round(
                    (
                        completedThisWeek /
                        totalThisWeek
                    ) * 100
                );
        /* =================================================
           HIỂN THỊ 4 CARD
        ================================================= */
        setStat(
            "valToday",
            "subToday",
            ticketsToday,
            ticketsToday === 0
                ? "Không có ticket mới hôm nay"
                : `${ticketsToday} ticket được tạo hôm nay`
        );
        setStat(
            "valCompleted",
            "subCompleted",
            completedThisWeek,
            completedThisWeek === 0
                ? "Chưa có ticket hoàn thành"
                : `${completedThisWeek} ticket đã hoàn thành`
        );
        setStat(
            "valInProgress",
            "subInProgress",
            inProgress,
            inProgress === 0
                ? "Không có ticket đang xử lý"
                : `${inProgress} ticket đang xử lý`
        );
        setStat(
            "valCompletionRate",
            "subCompletionRate",
            completionRate,
            `${completedThisWeek}/${totalThisWeek} ticket`,
            "%"
        );
        setProgress(
            completionRate
        );
        /* =================================================
           BIỂU ĐỒ
        ================================================= */
        renderBarChart(
            thisWeek,
            lastWeek
        );
    }
    /* =====================================================
       ĐỌC FIRESTORE REAL-TIME
    ===================================================== */
    function initDashboard() {
        renderToday();
        /*
         * Kiểm tra Firebase DB
         */
        if (
            typeof db === "undefined"
        ) {
            console.error(
                "Firebase db chưa được khởi tạo."
            );
            renderEmptyState();
            return;
        }
        console.log(
            "Dashboard đang kết nối Firestore..."
        );
        /*
         * Lắng nghe collection tickets
         *
         * Khi học viên tạo ticket mới:
         *
         * tickets
         *    ↓
         * onSnapshot
         *    ↓
         * Dashboard tự cập nhật
         */
        db.collection("tickets")
            .onSnapshot(
                snapshot => {
                    const tickets =
                        snapshot.docs.map(
                            doc => ({
                                id: doc.id,
                                ...doc.data()
                            })
                        );
                    console.log(
                        "Dashboard nhận được:",
                        tickets.length,
                        "tickets"
                    );
                    if (
                        tickets.length === 0
                    ) {
                        renderEmptyState();
                        return;
                    }
                    calculateDashboard(
                        tickets
                    );
                },
                error => {
                    console.error(
                        "Lỗi đọc tickets:",
                        error
                    );
                    renderEmptyState();
                }
            );
    }
    /* =====================================================
       START
    ===================================================== */
    document.addEventListener(
        "DOMContentLoaded",
        initDashboard
    );
    /* =====================================================
       PUBLIC API
    ===================================================== */
    window.DashboardUI = {
        renderEmptyState,
        calculateDashboard
    };
})();