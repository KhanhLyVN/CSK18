// cs-ticket.js — Ticket Management page logic
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---- Fill in your Firebase project config here ----
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const PAGE_SIZE = 10;
let allTickets = [];
let filteredTickets = [];
let currentPage = 1;

const statusMap = {
  pending:  { label: "Chờ xử lý",     cls: "badge-pending" },
  progress: { label: "Đang xử lý",    cls: "badge-progress" },
  resolved: { label: "Đã giải quyết", cls: "badge-resolved" }
};
const priorityMap = {
  high:   { label: "HIGH",   cls: "prio-high" },
  medium: { label: "MEDIUM", cls: "prio-medium" },
  low:    { label: "LOW",    cls: "prio-low" }
};

function fmtDate(value) {
  if (!value) return "N/A";
  let d;
  if (value.toDate) d = value.toDate();
  else d = new Date(value);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function renderStatusBadge(status) {
  const s = statusMap[status];
  if (!s) return `<span class="badge badge-na"><span class="dot"></span>N/A</span>`;
  return `<span class="badge ${s.cls}"><span class="dot"></span>${s.label}</span>`;
}

function renderPriorityBadge(priority) {
  const p = priorityMap[priority];
  if (!p) return `<span class="prio prio-na">N/A</span>`;
  return `<span class="prio ${p.cls}">${p.label}</span>`;
}

function populateCategoryFilter(tickets) {
  const sel = document.getElementById("filterCategory");
  const cats = [...new Set(tickets.map(t => t.category).filter(Boolean))];
  cats.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function applyFilters() {
  const status = document.getElementById("filterStatus").value;
  const priority = document.getElementById("filterPriority").value;
  const category = document.getElementById("filterCategory").value;
  const query = document.getElementById("searchInput").value.trim().toLowerCase();

  filteredTickets = allTickets.filter(t => {
    if (status && t.status !== status) return false;
    if (priority && t.priority !== priority) return false;
    if (category && t.category !== category) return false;
    if (query) {
      const hay = `${t.id} ${t.subject || ""}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  currentPage = 1;
  renderTable();
}

function renderTable() {
  const body = document.getElementById("ticketBody");
  const emptyState = document.getElementById("emptyState");
  const note = document.getElementById("entriesNote");
  const table = document.querySelector(".ticket-table");

  if (!filteredTickets.length) {
    body.innerHTML = "";
    table.style.display = "none";
    emptyState.style.display = "block";
    note.textContent = "Showing 0 of 0 entries";
    renderPagination(0);
    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredTickets.slice(start, start + PAGE_SIZE);

  body.innerHTML = pageItems.map(t => `
    <tr>
      <td class="cell-id">${t.id || "N/A"}</td>
      <td>${t.customer || "N/A"}</td>
      <td class="cell-subject">${t.subject || "N/A"}</td>
      <td>${renderStatusBadge(t.status)}</td>
      <td>${renderPriorityBadge(t.priority)}</td>
      <td class="cell-muted">${fmtDate(t.date)}</td>
      <td>
        <button class="action-btn" aria-label="More actions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
        </button>
      </td>
    </tr>
  `).join("");

  const showEnd = Math.min(start + PAGE_SIZE, filteredTickets.length);
  note.textContent = `Showing ${start + 1} to ${showEnd} of ${filteredTickets.length} entries`;
  renderPagination(Math.ceil(filteredTickets.length / PAGE_SIZE));
}

function renderPagination(totalPages) {
  const el = document.getElementById("paginationEl");
  if (totalPages <= 1) { el.innerHTML = ""; return; }

  let html = `<button class="page-btn" id="prevBtn" ${currentPage === 1 ? "disabled" : ""}>Prev</button>`;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  pages.forEach(p => {
    if (p === "...") html += `<span class="page-ellipsis">…</span>`;
    else html += `<button class="page-btn ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
  });

  html += `<button class="page-btn" id="nextBtn" ${currentPage === totalPages ? "disabled" : ""}>Next</button>`;
  el.innerHTML = html;

  el.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => { currentPage = Number(btn.dataset.page); renderTable(); });
  });
  const prev = document.getElementById("prevBtn");
  const next = document.getElementById("nextBtn");
  if (prev) prev.addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderTable(); } });
  if (next) next.addEventListener("click", () => { if (currentPage < totalPages) { currentPage++; renderTable(); } });
}

function setStats(tickets) {
  const totalEl = document.getElementById("statTotal");
  const pendingEl = document.getElementById("statPending");
  const resolvedEl = document.getElementById("statResolved");

  if (!tickets.length) {
    totalEl.textContent = "N/A"; totalEl.classList.add("na");
    pendingEl.textContent = "N/A"; pendingEl.classList.add("na");
    resolvedEl.textContent = "N/A"; resolvedEl.classList.add("na");
    return;
  }
  totalEl.classList.remove("na");
  pendingEl.classList.remove("na");
  resolvedEl.classList.remove("na");
  totalEl.textContent = tickets.length.toLocaleString();
  pendingEl.textContent = tickets.filter(t => t.status === "pending" || t.status === "progress").length.toLocaleString();
  resolvedEl.textContent = tickets.filter(t => t.status === "resolved").length.toLocaleString();
}

async function loadTickets() {
  // No config provided -> stay in N/A / empty state.
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    allTickets = [];
    filteredTickets = [];
    setStats([]);
    renderTable();
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snap = await getDocs(collection(db, "tickets"));

    allTickets = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: d.id || doc.id,
        customer: d.customer || null,
        subject: d.subject || null,
        status: d.status || null,
        priority: d.priority || null,
        category: d.category || null,
        date: d.date || null
      };
    });

    populateCategoryFilter(allTickets);
    setStats(allTickets);
    filteredTickets = [...allTickets];
    renderTable();
  } catch (err) {
    console.warn("Firebase unavailable, falling back to N/A state:", err);
    allTickets = [];
    filteredTickets = [];
    setStats([]);
    renderTable();
  }
}

document.getElementById("filterStatus").addEventListener("change", applyFilters);
document.getElementById("filterPriority").addEventListener("change", applyFilters);
document.getElementById("filterCategory").addEventListener("change", applyFilters);
document.getElementById("searchInput").addEventListener("input", applyFilters);

document.getElementById("collapseBtn").addEventListener("click", () => {
  document.getElementById("sidebarEl").classList.toggle("collapsed");
});

loadTickets();