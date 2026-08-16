(() => {
  const host = document.getElementById('sharedSidebar');
  if (!host) return;
  /* =========================================================
     XÁC ĐỊNH TRANG HIỆN TẠI
  ========================================================= */
  const page =
    document.body.dataset.adminPage ||
    ({
      '/ADMIN/homepage-ad.html': 'overview',
      '/ADMIN/accounts.html': 'accounts',
      '/ADMIN/addAccount.html': 'add-cs',
      '/ADMIN/add-cs.html': 'add-cs',
      '/ADMIN/activity-report.html': 'reports',
      '/ADMIN/settings.html': 'settings',
      '/ADMIN/system-log.html': 'logs'
    })[
      window.location.pathname
    ] ||
    '';
  /* =========================================================
     INSTALL SIDEBAR
  ========================================================= */
  const install = (markup) => {
    host.innerHTML = markup;
    /* =======================================================
       ACTIVE MENU
    ======================================================= */
    const active =
      host.querySelector(
        `[data-page="${page}"]`
      );
    if (active) {
      active.classList.add('active');
    }
    /* =======================================================
       MOBILE MENU
    ======================================================= */
    const menuBtn =
      document.getElementById('menuBtn');
    const sidebar =
      document.getElementById('adminSidebar');
    const backdrop =
      document.getElementById(
        'adminSidebarBackdrop'
      );
    const close = () => {
      sidebar?.classList.remove('open');
      if (backdrop) {
        backdrop.hidden = true;
        backdrop.classList.remove('open');
      }
    };
    menuBtn?.addEventListener(
      'click',
      () => {
        sidebar?.classList.toggle('open');
        const isOpen =
          sidebar?.classList.contains('open');
        if (backdrop) {
          backdrop.hidden = !isOpen;
          backdrop.classList.toggle(
            'open',
            isOpen
          );
        }
      }
    );
    backdrop?.addEventListener(
      'click',
      close
    );
    /* =======================================================
       LOGOUT
       → Đăng xuất Firebase
       → Chuyển về trang login
    ======================================================= */
    const logoutBtn =
      document.getElementById(
        'sidebarLogoutBtn'
      );
    logoutBtn?.addEventListener(
      'click',
      async () => {
        try {
          logoutBtn.disabled = true;
          /* -----------------------------------------------
             FIREBASE AUTH
          ----------------------------------------------- */
          if (
            typeof firebase !== 'undefined' &&
            firebase.apps &&
            firebase.apps.length
          ) {
            await firebase
              .auth()
              .signOut();
          }
        } catch (error) {
          console.error(
            'Lỗi đăng xuất Firebase:',
            error
          );
        } finally {
          /* -----------------------------------------------
             LUÔN QUAY VỀ LOGIN
          ----------------------------------------------- */
          window.location.replace(
            '/CS/login/login.html'
          );
        }
      }
    );
    /* =======================================================
       SIDEBAR READY
    ======================================================= */
    document.dispatchEvent(
      new CustomEvent(
        'adminSidebarReady'
      )
    );
  };
  /* =========================================================
     LOAD SIDEBAR
     Synchronous loading keeps #adminSidebar available
     before page-specific scripts run.
  ========================================================= */
  try {
    const request =
      new XMLHttpRequest();
    request.open(
      'GET',
      new URL(
        'sidebar.html',
        document.baseURI
      ),
      false
    );
    request.send(null);
    if (
      request.status === 200 ||
      request.status === 0
    ) {
      install(
        request.responseText
      );
      return;
    }
  } catch (error) {
    console.warn(
      'Không thể nạp sidebar dùng chung.',
      error
    );
  }
  /* =========================================================
     FALLBACK FETCH
  ========================================================= */
  fetch('sidebar.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }
      return response.text();
    })
    .then(install)
    .catch(error => {
      console.error(
        'Không thể tải sidebar.html:',
        error
      );
    });
})();