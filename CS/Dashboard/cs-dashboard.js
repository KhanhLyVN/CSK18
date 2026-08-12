/* =====================================================
   CS-DASHBOARD.JS
   Dashboard đọc dữ liệu REAL-TIME từ Firestore
   collection: tickets
===================================================== */
(function () {
    let pieChartInstance = null;

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
        return Math.floor((d - monday) / (1000 * 60 * 60 * 24));
    }

    /* =====================================================
       GÁN GIÁ TRỊ STAT
    ===================================================== */
    function setStat(valueId, subId, value, sub, unit) {
        const valueEl = el(valueId);
        const subEl = el(subId);
        if (!valueEl) return;

        const hasData = value !== null && value !== undefined;
        if (!hasData) {
            valueEl.innerHTML = `<span class="stat-empty">—</span>`;
            if (subEl) {
                subEl.textContent = "Chưa có dữ liệu";
            }
            return;
        }

        valueEl.innerHTML = `<span>${value}</span>` + (unit ? `<span class="unit">${unit}</span>` : "");
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
        if (value === null || value === undefined) {
            fill.style.width = "0%";
            return;
        }
        const safeValue = Math.min(100, Math.max(0, Number(value)));
        fill.style.width = `${safeValue}%`;
    }

    /* =====================================================
       RENDER BIỂU ĐỒ TRÒN (PIE CHART - TYPE 1-5)
    ===================================================== */
    function normalizeCategoryKey(ticket) {
        const rawValue = ticket?.ticketCategory || ticket?.category || ticket?.type || ticket?.typeId || ticket?.ticketType;
        if (rawValue === undefined || rawValue === null || rawValue === "") return null;

        const normalized = String(rawValue).trim().toLowerCase();
        const categoryMap = {
            "system": "system",
            "he thong": "system",
            "hệ thống": "system",
            "learning": "learning",
            "khoa hoc": "learning",
            "khóa học": "learning",
            "account": "account",
            "tai khoan": "account",
            "tài khoản": "account",
            "other": "other",
            "khac": "other",
            "khác": "other"
        };

        if (categoryMap[normalized]) return categoryMap[normalized];

        const parts = normalized.split("-");
        if (parts.length > 0 && categoryMap[parts[0]]) return categoryMap[parts[0]];

        const numericValue = Number(rawValue);
        if (!Number.isNaN(numericValue)) {
            const legacyMap = { 1: "system", 2: "learning", 3: "account", 4: "other", 5: "other" };
            return legacyMap[numericValue] || null;
        }

        return null;
    }

    function renderPieChart(typeCounts) {
        const canvas = el("ticketTypeChart");
        const emptyNote = el("pieEmptyNote");
        if (!canvas) return;

        const categoryOrder = ["system", "learning", "account", "other"];
        const categoryLabels = {
            system: "Hệ thống",
            learning: "Khóa học",
            account: "Tài khoản",
            other: "Khác"
        };

        const totalTypes = categoryOrder.reduce((sum, key) => sum + (typeCounts[key] || 0), 0);

        if (totalTypes === 0) {
            if (pieChartInstance) {
                pieChartInstance.destroy();
                pieChartInstance = null;
            }
            canvas.style.display = "none";
            if (emptyNote) emptyNote.style.display = "block";
            return;
        }

        canvas.style.display = "block";
        if (emptyNote) emptyNote.style.display = "none";

        const labels = categoryOrder.map((key) => categoryLabels[key]);
        const data = categoryOrder.map((key) => typeCounts[key] || 0);

        if (pieChartInstance) {
            pieChartInstance.data.labels = labels;
            pieChartInstance.data.datasets[0].data = data;
            pieChartInstance.update();
        } else {
            const ctx = canvas.getContext("2d");
            pieChartInstance = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            "#5D0703",
                            "#B08A4E",
                            "#7A1410",
                            "#4C6B3C"
                        ],
                        borderWidth: 2,
                        borderColor: "#FFFBF5"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "right",
                            labels: {
                                font: { family: "Inter", size: 12 },
                                color: "#2A1712"
                            }
                        }
                    }
                }
            });
        }
    }

    /* =====================================================
       RESET BIỂU ĐỒ CỘT
    ===================================================== */
    function resetBarsEmpty() {
        document.querySelectorAll("#weekBarChart .bar").forEach(bar => {
            bar.classList.remove("this-week", "last-week");
            bar.style.height = "4%";
            bar.removeAttribute("title");
        });
        const note = el("chartNote");
        if (note) {
            note.innerHTML = `Biểu đồ sẽ tự động cập nhật khi có <strong>ticket</strong>.`;
        }
    }

    /* =====================================================
       RENDER BIỂU ĐỒ CỘT
    ===================================================== */
    function renderBarChart(thisWeek, lastWeek) {
        const max = Math.max(...thisWeek, ...lastWeek, 1);

        thisWeek.forEach((value, index) => {
            const bar = el(`barThis${index}`);
            if (!bar) return;
            bar.classList.add("this-week");
            bar.classList.remove("last-week");
            bar.style.height = `${Math.max((value / max) * 100, 4)}%`;
            bar.title = `${value} ticket`;
        });

        lastWeek.forEach((value, index) => {
            const bar = el(`barLast${index}`);
            if (!bar) return;
            bar.classList.add("last-week");
            bar.classList.remove("this-week");
            bar.style.height = `${Math.max((value / max) * 100, 4)}%`;
            bar.title = `${value} ticket`;
        });

        const totalThis = thisWeek.reduce((sum, value) => sum + value, 0);
        const totalLast = lastWeek.reduce((sum, value) => sum + value, 0);
        const diff = totalThis - totalLast;
        const pct = totalLast === 0 ? 0 : Math.round((diff / totalLast) * 100);
        const sign = diff >= 0 ? "+" : "";
        const trend = diff >= 0 ? "tăng" : "giảm";
        const note = el("chartNote");

        if (note) {
            note.innerHTML = `Tổng tuần này: <strong>${totalThis} ticket</strong> · Tuần trước: <strong>${totalLast} ticket</strong> (${sign}${diff}, ${trend} ${Math.abs(pct)}%)`;
        }
    }

    /* =====================================================
       RESET DASHBOARD RỖNG
    ===================================================== */
    function renderEmptyState() {
        setStat("valToday", "subToday", null);
        setStat("valCompleted", "subCompleted", null);
        setStat("valInProgress", "subInProgress", null);
        setStat("valCompletionRate", "subCompletionRate", null, null, "%");
        setStat("valAvgTime", "subAvgTime", null);
        setStat("valSatisfaction", "subSatisfaction", null);

        setProgress(null);
        resetBarsEmpty();
        renderPieChart({ system: 0, learning: 0, account: 0, other: 0 });
    }

    /* =====================================================
       TÍNH DASHBOARD TỪ TICKETS
    ===================================================== */
    function calculateDashboard(tickets) {
        const now = new Date();
        const today = getDateKey(now);
        const mondayThis = getMonday(now);
        const mondayLast = new Date(mondayThis);
        mondayLast.setDate(mondayLast.getDate() - 7);

        const thisWeek = [0, 0, 0, 0, 0, 0, 0];
        const lastWeek = [0, 0, 0, 0, 0, 0, 0];

        let ticketsToday = 0;
        let completedThisWeek = 0;
        let inProgress = 0;
        let totalThisWeek = 0;

        // Biểu đồ tròn
        const typeCounts = { system: 0, learning: 0, account: 0, other: 0 };

        // Thời gian trung bình
        let totalTimeMinutes = 0;
        let resolvedCount = 0;

        // Mức độ hài lòng
        let totalRating = 0;
        let ratingCount = 0;

        tickets.forEach(ticket => {
            if (!ticket) return;

            // 1. LẤY NGÀY TẠO
            let createdAt = ticket.createdAt;
            if (!createdAt) return;
            createdAt = typeof createdAt.toDate === "function" ? createdAt.toDate() : new Date(createdAt);
            if (isNaN(createdAt.getTime())) return;

            // 2. PHÂN LOẠI TICKET (hệ thống / khóa học / tài khoản / khác)
            const categoryKey = normalizeCategoryKey(ticket);
            if (categoryKey && typeCounts[categoryKey] !== undefined) {
                typeCounts[categoryKey]++;
            }

            // 3. ĐÁNH GIÁ HÀI LÒNG (1-5)
            const rating = Number(ticket.rating || ticket.satisfaction);
            if (rating >= 1 && rating <= 5) {
                totalRating += rating;
                ratingCount++;
            }

            // 4. THỜI GIAN XỬ LÝ (Khi ticket đã xong)
            let resolvedAt = ticket.resolvedAt || ticket.completedAt;
            if (resolvedAt) {
                resolvedAt = typeof resolvedAt.toDate === "function" ? resolvedAt.toDate() : new Date(resolvedAt);
                if (!isNaN(resolvedAt.getTime()) && resolvedAt >= createdAt) {
                    const diffMs = resolvedAt - createdAt;
                    totalTimeMinutes += Math.floor(diffMs / (1000 * 60));
                    resolvedCount++;
                }
            }

            // 5. STATS THEO THỜI GIAN
            if (getDateKey(createdAt) === today) {
                ticketsToday++;
            }

            const dayThis = getWeekDay(createdAt, mondayThis);
            if (dayThis >= 0 && dayThis < 7) {
                thisWeek[dayThis]++;
                totalThisWeek++;
            }

            const dayLast = getWeekDay(createdAt, mondayLast);
            if (dayLast >= 0 && dayLast < 7) {
                lastWeek[dayLast]++;
            }

            // STATUS
            const status = String(ticket.status || "").toLowerCase();
            if (status === "in_progress" || status === "processing" || status === "pending") {
                inProgress++;
            }
            if (status === "completed" || status === "closed" || status === "resolved") {
                if (createdAt >= mondayThis) {
                    completedThisWeek++;
                }
            }
        });

        // Tỷ lệ hoàn thành
        const completionRate = totalThisWeek === 0 ? 0 : Math.round((completedThisWeek / totalThisWeek) * 100);

        // Hiển thị 4 thẻ chính
        setStat("valToday", "subToday", ticketsToday, ticketsToday === 0 ? "Không có ticket mới hôm nay" : `${ticketsToday} ticket được tạo hôm nay`);
        setStat("valCompleted", "subCompleted", completedThisWeek, completedThisWeek === 0 ? "Chưa có ticket hoàn thành" : `${completedThisWeek} ticket đã hoàn thành`);
        setStat("valInProgress", "subInProgress", inProgress, inProgress === 0 ? "Không có ticket đang xử lý" : `${inProgress} ticket đang xử lý`);
        setStat("valCompletionRate", "subCompletionRate", completionRate, `${completedThisWeek}/${totalThisWeek} ticket`, "%");
        setProgress(completionRate);

        // Hiển thị Thời gian trung bình
        if (resolvedCount > 0) {
            const avgMinutes = Math.round(totalTimeMinutes / resolvedCount);
            let displayTime = "";
            if (avgMinutes < 60) {
                displayTime = `${avgMinutes}m`;
            } else {
                const hours = Math.floor(avgMinutes / 60);
                const mins = avgMinutes % 60;
                displayTime = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
            }
            setStat("valAvgTime", "subAvgTime", displayTime, `Tính trên ${resolvedCount} ticket hoàn thành`);
        } else {
            setStat("valAvgTime", "subAvgTime", null);
        }

        // Hiển thị Mức độ hài lòng (1-5)
        if (ratingCount > 0) {
            const avgRating = (totalRating / ratingCount).toFixed(1);
            setStat("valSatisfaction", "subSatisfaction", `${avgRating}/5`, `Dựa trên ${ratingCount} lượt đánh giá`);
        } else {
            setStat("valSatisfaction", "subSatisfaction", null);
        }

        // Cập nhật biểu đồ
        renderPieChart(typeCounts);
        renderBarChart(thisWeek, lastWeek);
    }

    /* =====================================================
       ĐỌC FIRESTORE REAL-TIME
    ===================================================== */
    function initDashboard() {
        renderToday();

        if (typeof db === "undefined") {
            console.error("Firebase db chưa được khởi tạo.");
            renderEmptyState();
            return;
        }

        db.collection("tickets").onSnapshot(
            snapshot => {
                const tickets = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                if (tickets.length === 0) {
                    renderEmptyState();
                    return;
                }
                calculateDashboard(tickets);
            },
            error => {
                console.error("Lỗi đọc tickets:", error);
                renderEmptyState();
            }
        );
    }

    document.addEventListener("DOMContentLoaded", initDashboard);

    window.DashboardUI = {
        renderEmptyState,
        calculateDashboard
    };
})();