/* =====================================================
   DASHBOARD.JS
   Xử lý hiển thị khung trống khi chưa có dữ liệu,
   và render số liệu thật khi có dữ liệu từ Firebase.
===================================================== */

(function () {

    /* -----------------------------------------------
       CẤU TRÚC DỮ LIỆU MONG ĐỢI (document Firestore)
       collection: dashboardStats
       doc: current
       {
         ticketsToday:     { value: number, sub: string },
         completedThisWeek:{ value: number, sub: string },
         inProgress:       { value: number, sub: string },
         completionRate:   { value: number, sub: string }, // 0-100
         weekComparison: {
           days:     ["T2","T3","T4","T5","T6","T7","CN"],
           thisWeek: [number x7],
           lastWeek: [number x7]
         }
       }
    ----------------------------------------------- */

    function el(id) {
        return document.getElementById(id);
    }

    /* -----------------------------------------------
       NGÀY HÔM NAY
    ----------------------------------------------- */

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

    /* -----------------------------------------------
       GÁN GIÁ TRỊ CHO 1 THẺ SỐ LIỆU
       value = null/undefined  ->  hiện khung trống "—"
    ----------------------------------------------- */

    function setStat(valueId, subId, value, sub, unit) {

        const valueEl = el(valueId);
        const subEl = el(subId);

        if (!valueEl) return;

        const hasData =
            value !== null &&
            value !== undefined &&
            value !== "";

        if (!hasData) {

            valueEl.innerHTML = `<span class="stat-empty">—</span>`;

            if (subEl) {
                subEl.textContent = "Chưa kết nối dữ liệu Firebase";
            }

            return;

        }

        valueEl.innerHTML =
            `<span>${value}</span>` +
            (unit ? `<span class="unit">${unit}</span>` : "");

        if (subEl) {
            subEl.textContent = sub || "";
        }

    }

    /* -----------------------------------------------
       THANH TIẾN ĐỘ (Tỷ lệ hoàn thành)
    ----------------------------------------------- */

    function setProgress(value) {

        const fill = el("completionFill");

        if (!fill) return;

        const hasData = value !== null && value !== undefined;

        fill.style.width = hasData ? `${value}%` : "0%";

    }

    /* -----------------------------------------------
       RESET BIỂU ĐỒ VỀ TRẠNG THÁI TRỐNG
    ----------------------------------------------- */

    function resetBarsEmpty() {

        document
            .querySelectorAll("#weekBarChart .bar")
            .forEach(bar => {

                bar.classList.remove("this-week", "last-week");
                bar.style.height = "4%";
                bar.removeAttribute("title");

            });

        const note = el("chartNote");

        if (note) {
            note.innerHTML =
                `Biểu đồ sẽ tự động cập nhật khi kết nối <strong>Firebase</strong>.`;
        }

    }

    /* -----------------------------------------------
       RENDER BIỂU ĐỒ SO SÁNH TUẦN
    ----------------------------------------------- */

    function renderBarChart(weekComparison) {

        if (
            !weekComparison ||
            !Array.isArray(weekComparison.thisWeek) ||
            !Array.isArray(weekComparison.lastWeek)
        ) {

            resetBarsEmpty();
            return;

        }

        const thisWeek = weekComparison.thisWeek;
        const lastWeek = weekComparison.lastWeek;

        const max = Math.max(...thisWeek, ...lastWeek, 1);

        thisWeek.forEach((v, i) => {

            const bar = el(`barThis${i}`);

            if (!bar) return;

            bar.classList.add("this-week");
            bar.classList.remove("last-week");
            bar.style.height = `${Math.max((v / max) * 100, 4)}%`;
            bar.title = `${v} ticket`;

        });

        lastWeek.forEach((v, i) => {

            const bar = el(`barLast${i}`);

            if (!bar) return;

            bar.classList.add("last-week");
            bar.classList.remove("this-week");
            bar.style.height = `${Math.max((v / max) * 100, 4)}%`;
            bar.title = `${v} ticket`;

        });

        const totalThis = thisWeek.reduce((a, b) => a + b, 0);
        const totalLast = lastWeek.reduce((a, b) => a + b, 0);
        const diff = totalThis - totalLast;

        const pct =
            totalLast === 0
                ? 0
                : Math.round((diff / totalLast) * 100);

        const sign = diff >= 0 ? "+" : "";
        const trend = diff >= 0 ? "tăng" : "giảm";

        const note = el("chartNote");

        if (note) {

            note.innerHTML =
                `Tổng tuần này: <strong>${totalThis} ticket</strong> · ` +
                `Tuần trước: <strong>${totalLast} ticket</strong> ` +
                `(${sign}${diff}, ${trend} ${Math.abs(pct)}%)`;

        }

    }

    /* -----------------------------------------------
       HIỆN TOÀN BỘ KHUNG Ở TRẠNG THÁI TRỐNG
    ----------------------------------------------- */

    function renderEmptyState() {

        setStat("valToday", "subToday", null);
        setStat("valCompleted", "subCompleted", null);
        setStat("valInProgress", "subInProgress", null);
        setStat("valCompletionRate", "subCompletionRate", null, null, "%");

        setProgress(null);
        resetBarsEmpty();

    }

    /* -----------------------------------------------
       RENDER TOÀN BỘ DASHBOARD TỪ DỮ LIỆU THẬT
    ----------------------------------------------- */

    function renderData(data) {

        if (!data) {
            renderEmptyState();
            return;
        }

        const today = data.ticketsToday || {};
        const completed = data.completedThisWeek || {};
        const inProgress = data.inProgress || {};
        const completionRate = data.completionRate || {};

        setStat("valToday", "subToday", today.value, today.sub);
        setStat("valCompleted", "subCompleted", completed.value, completed.sub);
        setStat("valInProgress", "subInProgress", inProgress.value, inProgress.sub);
        setStat(
            "valCompletionRate",
            "subCompletionRate",
            completionRate.value,
            completionRate.sub,
            "%"
        );

        setProgress(completionRate.value);

        renderBarChart(data.weekComparison);

    }

    /* -----------------------------------------------
       KHỞI TẠO: LẮNG NGHE FIRESTORE (NẾU CÓ)
       Nếu chưa cấu hình Firebase -> hiện khung trống.
    ----------------------------------------------- */

    function initDashboard() {

        renderToday();

        // Trang demo có thể tự cung cấp dữ liệu mẫu
        // qua window.DASHBOARD_DEMO_DATA, bỏ qua Firestore.
        if (window.DASHBOARD_DEMO_DATA) {
            renderData(window.DASHBOARD_DEMO_DATA);
            return;
        }

        if (typeof db === "undefined") {
            renderEmptyState();
            return;
        }

        db.collection("dashboardStats")
            .doc("current")
            .onSnapshot(

                doc => {

                    if (doc.exists) {
                        renderData(doc.data());
                    } else {
                        renderEmptyState();
                    }

                },

                error => {

                    console.error("Lỗi tải dữ liệu dashboard:", error);
                    renderEmptyState();

                }

            );

    }

    document.addEventListener("DOMContentLoaded", initDashboard);

    // Cho phép gọi thủ công từ bên ngoài nếu cần (vd. trang demo)
    window.DashboardUI = {
        renderEmptyState,
        renderData
    };

})();