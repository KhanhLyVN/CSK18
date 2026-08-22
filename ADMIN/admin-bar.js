(() => {
  'use strict';

  /* =========================================================
     ADMIN BAR
     Version: 2026-08-22-chat-fixed-final
     
     FIX:
     - Không còn chatSetTab undefined
     - Không còn chatRenderFriends undefined
     - Không còn chatOpen undefined
     - Không còn chatClose undefined
     - Không còn chatSendMessage undefined
     - Không tạo Messenger trùng
     - Hỗ trợ admin-bar.html được load vào #adminBar
     - Hỗ trợ HTML Messenger đã tồn tại
     - Không đăng ký event chat nhiều lần
     - Firebase Auth + Firestore realtime
  ========================================================= */

  const ADMINBAR_VERSION =
    '2026-08-22-chat-fixed-final';

  if (
    window.__adminbarLoadedVersion ===
    ADMINBAR_VERSION
  ) {
    console.warn(
      '[ADMIN BAR] Script đã được load.'
    );
    return;
  }

  window.__adminbarLoadedVersion =
    ADMINBAR_VERSION;


  /* =========================================================
     SELECTORS
  ========================================================= */

  const SELECTOR = {

    host:
      '#adminBar',

    sidebar:
      '#adminbarSidebar',

    sidebarBackdrop:
      '#adminbarSidebarBackdrop',

    menuButton:
      '#adminbarMenuBtn',

    logoutButton:
      '#adminbarSidebarLogoutBtn',

    topbar:
      '.adminbar-topbar',

    messengerButton:
      '#adminbarMessengerBtn',

    messengerPanel:
      '#adminbarMessengerPanel',

    messengerClose:
      '#adminbarMessengerCloseBtn',

    messengerBackdrop:
      '#adminbarMessengerBackdrop',

    noticeButton:
      '#adminbarNoticeBtn',

    noticePanel:
      '#adminbarNotificationPanel',

    markRead:
      '#adminbarMarkAllReadBtn',

    noticeBadge:
      '#adminbarNoticeBadge',

    noticeCount:
      '#adminbarNotificationCount',

    friendSearch:
      '#adminbarFriendSearch',

    friendList:
      '#adminbarFriendList',

    friendsView:
      '#adminbarFriendsView',

    groupsView:
      '#adminbarGroupsView',

    groupForm:
      '#adminbarGroupForm',

    groupName:
      '#adminbarGroupName',

    groupMembers:
      '#adminbarGroupMembers',

    messengerListView:
      '#adminbarMessengerListView',

    chatView:
      '#adminbarChatView',

    chatBack:
      '#adminbarChatBackBtn',

    chatAvatar:
      '#adminbarChatAvatar',

    chatName:
      '#adminbarChatName',

    chatRole:
      '#adminbarChatRole',

    chatMessages:
      '#adminbarChatMessages',

    chatForm:
      '#adminbarChatForm',

    chatInput:
      '#adminbarChatInput',

    messengerStatus:
      '#adminbarMessengerStatus',

    sidebarAvatar:
      '#adminbarSidebarAvatar',

    sidebarUserName:
      '#adminbarSidebarUserName',

    sidebarUserRole:
      '#adminbarSidebarUserRole',

    topAdminAvatar:
      '#adminbarTopAdminAvatar',

    accountCount:
      '#adminbarAccountCount'
  };


  /* =========================================================
     DOM HELPERS
  ========================================================= */

  function $(selector, root = document) {

    if (!root) {
      return null;
    }

    try {
      return root.querySelector(selector);
    } catch (error) {
      return null;
    }
  }


  function $$(selector, root = document) {

    if (!root) {
      return [];
    }

    try {
      return Array.from(
        root.querySelectorAll(selector)
      );
    } catch (error) {
      return [];
    }
  }


  /* =========================================================
     STATE
  ========================================================= */

  const state = {

    user: null,

    users: [],

    selectedUser: null,

    unsubscribeMessages: null,

    unsubscribeAuth: null,

    usersLoading: false,

    initialized: false,

    layoutInitialized: false,

    sidebarInitialized: false,

    panelsInitialized: false,

    chatInitialized: false,

    authInitialized: false,

    eventsInitialized: false
  };


  /* =========================================================
     FIREBASE
  ========================================================= */

  function getFirebase() {

    if (!window.firebase) {
      return null;
    }

    return window.firebase;
  }


  function getFirestore() {

    const firebase =
      getFirebase();

    if (
      !firebase ||
      typeof firebase.firestore !==
        'function'
    ) {
      return null;
    }

    try {

      return firebase.firestore();

    } catch (error) {

      console.error(
        '[ADMIN BAR] Firestore error:',
        error
      );

      return null;
    }
  }


  function getAuth() {

    const firebase =
      getFirebase();

    if (
      !firebase ||
      typeof firebase.auth !==
        'function'
    ) {
      return null;
    }

    try {

      return firebase.auth();

    } catch (error) {

      console.error(
        '[ADMIN BAR] Auth error:',
        error
      );

      return null;
    }
  }


  function serverTimestamp() {

    const firebase =
      getFirebase();

    try {

      if (
        firebase &&
        firebase.firestore &&
        firebase.firestore.FieldValue &&
        typeof firebase.firestore.FieldValue
          .serverTimestamp === 'function'
      ) {

        return firebase.firestore.FieldValue
          .serverTimestamp();
      }

    } catch (error) {

      console.warn(
        '[ADMIN BAR] serverTimestamp error:',
        error
      );
    }

    return new Date();
  }


  /* =========================================================
     HELPERS
  ========================================================= */

  function escapeHtml(value) {

    return String(
      value ?? ''
    ).replace(
      /[&<>"']/g,
      char => {

        const map = {

          '&': '&amp;',

          '<': '&lt;',

          '>': '&gt;',

          '"': '&quot;',

          "'": '&#039;'
        };

        return map[char];
      }
    );
  }


  function getName(user) {

    if (!user) {
      return 'Người dùng';
    }

    return String(

      user.displayName ||

      user.name ||

      user.fullName ||

      user.full_name ||

      user.username ||

      user.email ||

      'Người dùng'

    ).trim();
  }


  function getRole(user) {

    if (!user) {
      return 'Thành viên';
    }

    return String(

      user.role ||

      user.accountType ||

      user.account_type ||

      user.position ||

      'Thành viên'

    ).trim();
  }


  function getInitials(name) {

    const words =
      String(name || 'User')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!words.length) {
      return 'US';
    }

    return words
      .slice(-2)
      .map(
        word =>
          word.charAt(0)
      )
      .join('')
      .toUpperCase();
  }


  function getChatId(
    uid1,
    uid2
  ) {

    return [
      String(uid1),
      String(uid2)
    ]
      .sort()
      .join('__');
  }


  function setText(
    host,
    selector,
    value
  ) {

    const element =
      $(selector, host);

    if (element) {
      element.textContent =
        String(value ?? '');
    }
  }


  function setMessengerStatus(
    host,
    text
  ) {

    setText(
      host,
      SELECTOR.messengerStatus,
      text
    );
  }


  /* =========================================================
     FIND ADMIN BAR HOST
  ========================================================= */

  function getHost() {

    let host =
      $(SELECTOR.host);

    if (host) {
      return host;
    }

    /*
     * Nếu không có #adminBar nhưng HTML adminbar
     * đã được chèn trực tiếp vào body.
     */

    const messenger =
      $(SELECTOR.messengerButton);

    if (messenger) {

      host =
        messenger.closest(
          '#adminBar'
        );

      if (host) {
        return host;
      }

      /*
       * Không tìm thấy #adminBar.
       * Dùng document.body làm root.
       */

      return document.body;
    }

    return null;
  }


  /* =========================================================
     TEMPLATE URL
  ========================================================= */

  function getTemplateUrl() {

    const script =
      Array.from(
        document.scripts
      ).find(
        script =>
          /admin-bar\.js(?:$|\?)/i.test(
            script.src
          )
      );

    if (script?.src) {

      try {

        return new URL(
          'admin-bar.html',
          script.src
        ).href;

      } catch (error) {}
    }

    return '/ADMIN/admin-bar.html';
  }


  /* =========================================================
     LOAD ADMIN BAR HTML
  ========================================================= */

  async function loadAdminBarTemplate(
    host
  ) {

    /*
     * Nếu HTML đã tồn tại thì không fetch nữa.
     */

    const existingMessenger =
      $(SELECTOR.messengerButton);

    const existingSidebar =
      $(SELECTOR.sidebar);

    if (
      existingMessenger ||
      existingSidebar
    ) {

      console.log(
        '[ADMIN BAR] HTML đã tồn tại → không load lại.'
      );

      host.dataset.adminbarInstalled =
        'true';

      return true;
    }


    try {

      const response =
        await fetch(
          getTemplateUrl(),
          {
            cache: 'no-cache'
          }
        );

      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const html =
        await response.text();

      if (!html.trim()) {

        throw new Error(
          'admin-bar.html rỗng'
        );
      }

      host.innerHTML =
        html;

      host.dataset.adminbarInstalled =
        'true';

      console.log(
        '[ADMIN BAR] Đã tải admin-bar.html'
      );

      return true;

    } catch (error) {

      console.error(
        '[ADMIN BAR] Không tải được admin-bar.html:',
        error
      );

      /*
       * Không tạo HTML Messenger giả nữa.
       * Vì nếu HTML lỗi thì việc tự tạo panel
       * sẽ khiến cấu trúc DOM bị sai.
       */

      return false;
    }
  }


  /* =========================================================
     ENSURE MESSENGER
  ========================================================= */

  function ensureMessengerHTML(
    host
  ) {

    /*
     * Tìm panel trong host.
     */

    let panel =
      $(SELECTOR.messengerPanel);

    /*
     * Nếu có panel nhưng không nằm trong host,
     * vẫn dùng panel đó.
     */

    if (!panel) {

      const button =
        $(SELECTOR.messengerButton);

      if (!button) {

        console.error(
          '[ADMIN CHAT] Không tìm thấy #adminbarMessengerBtn'
        );

        return false;
      }

      /*
       * Tìm wrapper.
       */

      const wrapper =
        button.closest(
          '.adminbar-panel-wrap'
        );

      if (!wrapper) {

        console.error(
          '[ADMIN CHAT] Không tìm thấy .adminbar-panel-wrap'
        );

        return false;
      }

      /*
       * Tạo panel.
       */

      panel =
        document.createElement(
          'section'
        );

      panel.id =
        'adminbarMessengerPanel';

      panel.className =
        'adminbar-panel adminbar-messenger-panel';

      panel.hidden =
        true;

      wrapper.appendChild(
        panel
      );

      console.warn(
        '[ADMIN CHAT] Đã tự tạo #adminbarMessengerPanel.'
      );
    }


    /*
     * Kiểm tra HTML chat bên trong.
     */

    const hasFriendList =
      $(SELECTOR.friendList);

    const hasChatForm =
      $(SELECTOR.chatForm);

    if (
      hasFriendList &&
      hasChatForm
    ) {

      return true;
    }


    /*
     * Nếu panel tồn tại nhưng rỗng,
     * tạo UI đầy đủ.
     */

    panel.innerHTML = `

      <div
        id="adminbarMessengerListView"
        class="adminbar-messenger-view"
      >

        <div class="adminbar-panel-head">

          <div>

            <strong>
              Tin nhắn
            </strong>

            <small
              id="adminbarMessengerStatus"
            >
              Chọn người để bắt đầu trò chuyện
            </small>

          </div>

          <button
            id="adminbarMessengerCloseBtn"
            class="adminbar-close"
            type="button"
            aria-label="Đóng"
          >

            <span class="material-symbols-rounded">
              close
            </span>

          </button>

        </div>


        <div
          class="adminbar-tabs"
          role="tablist"
        >

          <button
            class="adminbar-tab is-active"
            type="button"
            data-messenger-tab="friends"
            role="tab"
          >

            <span class="material-symbols-rounded">
              person
            </span>

            Người dùng

          </button>


          <button
            class="adminbar-tab"
            type="button"
            data-messenger-tab="groups"
            role="tab"
          >

            <span class="material-symbols-rounded">
              group
            </span>

            Nhóm

          </button>

        </div>


        <div
          id="adminbarFriendsView"
          class="adminbar-panel-view"
        >

          <label class="adminbar-search">

            <span class="material-symbols-rounded">
              search
            </span>

            <input
              id="adminbarFriendSearch"
              type="search"
              placeholder="Tìm tên hoặc email..."
              autocomplete="off"
            >

          </label>


          <div
            id="adminbarFriendList"
            class="adminbar-list"
          >

            <p class="adminbar-state">
              Đang tải danh sách người dùng...
            </p>

          </div>

        </div>


        <div
          id="adminbarGroupsView"
          class="adminbar-panel-view"
          hidden
        >

          <form
            id="adminbarGroupForm"
          >

            <label class="adminbar-field">

              Tên nhóm

              <input
                id="adminbarGroupName"
                type="text"
                maxlength="80"
                required
                placeholder="Ví dụ: Nhóm CS"
              >

            </label>


            <p class="adminbar-field-title">
              Chọn thành viên
            </p>


            <div
              id="adminbarGroupMembers"
              class="adminbar-member-list"
            ></div>


            <button
              class="adminbar-primary-btn"
              type="submit"
            >

              <span class="material-symbols-rounded">
                group_add
              </span>

              Tạo nhóm

            </button>

          </form>

        </div>

      </div>


      <div
        id="adminbarChatView"
        class="adminbar-chat-view"
        hidden
      >

        <div class="adminbar-chat-head">

          <button
            id="adminbarChatBackBtn"
            class="adminbar-back-btn"
            type="button"
            aria-label="Quay lại"
          >

            <span class="material-symbols-rounded">
              arrow_back
            </span>

          </button>


          <span
            id="adminbarChatAvatar"
            class="adminbar-chat-avatar"
          >
            US
          </span>


          <div>

            <strong
              id="adminbarChatName"
            >
              Người dùng
            </strong>

            <small
              id="adminbarChatRole"
            >
              Thành viên
            </small>

          </div>

        </div>


        <div
          id="adminbarChatMessages"
          class="adminbar-chat-messages"
        >

          <p class="adminbar-state">
            Hãy gửi tin nhắn đầu tiên.
          </p>

        </div>


        <form
          id="adminbarChatForm"
          class="adminbar-chat-composer"
        >

          <textarea
            id="adminbarChatInput"
            rows="1"
            maxlength="2000"
            placeholder="Nhập tin nhắn..."
            required
          ></textarea>


          <button
            class="adminbar-send-btn"
            type="submit"
            aria-label="Gửi"
          >

            <span class="material-symbols-rounded">
              send
            </span>

          </button>

        </form>

      </div>

    `;

    return true;
  }


  /* =========================================================
     LAYOUT
  ========================================================= */

  function setupLayout(
    host
  ) {

    if (
      state.layoutInitialized
    ) {
      return;
    }

    state.layoutInitialized =
      true;


    const main =
      document.querySelector(
        '.main-content'
      );

    const sidebar =
      $(SELECTOR.sidebar);

    const backdrop =
      $(SELECTOR.sidebarBackdrop);

    const topbar =
      $(SELECTOR.topbar);


    /*
     * Sidebar
     */

    if (
      sidebar &&
      host &&
      sidebar.parentElement !== host
    ) {

      host.prepend(
        sidebar
      );
    }


    /*
     * Backdrop
     */

    if (
      backdrop &&
      host &&
      backdrop.parentElement !== host
    ) {

      host.appendChild(
        backdrop
      );
    }


    /*
     * Topbar
     */

    if (
      main &&
      topbar &&
      !main.contains(topbar)
    ) {

      main.prepend(
        topbar
      );
    }


    /*
     * Active page
     */

    const page =
      document.body.dataset.adminPage;

    if (!page) {
      return;
    }

    const active =
      document.querySelector(
        `[data-page="${CSS.escape(page)}"]`
      );

    if (active) {

      active.classList.add(
        'is-active'
      );

      active.setAttribute(
        'aria-current',
        'page'
      );
    }
  }


  /* =========================================================
     SIDEBAR
  ========================================================= */

  function setupSidebar() {

    if (
      state.sidebarInitialized
    ) {
      return;
    }

    state.sidebarInitialized =
      true;


    const sidebar =
      $(SELECTOR.sidebar);

    const backdrop =
      $(SELECTOR.sidebarBackdrop);

    const menu =
      $(SELECTOR.menuButton);


    function closeSidebar() {

      sidebar?.classList.remove(
        'is-open'
      );

      document.body.classList.remove(
        'adminbar-sidebar-open'
      );

      if (backdrop) {
        backdrop.hidden = true;
      }

      menu?.setAttribute(
        'aria-expanded',
        'false'
      );
    }


    function openSidebar() {

      sidebar?.classList.add(
        'is-open'
      );

      document.body.classList.add(
        'adminbar-sidebar-open'
      );

      if (backdrop) {
        backdrop.hidden = false;
      }

      menu?.setAttribute(
        'aria-expanded',
        'true'
      );
    }


    menu?.addEventListener(
      'click',
      event => {

        event.preventDefault();
        event.stopPropagation();

        const isOpen =
          sidebar?.classList.contains(
            'is-open'
          );

        if (isOpen) {
          closeSidebar();
        } else {
          openSidebar();
        }
      }
    );


    backdrop?.addEventListener(
      'click',
      closeSidebar
    );


    $$(SELECTOR.sidebar + ' a')
      .forEach(
        link => {

          link.addEventListener(
            'click',
            closeSidebar
          );
        }
      );


    window.addEventListener(
      'resize',
      () => {

        if (
          window.innerWidth > 780
        ) {

          closeSidebar();
        }

      },
      {
        passive: true
      }
    );
  }


  /* =========================================================
     LOGOUT
  ========================================================= */

  function setupLogout() {

    const button =
      $(SELECTOR.logoutButton);

    if (!button) {
      return;
    }

    if (
      button.dataset.bound === 'true'
    ) {
      return;
    }

    button.dataset.bound =
      'true';


    button.addEventListener(
      'click',
      async () => {

        button.disabled =
          true;

        try {

          const auth =
            getAuth();

          if (auth) {
            await auth.signOut();
          }

        } catch (error) {

          console.warn(
            '[ADMIN BAR] Logout error:',
            error
          );

        } finally {

          window.location.replace(
            '/CS/login/login.html'
          );
        }
      }
    );
  }


  /* =========================================================
     PANEL
  ========================================================= */

  function setupPanels() {

    if (
      state.panelsInitialized
    ) {
      return;
    }

    state.panelsInitialized =
      true;


    const messenger =
      $(SELECTOR.messengerPanel);

    const notice =
      $(SELECTOR.noticePanel);

    const messengerButton =
      $(SELECTOR.messengerButton);

    const noticeButton =
      $(SELECTOR.noticeButton);


    function closeMessenger() {

      if (messenger) {
        messenger.hidden =
          true;
      }

      messengerButton?.setAttribute(
        'aria-expanded',
        'false'
      );

      closeChat();
    }


    function closeNotice() {

      if (notice) {
        notice.hidden =
          true;
      }

      noticeButton?.setAttribute(
        'aria-expanded',
        'false'
      );
    }


    function closeAllPanels() {

      closeMessenger();
      closeNotice();
    }


    /*
     * Messenger
     */

    messengerButton?.addEventListener(
      'click',
      event => {

        event.preventDefault();
        event.stopPropagation();

        if (!messenger) {

          console.error(
            '[ADMIN CHAT] Không tìm thấy #adminbarMessengerPanel'
          );

          return;
        }

        const shouldOpen =
          messenger.hidden;

        closeNotice();

        if (shouldOpen) {

          messenger.hidden =
            false;

          messengerButton.setAttribute(
            'aria-expanded',
            'true'
          );

          openMessenger();

        } else {

          closeMessenger();
        }
      }
    );


    /*
     * Notice
     */

    noticeButton?.addEventListener(
      'click',
      event => {

        event.preventDefault();
        event.stopPropagation();

        if (!notice) {
          return;
        }

        const shouldOpen =
          notice.hidden;

        closeMessenger();

        if (shouldOpen) {

          notice.hidden =
            false;

          noticeButton.setAttribute(
            'aria-expanded',
            'true'
          );

        } else {

          closeNotice();
        }
      }
    );


    /*
     * Close messenger
     */

    document.addEventListener(
      'click',
      event => {

        const target =
          event.target;

        if (
          target instanceof Element &&
          target.closest(
            '#adminbarMessengerCloseBtn'
          )
        ) {

          closeMessenger();
          return;
        }


        if (
          target instanceof Element &&
          target.closest(
            '#adminbarNoticeBtn'
          )
        ) {
          return;
        }


        if (
          target instanceof Element &&
          target.closest(
            '#adminbarMessengerBtn'
          )
        ) {
          return;
        }


        if (
          target instanceof Element &&
          target.closest(
            '.adminbar-panel-wrap'
          )
        ) {
          return;
        }


        closeAllPanels();
      }
    );


    /*
     * Mark notification read
     */

    $(SELECTOR.markRead)
      ?.addEventListener(
        'click',
        () => {

          const badge =
            $(SELECTOR.noticeBadge);

          const count =
            $(SELECTOR.noticeCount);

          if (badge) {
            badge.hidden =
              true;
          }

          if (count) {

            count.textContent =
              'Không có thông báo mới';
          }
        }
      );
  }


  /* =========================================================
     IDENTITY
  ========================================================= */

  async function updateIdentity(
    user
  ) {

    if (!user) {
      return;
    }


    const name =
      getName(user);


    setText(
      document,
      SELECTOR.sidebarUserName,
      name
    );


    setText(
      document,
      SELECTOR.sidebarAvatar,
      getInitials(name)
    );


    setText(
      document,
      SELECTOR.topAdminAvatar,
      getInitials(name)
    );


    const firestore =
      getFirestore();

    if (!firestore) {
      return;
    }


    try {

      const snapshot =
        await firestore
          .collection('users')
          .doc(user.uid)
          .get();


      const profile =
        snapshot.exists
          ? snapshot.data() || {}
          : {};


      setText(
        document,
        SELECTOR.sidebarUserName,
        profile.name ||
        profile.fullName ||
        profile.displayName ||
        name
      );


      setText(
        document,
        SELECTOR.sidebarUserRole,
        profile.role ||
        profile.accountType ||
        'System Admin'
      );


    } catch (error) {

      console.warn(
        '[ADMIN BAR] Không đọc được profile:',
        error
      );
    }
  }


  /* =========================================================
     ACCOUNT COUNT
  ========================================================= */

  async function loadAccountCount() {

    const badge =
      $(SELECTOR.accountCount);

    const firestore =
      getFirestore();

    if (
      !badge ||
      !firestore
    ) {
      return;
    }


    try {

      const snapshot =
        await firestore
          .collection('users')
          .get();


      const excluded =
        new Set([

          'student',

          'hocvien',

          'học_viên',

          'admin',

          'administrator'
        ]);


      const csRoles =
        new Set([

          'cs',

          'customer_success',

          'manager',

          'cs_manager',

          'cs_leader',

          'leader'
        ]);


      const count =
        snapshot.docs.filter(
          doc => {

            const data =
              doc.data() || {};


            const role =
              String(
                data.role ||
                data.accountType ||
                ''
              )
                .trim()
                .toLowerCase()
                .replace(
                  /[- ]/g,
                  '_'
                );


            return (
              !excluded.has(role) &&
              (
                csRoles.has(role) ||
                !role
              )
            );
          }
        ).length;


      badge.textContent =
        String(count);

      badge.hidden =
        false;


    } catch (error) {

      console.warn(
        '[ADMIN BAR] Không thể đếm CS:',
        error
      );
    }
  }


  /* =========================================================
     CHAT - LOAD USERS
  ========================================================= */

  async function loadChatUsers() {

    const list =
      $(SELECTOR.friendList);

    const firestore =
      getFirestore();

    const currentUser =
      state.user;


    if (!list) {

      console.error(
        '[ADMIN CHAT] Không tìm thấy #adminbarFriendList'
      );

      return;
    }


    if (!currentUser) {

      list.innerHTML = `
        <p class="adminbar-state">
          Chưa đăng nhập.
        </p>
      `;

      return;
    }


    if (!firestore) {

      list.innerHTML = `
        <p class="adminbar-state">
          Firebase chưa sẵn sàng.
        </p>
      `;

      return;
    }


    if (state.usersLoading) {
      return;
    }


    state.usersLoading =
      true;


    list.innerHTML = `
      <p class="adminbar-state">
        Đang tải danh sách người dùng...
      </p>
    `;


    try {

      const snapshot =
        await firestore
          .collection('users')
          .get();


      state.users =
        snapshot.docs
          .map(
            doc => ({
              uid: doc.data().uid || doc.id,
              ...doc.data()
            })
          )
          .filter(
            user =>
              user.uid !==
              currentUser.uid
          )
          .sort(
            (a, b) =>
              getName(a).localeCompare(
                getName(b),
                'vi'
              )
          );


      renderFriends();

      renderGroupMembers();


    } catch (error) {

      console.error(
        '[ADMIN CHAT] LOAD USERS ERROR:',
        error
      );


      list.innerHTML = `
        <p class="adminbar-state">
          Không tải được danh sách người dùng.
        </p>
      `;


    } finally {

      state.usersLoading =
        false;
    }
  }


  /* =========================================================
     RENDER FRIENDS
  ========================================================= */

  function renderFriends() {

    const list =
      $(SELECTOR.friendList);

    if (!list) {
      return;
    }


    const searchInput =
      $(SELECTOR.friendSearch);


    const search =
      String(
        searchInput?.value || ''
      )
        .trim()
        .toLocaleLowerCase('vi');


    const users =
      state.users.filter(
        user => {

          const content =
            `
              ${getName(user)}
              ${user.email || ''}
              ${getRole(user)}
            `
              .toLocaleLowerCase('vi');


          return content.includes(
            search
          );
        }
      );


    if (!users.length) {

      list.innerHTML = `
        <p class="adminbar-state">
          Không tìm thấy người dùng.
        </p>
      `;

      return;
    }


    list.innerHTML =
      users
        .map(
          user => `

            <div
              class="adminbar-friend-row"
            >

              <span
                class="adminbar-chat-avatar"
              >
                ${escapeHtml(
                  getInitials(
                    getName(user)
                  )
                )}
              </span>


              <span
                class="adminbar-friend-info"
              >

                <strong>
                  ${escapeHtml(
                    getName(user)
                  )}
                </strong>


                <small>

                  ${escapeHtml(
                    getRole(user)
                  )}

                  ${
                    user.email
                      ? `
                        ·
                        ${escapeHtml(
                          user.email
                        )}
                      `
                      : ''
                  }

                </small>

              </span>


              <div
                class="adminbar-friend-actions"
              >

                <button
                  type="button"
                  class="adminbar-message-btn"
                  data-chat="${escapeHtml(
                    user.uid
                  )}"
                  title="Nhắn tin"
                >

                  <span
                    class="material-symbols-rounded"
                  >
                    chat
                  </span>

                </button>

              </div>

            </div>
          `
        )
        .join('');
  }


  /* =========================================================
     GROUP MEMBERS
  ========================================================= */

  function renderGroupMembers() {

    const list =
      $(SELECTOR.groupMembers);

    if (!list) {
      return;
    }


    if (!state.users.length) {

      list.innerHTML = `
        <p class="adminbar-state">
          Chưa có người dùng khác.
        </p>
      `;

      return;
    }


    list.innerHTML =
      state.users
        .map(
          user => `

            <label
              class="adminbar-member-check"
            >

              <input
                type="checkbox"
                value="${escapeHtml(
                  user.uid
                )}"
              >


              <span
                class="adminbar-chat-avatar"
              >
                ${escapeHtml(
                  getInitials(
                    getName(user)
                  )
                )}
              </span>


              <span>
                ${escapeHtml(
                  getName(user)
                )}
              </span>

            </label>

          `
        )
        .join('');
  }


  /* =========================================================
     SET CHAT TAB
  ========================================================= */

  function setChatTab(
    tab
  ) {

    const friends =
      $(SELECTOR.friendsView);

    const groups =
      $(SELECTOR.groupsView);

    const listView =
      $(SELECTOR.messengerListView);

    const chatView =
      $(SELECTOR.chatView);


    if (listView) {
      listView.hidden =
        false;
    }


    if (chatView) {
      chatView.hidden =
        true;
    }


    const isFriends =
      tab === 'friends';


    if (friends) {
      friends.hidden =
        !isFriends;
    }


    if (groups) {
      groups.hidden =
        isFriends;
    }


    $$('[data-messenger-tab]')
      .forEach(
        button => {

          button.classList.toggle(
            'is-active',
            button.dataset
              .messengerTab === tab
          );
        }
      );


    if (!isFriends) {
      renderGroupMembers();
    }
  }


  /* =========================================================
     OPEN CHAT - hỗ trợ room ID mới và room ID cũ
  ========================================================= */

  async function openChat(uid) {
    const currentUser = state.user;
    const firestore = getFirestore();

    if (!currentUser || !firestore) {
      console.warn('[ADMIN CHAT] Firebase hoặc tài khoản chưa sẵn sàng.');
      return;
    }

    const target = state.users.find(
      user => String(user.uid) === String(uid)
    );

    if (!target) {
      console.error('[ADMIN CHAT] Không tìm thấy user:', uid);
      return;
    }

    if (state.unsubscribeMessages) {
      state.unsubscribeMessages();
      state.unsubscribeMessages = null;
    }

    state.selectedUser = target;

    const listView = $(SELECTOR.messengerListView);
    const chatView = $(SELECTOR.chatView);
    const messages = $(SELECTOR.chatMessages);

    if (!listView || !chatView || !messages) {
      console.error('[ADMIN CHAT] Thiếu HTML chat.');
      return;
    }

    listView.hidden = true;
    chatView.hidden = false;

    const name = getName(target);
    setText(document, SELECTOR.chatName, name);
    setText(document, SELECTOR.chatRole, getRole(target));
    setText(document, SELECTOR.chatAvatar, getInitials(name));
    setMessengerStatus(document, `Đang trò chuyện với ${name}`);
    messages.innerHTML = '<p class="adminbar-state">Đang tải tin nhắn...</p>';

    const roomIds = Array.from(new Set([
      getChatId(currentUser.uid, target.uid),
      [String(currentUser.uid), String(target.uid)].sort().join('_')
    ]));

    console.log('[ADMIN CHAT] OPEN rooms:', roomIds);

    const messageMap = new Map();
    const unsubscribers = [];

    const renderAllMessages = () => {
      const rows = Array.from(messageMap.values()).sort((a, b) => {
        const timeA = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : a.createdAt?.seconds
            ? a.createdAt.seconds * 1000
            : 0;
        const timeB = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : b.createdAt?.seconds
            ? b.createdAt.seconds * 1000
            : 0;
        return timeA - timeB;
      });

      messages.innerHTML = '';

      if (!rows.length) {
        messages.innerHTML = '<p class="adminbar-state">Hãy gửi tin nhắn đầu tiên.</p>';
        return;
      }

      rows.forEach(data => {
        const bubble = document.createElement('div');
        bubble.className = 'adminbar-chat-bubble';

        const senderId = data.from || data.senderId || data.senderUID || '';
        if (String(senderId) === String(currentUser.uid)) {
          bubble.classList.add('is-mine');
        }

        bubble.textContent = data.text || data.message || '';
        messages.appendChild(bubble);
      });

      messages.scrollTop = messages.scrollHeight;
    };

    roomIds.forEach(roomId => {
      const query = firestore
        .collection('chats')
        .doc(roomId)
        .collection('messages')
        .orderBy('createdAt', 'asc');

      const unsubscribe = query.onSnapshot(
        snapshot => {
          snapshot.forEach(doc => {
            messageMap.set(`${roomId}/${doc.id}`, doc.data() || {});
          });
          renderAllMessages();
        },
        error => {
          console.error('[ADMIN CHAT] SNAPSHOT ERROR:', roomId, error);

          // Một số dữ liệu cũ có thể thiếu createdAt; thử đọc không orderBy.
          firestore
            .collection('chats')
            .doc(roomId)
            .collection('messages')
            .get()
            .then(snapshot => {
              snapshot.forEach(doc => {
                messageMap.set(`${roomId}/${doc.id}`, doc.data() || {});
              });
              renderAllMessages();
            })
            .catch(fallbackError => {
              console.error('[ADMIN CHAT] MESSAGE FALLBACK ERROR:', fallbackError);
              if (!messageMap.size) {
                messages.innerHTML = '<p class="adminbar-state">Không tải được tin nhắn.</p>';
              }
            });
        }
      );

      unsubscribers.push(unsubscribe);
    });

    state.unsubscribeMessages = () => {
      unsubscribers.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('[ADMIN CHAT] Không thể hủy listener:', error);
        }
      });
    };
  }


  /* =========================================================
     SEND MESSAGE - gửi vào room đang tồn tại nếu có
  ========================================================= */

  async function sendMessage(event) {
    event.preventDefault();

    const currentUser = state.user;
    const target = state.selectedUser;
    const firestore = getFirestore();
    const input = $(SELECTOR.chatInput);
    const text = input?.value.trim() || '';

    if (!currentUser || !target || !firestore || !text) return;

    input.disabled = true;

    try {
      const candidateIds = Array.from(new Set([
        getChatId(currentUser.uid, target.uid),
        [String(currentUser.uid), String(target.uid)].sort().join('_')
      ]));

      let chatId = candidateIds[0];

      for (const candidateId of candidateIds) {
        const roomSnapshot = await firestore
          .collection('chats')
          .doc(candidateId)
          .get();

        if (roomSnapshot.exists) {
          chatId = candidateId;
          break;
        }
      }

      const chatRef = firestore.collection('chats').doc(chatId);
      const timestamp = serverTimestamp();

      await chatRef.set({
        participants: [currentUser.uid, target.uid],
        participantNames: {
          [currentUser.uid]: getName(currentUser),
          [target.uid]: getName(target)
        },
        lastMessage: text,
        lastMessageBy: currentUser.uid,
        updatedAt: timestamp
      }, { merge: true });

      await chatRef.collection('messages').add({
        from: currentUser.uid,
        to: target.uid,
        senderId: currentUser.uid,
        receiverId: target.uid,
        text,
        createdAt: timestamp,
        read: false
      });

      input.value = '';
      input.focus();
    } catch (error) {
      console.error('[ADMIN CHAT] SEND ERROR:', error);
      setMessengerStatus(document, 'Không gửi được tin nhắn.');
    } finally {
      input.disabled = false;
    }
  }


  /* =========================================================
     CLOSE CHAT
  ========================================================= */

  function closeChat() {

    if (
      state.unsubscribeMessages
    ) {

      state.unsubscribeMessages();

      state.unsubscribeMessages =
        null;
    }


    state.selectedUser =
      null;


    const listView =
      $(SELECTOR.messengerListView);

    const chatView =
      $(SELECTOR.chatView);


    if (listView) {

      listView.hidden =
        false;
    }


    if (chatView) {

      chatView.hidden =
        true;
    }


    setMessengerStatus(
      document,
      'Chọn người để bắt đầu trò chuyện'
    );
  }


  /* =========================================================
     OPEN MESSENGER
  ========================================================= */

  async function openMessenger() {

    const panel =
      $(SELECTOR.messengerPanel);


    if (!panel) {

      console.error(
        '[ADMIN CHAT] Không tìm thấy #adminbarMessengerPanel'
      );

      return;
    }


    /*
     * Luôn đảm bảo HTML tồn tại.
     */

    const host =
      getHost();


    if (host) {

      ensureMessengerHTML(
        host
      );
    }


    panel.hidden =
      false;


    setChatTab(
      'friends'
    );


    await loadChatUsers();


    setTimeout(
      () => {

        $(SELECTOR.friendSearch)
          ?.focus();

      },
      50
    );
  }


  /* =========================================================
     GROUP CREATION
  ========================================================= */

  async function createGroup(
    event
  ) {

    event.preventDefault();


    const firestore =
      getFirestore();

    const currentUser =
      state.user;


    const nameInput =
      $(SELECTOR.groupName);


    const memberList =
      $(SELECTOR.groupMembers);


    if (
      !firestore ||
      !currentUser ||
      !nameInput ||
      !memberList
    ) {

      return;
    }


    const groupName =
      nameInput.value.trim();


    const selected =
      $$(
        'input[type="checkbox"]:checked',
        memberList
      )
        .map(
          input =>
            input.value
        );


    if (!groupName) {

      return;
    }


    const participants =
      Array.from(
        new Set([
          currentUser.uid,
          ...selected
        ])
      );


    try {

      const groupRef =
        await firestore
          .collection('chatGroups')
          .add({

            name:
              groupName,

            participants,

            createdBy:
              currentUser.uid,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()
          });


      console.log(
        '[ADMIN CHAT] Group created:',
        groupRef.id
      );


      nameInput.value =
        '';


      $$(
        'input[type="checkbox"]',
        memberList
      ).forEach(
        input => {
          input.checked =
            false;
        }
      );


      setMessengerStatus(
        document,
        'Đã tạo nhóm thành công.'
      );


    } catch (error) {

      console.error(
        '[ADMIN CHAT] CREATE GROUP ERROR:',
        error
      );


      setMessengerStatus(
        document,
        'Không thể tạo nhóm.'
      );
    }
  }


  /* =========================================================
     UNREAD INCOMING MESSAGE BADGE
  ========================================================= */

  let unsubscribeUnreadRooms = null;
  let unreadMessageListeners = [];

  function setMessengerUnreadBadge(count) {
    const badge = document.querySelector('#adminbarMessengerBadge');
    if (!badge) return;

    const total = Math.max(0, Number(count) || 0);
    badge.textContent = total > 99 ? '99+' : String(total);
    badge.hidden = total === 0;
    badge.title = total
      ? `${total} tin nhắn chưa đọc`
      : 'Không có tin nhắn chưa đọc';
  }

  function stopUnreadListeners() {
    if (unsubscribeUnreadRooms) {
      unsubscribeUnreadRooms();
      unsubscribeUnreadRooms = null;
    }

    unreadMessageListeners.forEach(unsubscribe => {
      try { unsubscribe(); } catch (_) {}
    });
    unreadMessageListeners = [];
  }

  function bindUnreadMessageBadge(user) {
    stopUnreadListeners();
    setMessengerUnreadBadge(0);

    const firestore = getFirestore();
    const uid = user?.uid;
    if (!firestore || !uid) return;

    unsubscribeUnreadRooms = firestore
      .collection('chats')
      .where('participants', 'array-contains', uid)
      .limit(100)
      .onSnapshot(
        roomsSnapshot => {
          unreadMessageListeners.forEach(unsubscribe => {
            try { unsubscribe(); } catch (_) {}
          });
          unreadMessageListeners = [];

          const counts = new Map();
          const updateBadge = () => {
            let total = 0;
            counts.forEach(count => { total += count; });
            setMessengerUnreadBadge(total);
          };

          if (!roomsSnapshot.size) {
            updateBadge();
            return;
          }

          roomsSnapshot.forEach(roomDoc => {
            const roomData = roomDoc.data() || {};
            const messagesRef = roomDoc.ref.collection('messages');

            const unsubscribe = messagesRef.onSnapshot(
              messagesSnapshot => {
                let count = 0;

                messagesSnapshot.forEach(messageDoc => {
                  const data = messageDoc.data() || {};
                  const receiverId =
                    data.to || data.receiverId || data.recipientId || '';
                  const senderId =
                    data.from || data.senderId || data.senderUID || '';

                  if (
                    String(receiverId) === String(uid) &&
                    String(senderId) !== String(uid) &&
                    data.read !== true
                  ) {
                    count += 1;
                  }
                });

                /* Hỗ trợ dữ liệu cũ chỉ lưu trạng thái ở chat room. */
                if (
                  count === 0 &&
                  roomData.lastMessageBy &&
                  String(roomData.lastMessageBy) !== String(uid) &&
                  String(roomData.lastMessageReadBy || '') !== String(uid)
                ) {
                  count = 1;
                }

                counts.set(roomDoc.id, count);
                updateBadge();
              },
              error => {
                console.warn(
                  '[ADMIN CHAT] Không thể đếm tin chưa đọc:',
                  roomDoc.id,
                  error
                );
                counts.set(roomDoc.id, 0);
                updateBadge();
              }
            );

            unreadMessageListeners.push(unsubscribe);
          });
        },
        error => {
          console.warn('[ADMIN CHAT] Không đồng bộ được badge:', error);
          setMessengerUnreadBadge(0);
        }
      );
  }

  /* =========================================================
     CHAT EVENTS
  ========================================================= */

  function setupChat() {

    if (
      state.chatInitialized
    ) {
      return true;
    }


    const panel =
      $(SELECTOR.messengerPanel);

    const button =
      $(SELECTOR.messengerButton);


    /*
     * Đây là check quan trọng.
     */

    if (!panel) {

      console.error(
        '[ADMIN CHAT] Không tìm thấy #adminbarMessengerPanel'
      );

      return false;
    }


    if (!button) {

      console.error(
        '[ADMIN CHAT] Không tìm thấy #adminbarMessengerBtn'
      );

      return false;
    }


    /*
     * Friends tab
     */

    $$(
      '[data-messenger-tab]'
    ).forEach(
      tabButton => {

        tabButton.addEventListener(
          'click',
          event => {

            event.preventDefault();
            event.stopPropagation();

            setChatTab(
              tabButton.dataset
                .messengerTab
            );
          }
        );
      }
    );


    /*
     * Search
     */

    $(SELECTOR.friendSearch)
      ?.addEventListener(
        'input',
        () => {

          renderFriends();
        }
      );


    /*
     * Click user
     */

    $(SELECTOR.friendList)
      ?.addEventListener(
        'click',
        event => {

          const target =
            event.target.closest(
              '[data-chat]'
            );


          if (!target) {
            return;
          }


          event.preventDefault();


          openChat(
            target.dataset.chat
          );
        }
      );


    /*
     * Back
     */

    $(SELECTOR.chatBack)
      ?.addEventListener(
        'click',
        event => {

          event.preventDefault();

          closeChat();
        }
      );


    /*
     * Send
     */

    $(SELECTOR.chatForm)
      ?.addEventListener(
        'submit',
        event => {

          sendMessage(
            event
          );
        }
      );


    /*
     * Enter
     */

    $(SELECTOR.chatInput)
      ?.addEventListener(
        'keydown',
        event => {

          if (
            event.key === 'Enter' &&
            !event.shiftKey
          ) {

            event.preventDefault();


            $(SELECTOR.chatForm)
              ?.requestSubmit();
          }
        }
      );


    /*
     * Close button
     */

    $(SELECTOR.messengerClose)
      ?.addEventListener(
        'click',
        event => {

          event.preventDefault();
          event.stopPropagation();


          panel.hidden =
            true;


          button.setAttribute(
            'aria-expanded',
            'false'
          );


          closeChat();
        }
      );


    /*
     * Group form
     */

    $(SELECTOR.groupForm)
      ?.addEventListener(
        'submit',
        createGroup
      );


    state.chatInitialized =
      true;


    console.log(
      '[ADMIN CHAT] Chat events đã sẵn sàng.'
    );


    return true;
  }


  /* =========================================================
     AUTH
  ========================================================= */

  function initAuth() {

    if (
      state.authInitialized
    ) {
      return;
    }


    const auth =
      getAuth();


    if (!auth) {

      console.warn(
        '[ADMIN BAR] Firebase Auth chưa sẵn sàng.'
      );

      /*
       * Firebase có thể load chậm.
       * Thử lại sau.
       */

      setTimeout(
        initAuth,
        500
      );

      return;
    }


    state.authInitialized =
      true;


    state.unsubscribeAuth =
      auth.onAuthStateChanged(
        async user => {

          state.user =
            user || null;


          /*
           * Cleanup chat cũ.
           */

          if (
            state.unsubscribeMessages
          ) {

            state.unsubscribeMessages();

            state.unsubscribeMessages =
              null;
          }


          state.users =
            [];


          state.selectedUser =
            null;


          console.log(
            '[ADMIN BAR] Current user:',
            user?.uid || 'NONE'
          );


          if (!user) {

            return;
          }


          await updateIdentity(
            user
          );


          await loadAccountCount();

          bindUnreadMessageBadge(user);
        }
      );
  }


  /* =========================================================
     FIREBASE WAIT
  ========================================================= */

  function waitForFirebase(
    callback,
    attempts = 0
  ) {

    if (
      getFirebase() &&
      getAuth() &&
      getFirestore()
    ) {

      callback();

      return;
    }


    if (attempts >= 30) {

      console.warn(
        '[ADMIN BAR] Firebase chưa sẵn sàng sau 15 giây.'
      );

      return;
    }


    setTimeout(
      () => {

        waitForFirebase(
          callback,
          attempts + 1
        );

      },
      500
    );
  }


  /* =========================================================
     INIT
  ========================================================= */

  async function initAdminBar() {

    if (
      state.initialized
    ) {

      console.log(
        '[ADMIN BAR] Đã init trước đó.'
      );

      return;
    }


    let host =
      getHost();


    if (!host) {

      console.warn(
        '[ADMIN BAR] Không tìm thấy #adminBar.'
      );

      return;
    }


    /*
     * Load HTML nếu cần.
     */

    if (
      host.dataset.adminbarInstalled !==
      'true'
    ) {

      await loadAdminBarTemplate(
        host
      );
    }


    /*
     * Sau khi load phải tìm lại.
     */

    host =
      getHost();


    /*
     * QUAN TRỌNG:
     * Messenger phải được đảm bảo TRƯỚC setup.
     */

    const messengerReady =
      ensureMessengerHTML(
        host
      );


    if (!messengerReady) {

      console.error(
        '[ADMIN CHAT] Messenger HTML chưa sẵn sàng.'
      );

      /*
       * Không gọi setupChat nữa nếu HTML chưa có.
       */

      return;
    }


    /*
     * Layout
     */

    setupLayout(
      host
    );


    /*
     * Sidebar
     */

    setupSidebar();


    /*
     * Logout
     */

    setupLogout();


    /*
     * Panels
     */

    setupPanels();


    /*
     * Chat
     */

    const chatReady =
      setupChat();


    if (!chatReady) {

      console.error(
        '[ADMIN CHAT] setupChat thất bại.'
      );

      return;
    }


    /*
     * Auth
     */

    waitForFirebase(
      initAuth
    );


    state.initialized =
      true;


    document.dispatchEvent(
      new CustomEvent(
        'adminbar:ready'
      )
    );


    console.log(
      '[ADMIN BAR] Đã khởi tạo thành công.'
    );
  }


  /* =========================================================
     START
  ========================================================= */

  function start() {

    const host =
      getHost();


    if (host) {

      initAdminBar();

      return;
    }


    /*
     * Theo dõi #adminBar được thêm
     * sau bởi loader.
     */

    const observer =
      new MutationObserver(
        () => {

          const target =
            getHost();


          if (!target) {
            return;
          }


          observer.disconnect();


          initAdminBar();
        }
      );


    observer.observe(
      document.documentElement,
      {
        childList: true,
        subtree: true
      }
    );


    /*
     * Fallback retry.
     */

    let retries =
      0;


    const timer =
      setInterval(
        () => {

          retries++;


          const target =
            getHost();


          if (target) {

            clearInterval(
              timer
            );


            observer.disconnect();


            initAdminBar();


            return;
          }


          if (
            retries >= 20
          ) {

            clearInterval(
              timer
            );


            observer.disconnect();


            console.warn(
              '[ADMIN BAR] Không tìm thấy #adminBar sau khi chờ.'
            );
          }

        },
        500
      );
  }


  /* =========================================================
     DOM READY
  ========================================================= */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      start,
      {
        once: true
      }
    );

  } else {

    start();
  }

})();