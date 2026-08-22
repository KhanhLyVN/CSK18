/* =========================================================
   ADMIN SETTINGS
   ADMIN ACCOUNT:
   hcm@admin.com
========================================================= */

(() => {
  "use strict";

  /* =======================================================
     CONFIG
  ======================================================= */

  const ADMIN_EMAIL = "hcm@admin.com";
  const ADMIN_CAMPUS = "HCM";
  const USER_COLLECTION = "users";

  /* =======================================================
     DEFAULT SETTINGS
  ======================================================= */

  const DEFAULT_SETTINGS = {
    confirmLogout: true,
    interfaceSize: "normal",
  };

  let settings = {
    ...DEFAULT_SETTINGS,
  };

  let hasUnsavedChanges = false;

  /* =======================================================
     DOM HELPER
  ======================================================= */

  const $ = (id) => document.getElementById(id);

  /* =======================================================
     FIREBASE
  ======================================================= */

  function getAuth() {
    try {
      if (typeof auth !== "undefined" && auth) {
        return auth;
      }

      if (
        typeof firebase !== "undefined" &&
        firebase.apps &&
        firebase.apps.length
      ) {
        return firebase.auth();
      }
    } catch (error) {
      console.error("Firebase Auth:", error);
    }

    return null;
  }

  function getFirestore() {
    try {
      if (typeof db !== "undefined" && db) {
        return db;
      }

      if (
        typeof firebase !== "undefined" &&
        firebase.apps &&
        firebase.apps.length
      ) {
        return firebase.firestore();
      }
    } catch (error) {
      console.error("Firestore:", error);
    }

    return null;
  }

  /* =======================================================
     TOAST
  ======================================================= */

  function toast(message, type = "success") {
    const node = $("toast");

    if (!node) return;

    node.textContent = message;
    node.hidden = false;

    node.classList.remove("toast-success", "toast-error");

    node.classList.add(type === "error" ? "toast-error" : "toast-success");

    clearTimeout(window.__settingsToastTimer);

    window.__settingsToastTimer = setTimeout(() => {
      node.hidden = true;
    }, 2600);
  }

  /* =======================================================
     INITIALS
  ======================================================= */

  function initials(name) {
    const text = String(name || "AD").trim();

    if (!text) return "AD";

    const parts = text.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return parts
      .slice(-2)
      .map((item) => item.charAt(0))
      .join("")
      .toUpperCase();
  }

  /* =======================================================
     LOAD LOCAL SETTINGS
  ======================================================= */

  function loadSettings() {
    try {
      const saved = localStorage.getItem("adminSettings");

      if (saved) {
        const parsed = JSON.parse(saved);

        settings = {
          ...DEFAULT_SETTINGS,
          confirmLogout: parsed.confirmLogout !== false,
          interfaceSize: ["compact", "normal", "large"].includes(parsed.interfaceSize)
            ? parsed.interfaceSize
            : DEFAULT_SETTINGS.interfaceSize,
        };
      }
    } catch (error) {
      console.warn("Không thể đọc Admin Settings:", error);

      settings = {
        ...DEFAULT_SETTINGS,
      };
    }

    renderSettings();
  }

  /* =======================================================
     RENDER SETTINGS
  ======================================================= */

  function renderSettings() {
    const ids = [
      "notifyNewAccount",
      "notifyPending",
      "notifySystem",
      "notificationSound",
      "realtimeEnabled",
      "autoLoad",
      "activityLogging",
      "confirmLogout",
    ];

    ids.forEach((id) => {
      const node = $(id);

      if (!node) return;

      node.checked = settings[id] === true;
    });

    if ($("interfaceSize")) {
      $("interfaceSize").value = settings.interfaceSize;
    }

    if ($("language")) {
      $("language").value = settings.language;
    }

    applyInterfaceSize();
    setSaveStatus("Bạn chưa có thay đổi nào. Mọi tùy chọn hiện đang dùng trạng thái đã lưu.", false);
  }

  function setSaveStatus(message, dirty) {
    const status = $("settingsSaveStatus");
    if (status) status.textContent = message;
    document.querySelector(".save-bar")?.classList.toggle("is-dirty", Boolean(dirty));
    hasUnsavedChanges = Boolean(dirty);
  }

  function markSettingsChanged() {
    setSaveStatus("Bạn có thay đổi chưa lưu. Nhấn “Lưu cài đặt” để áp dụng.", true);
  }

  /* =======================================================
     READ SETTINGS
  ======================================================= */

  function readSettings() {
    const ids = [
      "notifyNewAccount",
      "notifyPending",
      "notifySystem",
      "notificationSound",
      "realtimeEnabled",
      "autoLoad",
      "activityLogging",
      "confirmLogout",
    ];

    ids.forEach((id) => {
      const node = $(id);

      if (!node) return;

      settings[id] = node.checked;
    });

    if ($("interfaceSize")) {
      settings.interfaceSize = $("interfaceSize").value;
    }

    if ($("language")) {
      settings.language = $("language").value;
    }
  }

  /* =======================================================
     SAVE SETTINGS
  ======================================================= */

  function saveSettings() {
    readSettings();

    try {
      localStorage.setItem("adminSettings", JSON.stringify(settings));

      applyInterfaceSize();

      toast("Đã lưu cài đặt");
      setSaveStatus("Đã lưu cài đặt. Các thay đổi đang được áp dụng cho trình duyệt này.", false);
    } catch (error) {
      console.error(error);

      toast("Không thể lưu cài đặt", "error");
    }
  }

  /* =======================================================
     RESET SETTINGS
  ======================================================= */

  function resetSettings() {
    settings = {
      ...DEFAULT_SETTINGS,
    };

    try {
      localStorage.setItem("adminSettings", JSON.stringify(settings));
    } catch (error) {
      console.warn(error);
    }

    renderSettings();

    toast("Đã khôi phục mặc định");
    setSaveStatus("Đã khôi phục các tùy chọn mặc định và lưu lại trên trình duyệt này.", false);
  }

  /* =======================================================
     APPLY SIZE
  ======================================================= */

  function applyInterfaceSize() {
    document.body.classList.remove("size-compact", "size-normal", "size-large");

    document.body.classList.add(`size-${settings.interfaceSize}`);
  }

  /* =======================================================
     ADMIN ACCESS
  ======================================================= */

  async function verifyAdmin(user) {
    if (!user) {
      return false;
    }

    const email = String(user.email || "")
      .trim()
      .toLowerCase();

    /*
     * Admin chính:
     * hcm@admin.com
     */

    if (email === ADMIN_EMAIL) {
      return true;
    }

    /*
     * Kiểm tra Firestore nếu sau này
     * có thêm Admin khác.
     */

    const database = getFirestore();

    if (!database) {
      return false;
    }

    try {
      const snapshot = await database
        .collection(USER_COLLECTION)
        .doc(user.uid)
        .get();

      if (!snapshot.exists) {
        return false;
      }

      const data = snapshot.data() || {};

      return (
        data.accountType === "admin" &&
        data.role === "admin" &&
        data.status !== "disabled"
      );
    } catch (error) {
      console.error("Không thể kiểm tra quyền Admin:", error);

      return false;
    }
  }

  /* =======================================================
     REDIRECT
  ======================================================= */

  function redirectToLogin() {
    window.location.href = "/CS/login/login.html";
  }

  /* =======================================================
     ADMIN PROFILE
  ======================================================= */

  async function loadAdminProfile() {
    const firebaseAuth = getAuth();

    if (!firebaseAuth) {
      updateFirebaseStatus(false, false);

      setAdminUI("Administrator", "Firebase Auth chưa sẵn sàng", "—");

      return;
    }

    firebaseAuth.onAuthStateChanged(async (user) => {
      /*
       * Chưa đăng nhập
       */

      if (!user) {
        setAdminUI("Administrator", "Chưa đăng nhập", "—");

        updateSessionUI(null);

        setTimeout(redirectToLogin, 700);

        return;
      }

      /*
       * Kiểm tra quyền
       */

      const isAdmin = await verifyAdmin(user);

      if (!isAdmin) {
        toast("Tài khoản này không có quyền Admin", "error");

        await firebaseAuth.signOut();

        setTimeout(redirectToLogin, 900);

        return;
      }

      /*
       * Admin hợp lệ
       */

      const email = user.email || ADMIN_EMAIL;

      let name = user.displayName || "HCM Admin";

      let campus = ADMIN_CAMPUS;

      const database = getFirestore();

      if (database) {
        try {
          const snapshot = await database
            .collection(USER_COLLECTION)
            .doc(user.uid)
            .get();

          if (snapshot.exists) {
            const data = snapshot.data() || {};

            name =
              data.displayName || data.name || user.displayName || "HCM Admin";

            campus = data.campus || ADMIN_CAMPUS;
          }
        } catch (error) {
          console.warn("Không thể lấy Admin profile:", error);
        }
      }

      setAdminUI(name, email, campus);

      updateSessionUI(user);

      updateFirebaseStatus(true, true);
    });
  }

  /* =======================================================
     SET ADMIN UI
  ======================================================= */

  function setAdminUI(name, email, campus) {
    const avatar = initials(name);

    const elements = {
      sidebarAdminName: name,
      sidebarAdminEmail: email,
      topAdminName: name,
      topAdminEmail: email,
      topAvatar: avatar,

      profileAvatar: avatar,
      profileName: name,
      profileEmail: email,

      adminName: name,
      adminEmail: email,

      adminCampus: campus,
    };

    Object.entries(elements).forEach(([id, value]) => {
      const node = $(id);

      if (!node) return;

      if (node.tagName === "INPUT") {
        node.value = value;
      } else {
        node.textContent = value;
      }
    });

    if ($("adminRole")) {
      $("adminRole").textContent = "SYSTEM ADMIN";
    }
  }

  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  async function saveProfile() {
    const nameNode = $("adminName");

    if (!nameNode) return;

    const name = nameNode.value.trim();

    if (!name) {
      toast("Vui lòng nhập họ tên", "error");

      return;
    }

    const firebaseAuth = getAuth();

    if (!firebaseAuth) {
      toast("Firebase Auth chưa sẵn sàng", "error");

      return;
    }

    const user = firebaseAuth.currentUser;

    if (!user) {
      toast("Chưa có phiên đăng nhập", "error");

      return;
    }

    const isAdmin = await verifyAdmin(user);

    if (!isAdmin) {
      toast("Bạn không có quyền Admin", "error");

      return;
    }

    try {
      /*
       * Firebase Authentication
       */

      await user.updateProfile({
        displayName: name,
      });

      /*
       * Firestore
       */

      const database = getFirestore();

      if (database) {
        await database
          .collection(USER_COLLECTION)
          .doc(user.uid)
          .set(
            {
              accountType: "admin",
              role: "admin",
              campus: ADMIN_CAMPUS,

              name,
              displayName: name,

              email: user.email || ADMIN_EMAIL,

              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            },
            {
              merge: true,
            },
          );
      }

      setAdminUI(name, user.email || ADMIN_EMAIL, ADMIN_CAMPUS);

      toast("Đã cập nhật thông tin Admin");
    } catch (error) {
      console.error("Save profile:", error);

      toast("Không thể cập nhật thông tin", "error");
    }
  }

  /* =======================================================
     FIREBASE STATUS
  ======================================================= */

  function updateFirebaseStatus(connected, authenticated) {
    const firebaseStatus = $("firebaseStatus");

    const connectionLabel = $("connectionLabel");

    const connectionDot = $("connectionDot");

    const authStatus = $("authStatus");

    if (firebaseStatus) {
      firebaseStatus.textContent = connected ? "CONNECTED" : "OFFLINE";
    }

    if (connectionLabel) {
      connectionLabel.textContent = connected
        ? "Firebase đang hoạt động"
        : "Firebase chưa kết nối";
    }

    if (connectionDot) {
      connectionDot.classList.toggle("live", connected);
    }

    if (authStatus) {
      authStatus.textContent = authenticated ? "AUTHORIZED" : "WAITING";
    }
  }

  function checkFirebase() {
    const database = getFirestore();

    const firebaseAuth = getAuth();

    updateFirebaseStatus(!!database, !!firebaseAuth);
  }

  /* =======================================================
     SESSION
  ======================================================= */

  function updateSessionUI(user) {
    const uid = $("sessionUid");

    const provider = $("sessionProvider");

    const sessionEmail = $("sessionEmail");

    if (!user) {
      if (uid) uid.textContent = "—";
      if (provider) provider.textContent = "—";
      if (sessionEmail) sessionEmail.textContent = "—";

      return;
    }

    if (uid) {
      uid.textContent = user.uid;
    }

    if (sessionEmail) {
      sessionEmail.textContent = user.email || ADMIN_EMAIL;
    }

    const providerId =
      user.providerData && user.providerData.length
        ? user.providerData[0].providerId
        : "password";

    if (provider) {
      provider.textContent = providerId;
    }
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {
    const firebaseAuth = getAuth();

    if (!firebaseAuth) {
      toast("Firebase Auth chưa sẵn sàng", "error");

      return;
    }

    if (settings.confirmLogout) {
      const confirmed = confirm("Bạn có chắc muốn đăng xuất khỏi Admin?");

      if (!confirmed) return;
    }

    try {
      await firebaseAuth.signOut();

      toast("Đã đăng xuất Admin");

      setTimeout(() => {
        redirectToLogin();
      }, 500);
    } catch (error) {
      console.error("Logout:", error);

      toast("Đăng xuất thất bại", "error");
    }
  }

  /* =======================================================
     MOBILE MENU
  ======================================================= */

  function setupMobileMenu() {
    const menuBtn = $("menuBtn");

    const sidebar = $("sidebar");

    const backdrop = $("sidebarBackdrop");

    if (!menuBtn || !sidebar) {
      return;
    }

    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");

      if (backdrop) {
        backdrop.hidden = !sidebar.classList.contains("open");
      }
    });

    if (backdrop) {
      backdrop.addEventListener("click", () => {
        sidebar.classList.remove("open");

        backdrop.hidden = true;
      });
    }
  }

  /* =======================================================
     SIDEBAR
  ======================================================= */

  function setupSidebar() {
    const navItems = document.querySelectorAll(".nav-item[data-page]");

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        try {
          localStorage.setItem("adminActivePage", item.dataset.page);
        } catch (error) {}
      });

      item.classList.toggle("active", item.dataset.page === "settings");
    });
  }

  /* =======================================================
     EVENTS
  ======================================================= */

  function setupEvents() {
    $("saveSettingsBtn")?.addEventListener("click", saveSettings);

    $("resetSettingsBtn")?.addEventListener("click", resetSettings);

    $("resetAllBtn")?.addEventListener("click", () => {
      renderSettings();

      toast("Đã hủy thay đổi");
      setSaveStatus("Đã hủy các thay đổi chưa lưu.", false);
    });

    $("saveProfileBtn")?.addEventListener("click", saveProfile);

    $("logoutBtn")?.addEventListener("click", logout);

    $("logoutSessionBtn")?.addEventListener("click", logout);

    $("interfaceSize")?.addEventListener("change", () => {
      settings.interfaceSize = $("interfaceSize").value;

      applyInterfaceSize();
      markSettingsChanged();
    });

    document.querySelectorAll(".settings-grid input, .settings-grid select").forEach((node) => {
      node.addEventListener("change", () => {
        if (node.id !== "adminName") markSettingsChanged();
      });
    });

    setupMobileMenu();
    setupSidebar();
  }

  /* =======================================================
     INIT
  ======================================================= */

  function init() {
    loadSettings();
    setupEvents();
    checkFirebase();
    loadAdminProfile();
  }

  init();
})();
