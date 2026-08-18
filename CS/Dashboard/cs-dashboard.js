/* =====================================================
   CS-DASHBOARD.JS
   Dashboard đọc dữ liệu REAL-TIME từ Firestore
   collection: tickets
===================================================== */
(function () {
  let pieChartInstance = null;
  let satisfactionChartInstance = null;
  let dashboardState = {
    date: "",
    totalTickets: 0,
    ticketsToday: 0,
    completedThisWeek: 0,
    inProgress: 0,
    totalThisWeek: 0,
    completionRate: 0,
    avgTimeText: null,
    satisfactionRate: null,
    satisfiedCount: 0,
    unsatisfiedCount: 0,
    typeCounts: { system: 0, learning: 0, account: 0, other: 0 },
    weeklyCounts: {
      thisWeek: [0, 0, 0, 0, 0, 0, 0],
      lastWeek: [0, 0, 0, 0, 0, 0, 0],
    },
  };

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

  function toValidDate(value) {
    if (!value) return null;
    const date =
      typeof value.toDate === "function" ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const mins = minutes % 60;
    if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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

    valueEl.innerHTML =
      `<span>${value}</span>` +
      (unit ? `<span class="unit">${unit}</span>` : "");
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

  function buildDashboardSnapshot(tickets, metrics) {
    return {
      date: new Date().toLocaleDateString("vi-VN"),
      totalTickets: tickets.length,
      ticketsToday: metrics.ticketsToday,
      completedThisWeek: metrics.completedThisWeek,
      inProgress: metrics.inProgress,
      totalThisWeek: metrics.totalThisWeek,
      completionRate: metrics.completionRate,
      avgTimeText: metrics.avgTimeText,
      satisfactionRate: metrics.satisfactionRate,
      satisfiedCount: metrics.satisfiedCount,
      unsatisfiedCount: metrics.unsatisfiedCount,
      typeCounts: metrics.typeCounts,
      weeklyCounts: metrics.weeklyCounts,
    };
  }

  function updateDashboardState(metrics) {
    dashboardState = {
      ...dashboardState,
      ...metrics,
      typeCounts: { ...(metrics.typeCounts || dashboardState.typeCounts) },
      weeklyCounts: {
        thisWeek: [
          ...(metrics.weeklyCounts?.thisWeek ||
            dashboardState.weeklyCounts.thisWeek),
        ],
        lastWeek: [
          ...(metrics.weeklyCounts?.lastWeek ||
            dashboardState.weeklyCounts.lastWeek),
        ],
      },
    };
    window.__dashboardSnapshot = buildDashboardSnapshot(
      metrics.tickets || [],
      dashboardState,
    );
  }

  function exportDashboardExcel() {
    if (typeof XLSX === "undefined") {
      alert("Tính năng xuất Excel chưa sẵn sàng trong trình duyệt.");
      return;
    }

    const snapshot = window.__dashboardSnapshot || dashboardState;
    if (!snapshot || !snapshot.typeCounts) {
      alert("Chưa có dữ liệu dashboard để xuất.");
      return;
    }

    const summaryRows = [
      ["Chỉ tiêu", "Giá trị"],
      ["Ngày thống kê", snapshot.date],
      ["Tổng số ticket", snapshot.totalTickets],
      ["Ticket mới hôm nay", snapshot.ticketsToday],
      ["Ticket hoàn thành trong tuần", snapshot.completedThisWeek],
      ["Ticket đang xử lý", snapshot.inProgress],
      ["Tổng ticket trong tuần", snapshot.totalThisWeek],
      ["Tỷ lệ hoàn thành", `${snapshot.completionRate}%`],
      ["Thời gian xử lý trung bình", snapshot.avgTimeText || "Chưa có dữ liệu"],
      [
        "Tỷ lệ hài lòng",
        snapshot.satisfactionRate
          ? `${snapshot.satisfactionRate}%`
          : "Chưa có dữ liệu",
      ],
      ["Hài lòng", snapshot.satisfiedCount || 0],
      ["Không hài lòng", snapshot.unsatisfiedCount || 0],
    ];

    const typeRows = [
      ["Nhóm ticket", "Số lượng"],
      ["Hệ thống", snapshot.typeCounts.system || 0],
      ["Khóa học", snapshot.typeCounts.learning || 0],
      ["Tài khoản", snapshot.typeCounts.account || 0],
      ["Khác", snapshot.typeCounts.other || 0],
    ];

    const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const weeklyRows = [
      ["Ngày", "Tuần này", "Tuần trước"],
      ...dayLabels.map((label, index) => [
        label,
        snapshot.weeklyCounts.thisWeek[index] || 0,
        snapshot.weeklyCounts.lastWeek[index] || 0,
      ]),
    ];

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    const typeSheet = XLSX.utils.aoa_to_sheet(typeRows);
    const weeklySheet = XLSX.utils.aoa_to_sheet(weeklyRows);

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Tổng quan");
    XLSX.utils.book_append_sheet(workbook, typeSheet, "Loại ticket");
    XLSX.utils.book_append_sheet(workbook, weeklySheet, "So sánh tuần");

    XLSX.writeFile(workbook, "dashboard-ticket-report.xlsx");
  }

  /* =====================================================
       RENDER BIỂU ĐỒ TRÒN (PIE CHART - TYPE 1-5)
    ===================================================== */
  function normalizeCategoryKey(ticket) {
    const rawValue =
      ticket?.ticketCategory ||
      ticket?.category ||
      ticket?.ticketCategoryId ||
      ticket?.type ||
      ticket?.typeId ||
      ticket?.ticketType;
    if (rawValue === undefined || rawValue === null || rawValue === "")
      return null;

    const normalized = String(rawValue).trim().toLowerCase();
    const categoryMap = {
      system: "system",
      "he thong": "system",
      "hệ thống": "system",
      learning: "learning",
      "khoa hoc": "learning",
      "khóa học": "learning",
      account: "account",
      operations: "account",
      "tai khoan": "account",
      "tài khoản": "account",
      "van hanh": "account",
      "vận hành": "account",
      other: "other",
      khac: "other",
      khác: "other",
    };

    if (categoryMap[normalized]) return categoryMap[normalized];

    const parts = normalized.split("-");
    if (parts.length > 0 && categoryMap[parts[0]]) return categoryMap[parts[0]];

    const numericValue = Number(rawValue);
    if (!Number.isNaN(numericValue)) {
      const legacyMap = {
        1: "system",
        2: "learning",
        3: "account",
        4: "other",
        5: "other",
      };
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
      account: "Vận hành",
      other: "Khác",
    };

    const totalTypes = categoryOrder.reduce(
      (sum, key) => sum + (typeCounts[key] || 0),
      0,
    );

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
          datasets: [
            {
              data: data,
              backgroundColor: ["#5D0703", "#B08A4E", "#7A1410", "#4C6B3C"],
              borderWidth: 2,
              borderColor: "#FFFBF5",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                font: { family: "Inter", size: 12 },
                color: "#2A1712",
              },
            },
          },
        },
      });
    }
  }

  function renderSatisfactionChart(satisfiedCount, unsatisfiedCount) {
    const canvas = el("satisfactionChart");
    const emptyNote = el("satisfactionEmptyNote");
    const total = satisfiedCount + unsatisfiedCount;
    const satisfiedCountEl = el("satisfiedCount");
    const unsatisfiedCountEl = el("unsatisfiedCount");

    if (satisfiedCountEl) satisfiedCountEl.textContent = String(satisfiedCount);
    if (unsatisfiedCountEl)
      unsatisfiedCountEl.textContent = String(unsatisfiedCount);
    if (!canvas) return;

    if (total === 0) {
      if (satisfactionChartInstance) {
        satisfactionChartInstance.destroy();
        satisfactionChartInstance = null;
      }
      canvas.style.display = "none";
      if (emptyNote) emptyNote.style.display = "block";
      return;
    }

    canvas.style.display = "block";
    if (emptyNote) emptyNote.style.display = "none";
    const data = [satisfiedCount, unsatisfiedCount];

    if (satisfactionChartInstance) {
      satisfactionChartInstance.data.datasets[0].data = data;
      satisfactionChartInstance.update();
      return;
    }

    satisfactionChartInstance = new Chart(canvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Hài lòng", "Không hài lòng"],
        datasets: [
          {
            data,
            backgroundColor: ["#4C6B3C", "#A23B2E"],
            borderColor: "#FFFBF5",
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "64%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.raw} phản hồi`,
            },
          },
        },
      },
    });
  }

  /* =====================================================
       RESET BIỂU ĐỒ CỘT
    ===================================================== */
  function resetBarsEmpty() {
    document.querySelectorAll("#weekBarChart .bar").forEach((bar) => {
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
    const emptyTypeCounts = { system: 0, learning: 0, account: 0, other: 0 };
    const emptyMetrics = {
      date: new Date().toLocaleDateString("vi-VN"),
      totalTickets: 0,
      ticketsToday: 0,
      completedThisWeek: 0,
      inProgress: 0,
      totalThisWeek: 0,
      completionRate: 0,
      avgTimeText: null,
      satisfactionRate: null,
      satisfiedCount: 0,
      unsatisfiedCount: 0,
      typeCounts: emptyTypeCounts,
      weeklyCounts: {
        thisWeek: [0, 0, 0, 0, 0, 0, 0],
        lastWeek: [0, 0, 0, 0, 0, 0, 0],
      },
    };

    dashboardState = { ...emptyMetrics };
    window.__dashboardSnapshot = buildDashboardSnapshot([], emptyMetrics);

    setStat("valToday", "subToday", null);
    setStat("valCompleted", "subCompleted", null);
    setStat("valInProgress", "subInProgress", null);
    setStat("valCompletionRate", "subCompletionRate", null, null, "%");
    setStat("valAvgTime", "subAvgTime", null);
    setStat("valSatisfaction", "subSatisfaction", null);
    renderSatisfactionChart(0, 0);

    setProgress(null);
    resetBarsEmpty();
    renderPieChart(emptyTypeCounts);
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

    const typeCounts = { system: 0, learning: 0, account: 0, other: 0 };
    let totalTimeMinutes = 0;
    let resolvedCount = 0;
    let satisfiedCount = 0;
    let unsatisfiedCount = 0;

    const weekTickets = [];

    tickets.forEach((ticket) => {
      if (!ticket) return;

      const createdAt = toValidDate(ticket.createdAt);
      if (!createdAt) return;

      const categoryKey = normalizeCategoryKey(ticket);
      if (categoryKey && typeCounts[categoryKey] !== undefined) {
        typeCounts[categoryKey]++;
      }

      const satisfactionStatus = String(
        ticket.satisfactionStatus || "",
      ).toLowerCase();
      if (satisfactionStatus === "satisfied") satisfiedCount++;
      if (satisfactionStatus === "unsatisfied") unsatisfiedCount++;

      const status = String(ticket.status || "").toLowerCase();
      if (status === "closed") {
        const closedAt = toValidDate(
          ticket.closedAt || ticket.statusClosedAt || ticket.updatedAt,
        );
        if (closedAt && closedAt >= createdAt) {
          const diffMs = closedAt - createdAt;
          totalTimeMinutes += Math.floor(diffMs / (1000 * 60));
          resolvedCount++;
        }
      }

      if (getDateKey(createdAt) === today) {
        ticketsToday++;
      }

      const dayThis = getWeekDay(createdAt, mondayThis);
      if (dayThis >= 0 && dayThis < 7) {
        thisWeek[dayThis]++;
        totalThisWeek++;
        weekTickets.push(ticket);
      }

      const dayLast = getWeekDay(createdAt, mondayLast);
      if (dayLast >= 0 && dayLast < 7) {
        lastWeek[dayLast]++;
      }

      if (
        status === "in_progress" ||
        status === "processing" ||
        status === "pending"
      ) {
        inProgress++;
      }
    });

    completedThisWeek = weekTickets.filter((ticket) => {
      const status = String(ticket.status || "").toLowerCase();
      return (
        status === "completed" || status === "closed" || status === "resolved"
      );
    }).length;

    /* --- Tỷ lệ hoàn thành: tính trên TOÀN BỘ ticket, không giới hạn theo tuần --- */
    const totalAllTickets = tickets.length;
    const completedAllTickets = tickets.filter((ticket) => {
      const status = String(ticket.status || "").toLowerCase();
      return (
        status === "completed" || status === "closed" || status === "resolved"
      );
    }).length;
    const completionRate =
      totalAllTickets === 0
        ? 0
        : Math.round((completedAllTickets / totalAllTickets) * 100);

    const avgTimeText =
      resolvedCount > 0
        ? formatDuration(Math.round(totalTimeMinutes / resolvedCount))
        : null;
    const satisfactionResponses = satisfiedCount + unsatisfiedCount;
    const satisfactionRate =
      satisfactionResponses > 0
        ? Math.round((satisfiedCount / satisfactionResponses) * 100)
        : null;

    const dashboardSnapshot = {
      ticketsToday,
      completedThisWeek,
      inProgress,
      totalThisWeek,
      completionRate,
      avgTimeText,
      satisfactionRate,
      satisfiedCount,
      unsatisfiedCount,
      typeCounts,
      weeklyCounts: { thisWeek, lastWeek },
      totalTickets: tickets.length,
    };
    dashboardState = {
      ...dashboardState,
      ...dashboardSnapshot,
      totalTickets: tickets.length,
      typeCounts: { ...typeCounts },
      weeklyCounts: { thisWeek: [...thisWeek], lastWeek: [...lastWeek] },
    };
    window.__dashboardSnapshot = buildDashboardSnapshot(
      tickets,
      dashboardState,
    );

    setStat(
      "valToday",
      "subToday",
      ticketsToday,
      ticketsToday === 0
        ? "Không có ticket mới hôm nay"
        : `${ticketsToday} ticket được tạo hôm nay`,
    );
    setStat(
      "valCompleted",
      "subCompleted",
      completedThisWeek,
      completedThisWeek === 0
        ? "Chưa có ticket hoàn thành"
        : `${completedThisWeek} ticket đã hoàn thành`,
    );
    setStat(
      "valInProgress",
      "subInProgress",
      inProgress,
      inProgress === 0
        ? "Không có ticket đang xử lý"
        : `${inProgress} ticket đang xử lý`,
    );
    setStat(
      "valCompletionRate",
      "subCompletionRate",
      completionRate,
      `${completedAllTickets}/${totalAllTickets} ticket`,
      "%",
    );
    setProgress(completionRate);

    if (avgTimeText) {
      setStat(
        "valAvgTime",
        "subAvgTime",
        avgTimeText,
        `Từ lúc tạo đến khi đóng · ${resolvedCount} ticket`,
      );
    } else {
      setStat("valAvgTime", "subAvgTime", null);
    }

    if (satisfactionResponses > 0) {
      setStat(
        "valSatisfaction",
        "subSatisfaction",
        satisfactionRate,
        `${satisfiedCount} hài lòng · ${unsatisfiedCount} không hài lòng`,
        "%",
      );
    } else {
      setStat("valSatisfaction", "subSatisfaction", null);
    }
    renderSatisfactionChart(satisfiedCount, unsatisfiedCount);
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
      (snapshot) => {
        const tickets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (tickets.length === 0) {
          renderEmptyState();
          return;
        }
        calculateDashboard(tickets);
      },
      (error) => {
        console.error(
          "Lỗi đọc tickets (real-time):",
          error.code,
          error.message,
        );

        // Fallback: thử đọc dữ liệu một lần bằng get() thay vì real-time listener
        db.collection("tickets")
          .get()
          .then((snapshot) => {
            const tickets = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            if (tickets.length === 0) {
              renderEmptyState();
              return;
            }
            console.warn(
              "Đã tải dữ liệu qua get() (không real-time) do onSnapshot lỗi.",
            );
            calculateDashboard(tickets);
          })
          .catch((fallbackError) => {
            console.error(
              "Lỗi đọc tickets (fallback get()):",
              fallbackError.code,
              fallbackError.message,
            );
            renderEmptyState();
          });
      },
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    const exportButton = el("exportDashboardBtn");
    if (exportButton) {
      exportButton.addEventListener("click", exportDashboardExcel);
    }
    initDashboard();
  });

  window.DashboardUI = {
    renderEmptyState,
    calculateDashboard,
    exportDashboardExcel,
  };
})();
