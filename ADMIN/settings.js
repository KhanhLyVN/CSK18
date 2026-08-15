/* =========================================================
   ADMIN SETTINGS
   Firebase:
   - Authentication
   - Firestore
   Collection: users
========================================================= */

(() => {

  "use strict";


  /* =======================================================
     STATE
  ======================================================= */

  const DEFAULT_SETTINGS = {

    notifyNewAccount: true,

    notifyPending: true,

    notifySystem: true,

    notificationSound: false,

    realtimeEnabled: true,

    autoLoad: true,

    activityLogging: true,

    confirmLogout: true,

    interfaceSize: "normal",

    language: "vi"

  };


  let settings = {
    ...DEFAULT_SETTINGS
  };


  /* =======================================================
     DOM
  ======================================================= */

  const $ = id =>
    document.getElementById(id);


  /* =======================================================
     FIREBASE
  ======================================================= */

  function getFirestore() {

    if (
      typeof db !== "undefined" &&
      db
    ) {
      return db;
    }


    if (
      typeof firebase !== "undefined" &&
      firebase.apps &&
      firebase.apps.length
    ) {
      return firebase.firestore();
    }


    return null;
  }


  function getAuth() {

    if (
      typeof auth !== "undefined" &&
      auth
    ) {
      return auth;
    }


    if (
      typeof firebase !== "undefined" &&
      firebase.apps &&
      firebase.apps.length
    ) {
      return firebase.auth();
    }


    return null;
  }


  /* =======================================================
     TOAST
  ======================================================= */

  function toast(message) {

    const node =
      $("toast");


    if (!node) return;


    node.textContent =
      message;


    node.hidden = false;


    clearTimeout(
      window.__settingsToastTimer
    );


    window.__settingsToastTimer =
      setTimeout(() => {

        node.hidden = true;

      }, 2400);
  }


  /* =======================================================
     INITIALS
  ======================================================= */

  function initials(name) {

    const text =
      String(name || "AD")
        .trim();


    if (!text) {
      return "AD";
    }


    const parts =
      text
        .split(/\s+/)
        .filter(Boolean);


    if (parts.length === 1) {

      return parts[0]
        .substring(0, 2)
        .toUpperCase();

    }


    return parts
      .slice(-2)
      .map(
        item =>
          item.charAt(0)
      )
      .join("")
      .toUpperCase();
  }


  /* =======================================================
     LOAD LOCAL SETTINGS
  ======================================================= */

  function loadSettings() {

    try {

      const saved =
        localStorage.getItem(
          "adminSettings"
        );


      if (saved) {

        const parsed =
          JSON.parse(saved);


        settings = {
          ...DEFAULT_SETTINGS,
          ...parsed
        };

      }

    } catch (error) {

      console.warn(
        "Không thể đọc settings:",
        error
      );

      settings = {
        ...DEFAULT_SETTINGS
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
      "confirmLogout"

    ];


    ids.forEach(id => {

      const node = $(id);

      if (!node) return;

      node.checked =
        settings[id] === true;

    });


    if ($("interfaceSize")) {

      $("interfaceSize").value =
        settings.interfaceSize;

    }


    if ($("language")) {

      $("language").value =
        settings.language;

    }


    applyInterfaceSize();
  }


  /* =======================================================
     READ FORM
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
      "confirmLogout"

    ];


    ids.forEach(id => {

      const node = $(id);

      if (!node) return;

      settings[id] =
        node.checked;

    });


    settings.interfaceSize =
      $("interfaceSize").value;


    settings.language =
      $("language").value;
  }


  /* =======================================================
     SAVE SETTINGS
  ======================================================= */

  function saveSettings() {

    readSettings();


    try {

      localStorage.setItem(
        "adminSettings",
        JSON.stringify(settings)
      );


      applyInterfaceSize();


      toast(
        "Đã lưu cài đặt thành công"
      );

    } catch (error) {

      console.error(error);

      toast(
        "Không thể lưu cài đặt"
      );

    }
  }


  /* =======================================================
     RESET
  ======================================================= */

  function resetSettings() {

    settings = {
      ...DEFAULT_SETTINGS
    };


    try {

      localStorage.setItem(
        "adminSettings",
        JSON.stringify(settings)
      );

    } catch (error) {

      console.warn(error);

    }


    renderSettings();


    toast(
      "Đã khôi phục cài đặt mặc định"
    );
  }


  /* =======================================================
     APPLY INTERFACE SIZE
  ======================================================= */

  function applyInterfaceSize() {

    document.body.classList.remove(
      "size-compact",
      "size-normal",
      "size-large"
    );


    document.body.classList.add(
      `size-${settings.interfaceSize}`
    );
  }


  /* =======================================================
     ADMIN PROFILE
  ======================================================= */

  async function loadAdminProfile() {

    const firebaseAuth =
      getAuth();


    if (!firebaseAuth) {

      setAdminUI(
        "Administrator",
        "Chưa kết nối Authentication"
      );

      return;
    }


    firebaseAuth.onAuthStateChanged(
      async user => {

        if (!user) {

          setAdminUI(
            "Administrator",
            "Chưa đăng nhập"
          );

          updateSessionUI(null);

          return;
        }


        const email =
          user.email ||
          "Không có email";


        let name =
          user.displayName ||
          "";


        /*
         * Thử lấy profile từ users
         */

        const database =
          getFirestore();


        if (
          database &&
          !name
        ) {

          try {

            const snapshot =
              await database
                .collection("users")
                .doc(user.uid)
                .get();


            if (snapshot.exists) {

              const data =
                snapshot.data();


              name =
                data.name ||
                data.fullName ||
                data.displayName ||
                "";

            }

          } catch (error) {

            console.warn(
              "Không thể đọc profile:",
              error
            );

          }

        }


        name =
          name ||
          email.split("@")[0] ||
          "Administrator";


        setAdminUI(
          name,
          email
        );


        updateSessionUI(user);

      }
    );
  }


  /* =======================================================
     SET ADMIN UI
  ======================================================= */

  function setAdminUI(
    name,
    email
  ) {

    const avatar =
      initials(name);


    if ($("sidebarAdminName")) {

      $("sidebarAdminName")
        .textContent = name;

    }


    if ($("sidebarAdminEmail")) {

      $("sidebarAdminEmail")
        .textContent =
        email;

    }


    if ($("topAdminName")) {

      $("topAdminName")
        .textContent =
        name;

    }


    if ($("topAvatar")) {

      $("topAvatar")
        .textContent =
        avatar;

    }


    if ($("profileAvatar")) {

      $("profileAvatar")
        .textContent =
        avatar;

    }


    if ($("profileName")) {

      $("profileName")
        .textContent =
        name;

    }


    if ($("profileEmail")) {

      $("profileEmail")
        .textContent =
        email;

    }


    if ($("adminName")) {

      $("adminName")
        .value =
        name;

    }


    if ($("adminEmail")) {

      $("adminEmail")
        .value =
        email;

    }
  }


  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  async function saveProfile() {

    const name =
      $("adminName")
        .value
        .trim();


    if (!name) {

      toast(
        "Vui lòng nhập họ tên"
      );

      return;
    }


    const firebaseAuth =
      getAuth();


    if (!firebaseAuth) {

      toast(
        "Firebase Auth chưa sẵn sàng"
      );

      return;
    }


    const user =
      firebaseAuth.currentUser;


    if (!user) {

      toast(
        "Chưa có tài khoản đăng nhập"
      );

      return;
    }


    try {

      /*
       * Update Firebase Auth
       */

      await user.updateProfile({
        displayName: name
      });


      /*
       * Update Firestore users
       */

      const database =
        getFirestore();


      if (database) {

        await database
          .collection("users")
          .doc(user.uid)
          .set(
            {
              name: name,
              displayName: name,
              updatedAt:
                firebase.firestore.FieldValue.serverTimestamp()
            },
            {
              merge: true
            }
          );

      }


      setAdminUI(
        name,
        user.email || ""
      );


      toast(
        "Đã cập nhật thông tin Admin"
      );

    } catch (error) {

      console.error(
        "Save profile error:",
        error
      );


      toast(
        "Không thể cập nhật thông tin"
      );
    }
  }


  /* =======================================================
     FIREBASE STATUS
  ======================================================= */

  function checkFirebase() {

    const database =
      getFirestore();


    const firebaseAuth =
      getAuth();


    if (database) {

      $("firebaseStatus")
        .textContent =
        "Connected";

      $("connectionLabel")
        .textContent =
        "Firebase đã kết nối";

      $("connectionDot")
        .classList
        .add("live");

    } else {

      $("firebaseStatus")
        .textContent =
        "Disconnected";

      $("connectionLabel")
        .textContent =
        "Chưa tìm thấy Firebase config";

      $("connectionDot")
        .classList
        .remove("live");

    }


    if (firebaseAuth) {

      $("authStatus")
        .textContent =
        "Ready";

    } else {

      $("authStatus")
        .textContent =
        "Unavailable";

    }
  }


  /* =======================================================
     SESSION UI
  ======================================================= */

  function updateSessionUI(user) {

    if (!user) {

      $("sessionUid")
        .textContent =
        "—";

      $("sessionProvider")
        .textContent =
        "—";

      return;
    }


    $("sessionUid")
      .textContent =
      user.uid;


    const provider =
      user.providerData &&
      user.providerData.length
        ? user.providerData[0].providerId
        : "password";


    $("sessionProvider")
      .textContent =
      provider;
  }


  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {

    const firebaseAuth =
      getAuth();


    if (!firebaseAuth) {

      toast(
        "Firebase Auth chưa sẵn sàng"
      );

      return;
    }


    if (
      settings.confirmLogout
    ) {

      const confirmed =
        confirm(
          "Bạn có chắc muốn đăng xuất?"
        );


      if (!confirmed) {
        return;
      }

    }


    try {

      await firebaseAuth.signOut();


      toast(
        "Đã đăng xuất"
      );


      setTimeout(() => {

        window.location.href =
          "../login.html";

      }, 500);

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );


      toast(
        "Đăng xuất thất bại"
      );
    }
  }


  /* =======================================================
     NOTIFICATION
  ======================================================= */

  function showNotification() {

    if (
      settings.notifySystem
    ) {

      toast(
        "Không có thông báo mới"
      );

    } else {

      toast(
        "Thông báo hệ thống đang tắt"
      );

    }
  }


  /* =======================================================
     MOBILE MENU
  ======================================================= */

  function setupMobileMenu() {

    const menuBtn =
      $("menuBtn");

    const sidebar =
      $("sidebar");

    const backdrop =
      $("sidebarBackdrop");


    if (
      !menuBtn ||
      !sidebar
    ) {
      return;
    }


    menuBtn.addEventListener(
      "click",
      () => {

        sidebar.classList.toggle(
          "open"
        );


        if (backdrop) {

          backdrop.hidden =
            !sidebar.classList.contains(
              "open"
            );

        }

      }
    );


    if (backdrop) {

      backdrop.addEventListener(
        "click",
        () => {

          sidebar.classList.remove(
            "open"
          );

          backdrop.hidden = true;

        }
      );

    }
  }


  /* =======================================================
     SIDEBAR
  ======================================================= */

  function setupSidebar() {

    const navItems =
      document.querySelectorAll(
        ".nav-item[data-page]"
      );


    navItems.forEach(item => {

      item.addEventListener(
        "click",
        () => {

          const page =
            item.dataset.page;


          try {

            localStorage.setItem(
              "adminActivePage",
              page
            );

          } catch (error) {}

        }
      );

    });


    /*
     * Settings luôn active
     */

    navItems.forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.page === "settings"
      );

    });
  }


  /* =======================================================
     EVENTS
  ======================================================= */

  function setupEvents() {

    $("saveSettingsBtn")
      ?.addEventListener(
        "click",
        saveSettings
      );


    $("resetSettingsBtn")
      ?.addEventListener(
        "click",
        resetSettings
      );


    $("resetAllBtn")
      ?.addEventListener(
        "click",
        () => {

          renderSettings();

          toast(
            "Đã hủy các thay đổi chưa lưu"
          );

        }
      );


    $("saveProfileBtn")
      ?.addEventListener(
        "click",
        saveProfile
      );


    $("logoutBtn")
      ?.addEventListener(
        "click",
        logout
      );


    $("logoutSessionBtn")
      ?.addEventListener(
        "click",
        logout
      );


    $("noticeBtn")
      ?.addEventListener(
        "click",
        showNotification
      );


    $("interfaceSize")
      ?.addEventListener(
        "change",
        () => {

          settings.interfaceSize =
            $("interfaceSize").value;

          applyInterfaceSize();

        }
      );


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