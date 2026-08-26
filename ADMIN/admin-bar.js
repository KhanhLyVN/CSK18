(() => {
  'use strict';
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
    groupList:
      '#adminbarGroupList',
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
    contactIds: new Set(),
    chatGroups: [],
    selectedUser: null,
    selectedGroup: null,
    chatMode: 'direct',
    unsubscribeMessages: null,
    unsubscribeAuth: null,
    usersLoading: false,
    initialized: false,
    layoutInitialized: false,
    sidebarInitialized: false,
    panelsInitialized: false,
    chatInitialized: false,
    authInitialized: false,
    eventsInitialized: false,
    showAllFriends: false,
    showGroupComposer: false,
    unreadByUser: {}
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
  function valueContainsUid(value, uid) {
    const normalizedUid = String(uid || '');
    if (!normalizedUid) return false;
    if (Array.isArray(value)) return value.map(String).includes(normalizedUid);
    if (value && typeof value === 'object') return Object.keys(value).map(String).includes(normalizedUid);
    return String(value || '') === normalizedUid;
  }
  /* Contract chat trực tiếp dùng chung với navbar.js của Customer Success. */
  function directMessageSender(message) {
    return String(message?.senderId || message?.senderUID || message?.senderUid || message?.from || message?.uid || '');
  }
  function directMessageReceiver(message) {
    return String(message?.receiverId || message?.receiverUID || message?.recipientId || message?.to || '');
  }
  function directMessageText(message) {
    return String(message?.text ?? message?.message ?? message?.content ?? message?.body ?? '');
  }
  function makeDirectMessage({ senderId, senderName, senderEmail, receiverId, receiverName, text, timestamp }) {
    return {
      from: String(senderId),
      to: String(receiverId),
      senderId: String(senderId),
      senderUID: String(senderId),
      senderUid: String(senderId),
      senderName: String(senderName || ''),
      senderEmail: String(senderEmail || ''),
      receiverId: String(receiverId),
      receiverUID: String(receiverId),
      receiverUid: String(receiverId),
      receiverName: String(receiverName || ''),
      text: String(text),
      message: String(text),
      content: String(text),
      createdAt: timestamp,
      timestamp,
      read: false
    };
  }
  async function findDirectRoomIds(firestore, uid, targetUid) {
    const uidString = String(uid || '');
    const targetString = String(targetUid || '');
    const canonicalRoomId = getChatId(uidString, targetString);
    const legacyRoomId = [uidString, targetString].sort().join('_');
    const roomIds = new Set();
    const addIfMatching = (roomId, room) => {
      const participants = [
        ...(Array.isArray(room?.participants) ? room.participants : []),
        ...(Array.isArray(room?.participantIds) ? room.participantIds : [])
      ].map(String);
      if (participants.includes(uidString) && participants.includes(targetString)) {
        roomIds.add(String(roomId));
      }
    };

    for (const candidate of [canonicalRoomId, legacyRoomId]) {
      if (!candidate) continue;
      try {
        const snapshot = await firestore.collection('chats').doc(candidate).get();
        if (snapshot.exists) addIfMatching(candidate, snapshot.data() || {});
      } catch (error) {
        console.warn('[ADMIN CHAT] Không đọc được room candidate ' + candidate + ':', error);
      }
    }

    const collect = snapshot => snapshot.forEach(doc => addIfMatching(doc.id, doc.data() || {}));
    for (const field of ['participantIds', 'participants']) {
      try {
        collect(await firestore.collection('chats').where(field, 'array-contains', uidString).get());
      } catch (error) {
        console.warn('[ADMIN CHAT] Không truy vấn được room theo ' + field + ':', error);
      }
    }

    /* Chat mới chỉ dùng room canonical; không tạo thêm room legacy rỗng. */
    if (!roomIds.size && canonicalRoomId) roomIds.add(canonicalRoomId);
    return [...roomIds].filter(Boolean);
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

  async function createChatNotification({
    recipientUid,
    senderUid,
    senderName,
    roomId,
    text
  }) {
    const firestore = getFirestore();
    if (
      !firestore ||
      !recipientUid ||
      !senderUid ||
      !roomId ||
      String(recipientUid) === String(senderUid)
    ) {
      return;
    }
    try {
      await firestore
        .collection('csNotifications')
        .doc(String(recipientUid))
        .collection('items')
        .add({
          type: 'chat_message',
          recipientUid: String(recipientUid),
          senderId: String(senderUid),
          senderName: String(senderName || 'Người dùng'),
          roomId: String(roomId),
          chatId: String(roomId),
          title: `${String(senderName || 'Người dùng')} đã gửi tin nhắn cho bạn`,
          preview: String(text || '').slice(0, 180) || 'Bạn có một tin nhắn mới.',
          read: false,
          createdAt: serverTimestamp()
        });
    } catch (error) {
      console.warn('[ADMIN CHAT] Không thể tạo notification chat:', error);
    }
  }
  async function loadContacts() {
    const firestore = getFirestore();
    const currentUser = state.user;
    if (!firestore || !currentUser) return;
    try {
      const snapshot = await firestore.collection('chatContacts').doc(currentUser.uid).collection('items').get();
      state.contactIds = new Set(snapshot.docs.map(doc => String(doc.data()?.contactUid || doc.id)));
    } catch (error) {
      console.warn('[ADMIN CHAT] Không tải được danh bạ:', error);
      state.contactIds = new Set();
    }
  }
  async function addContact(uid) {
    const firestore = getFirestore();
    const currentUser = state.user;
    const target = state.users.find(user => String(user.uid) === String(uid));
    if (!firestore || !currentUser || !target || String(target.uid) === String(currentUser.uid)) return;
    try {
      const batch = firestore.batch();
      batch.set(firestore.collection('chatContacts').doc(currentUser.uid).collection('items').doc(String(target.uid)), { contactUid: String(target.uid), name: getName(target), email: target.email || '', addedAt: serverTimestamp() }, { merge: true });
      batch.set(firestore.collection('chatContacts').doc(String(target.uid)).collection('items').doc(currentUser.uid), { contactUid: currentUser.uid, name: getName(currentUser), email: currentUser.email || '', addedAt: serverTimestamp() }, { merge: true });
      await batch.commit();
      state.contactIds.add(String(target.uid));
      renderFriends();
      setMessengerStatus(document, `Đã thêm ${getName(target)} vào danh bạ.`);
    } catch (error) {
      console.warn('[ADMIN CHAT] Không thể thêm bạn:', error);
      setMessengerStatus(document, 'Không thể thêm bạn.');
    }
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
  function ensureRecentTab() {
    const tabs = document.querySelector('.adminbar-tabs');
    if (!tabs) return;
    let recentTab = tabs.querySelector('[data-messenger-tab="recent"]');
    if (!recentTab) {
      recentTab = document.createElement('button');
      recentTab.type = 'button';
      recentTab.className = 'adminbar-tab';
      recentTab.dataset.messengerTab = 'recent';
      recentTab.setAttribute('role', 'tab');
      recentTab.innerHTML = '<span class="material-symbols-rounded">chat</span>Gần đây';
      tabs.insertBefore(recentTab, tabs.firstElementChild || null);
    }
    tabs.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
  }
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
      ensureRecentTab();
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
    ensureRecentTab();
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
    /*
     * Sidebar và backdrop luôn được đưa trực tiếp vào body.
     * Nếu để trong .app-shell/.main-content, transform hoặc overflow
     * của từng trang có thể làm position: fixed bị dịch chuyển.
     */
    if (sidebar && document.body && sidebar.parentElement !== document.body) {
      document.body.prepend(sidebar);
    }
    if (backdrop && document.body && backdrop.parentElement !== document.body) {
      document.body.appendChild(backdrop);
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
     CHAT NOTIFICATIONS - kiểu Zalo
  ========================================================= */
  let unsubscribeChatNotifications = null;
  let chatNotificationRecords = [];
  let chatNotificationUIReady = false;
  function notificationDate(value) {
    if (!value) return '';
    const date = typeof value.toDate === 'function'
      ? value.toDate()
      : typeof value.seconds === 'number'
        ? new Date(value.seconds * 1000)
        : value instanceof Date ? value : null;
    return date
      ? date.toLocaleString('vi-VN', {
          day: '2-digit', month: '2-digit',
          hour: '2-digit', minute: '2-digit'
        })
      : 'Vừa xong';
  }
  function renderChatNotifications() {
    const list = $(SELECTOR.noticePanel)?.querySelector('#adminbarNotificationList');
    const badge = $(SELECTOR.noticeBadge);
    const countText = $(SELECTOR.noticeCount);
    if (!list) return;
    const unread = chatNotificationRecords.filter(item => item.read !== true);
    if (badge) {
      badge.textContent = unread.length > 99 ? '99+' : String(unread.length);
      badge.hidden = unread.length === 0;
    }
    if (countText) {
      countText.textContent = unread.length
        ? `${unread.length} tin nhắn chưa đọc`
        : 'Không có tin nhắn mới';
    }
    if (!chatNotificationRecords.length) {
      list.innerHTML = `
        <div class="adminbar-empty">
          <span class="material-symbols-rounded">notifications_none</span>
          <p>Không có tin nhắn mới</p>
        </div>
      `;
      return;
    }
    list.innerHTML = chatNotificationRecords.map(item => {
      const sender = item.senderName || item.title || 'Người dùng';
      const preview = item.preview || item.text || 'Đã gửi một tin nhắn.';
      const safeId = escapeHtml(item.id);
      return `
        <button
          type="button"
          class="adminbar-notification-item ${item.read ? 'is-read' : 'is-unread'}"
          data-chat-notification-id="${safeId}"
        >
          <span class="adminbar-notification-avatar">
            ${escapeHtml(getInitials(sender))}
          </span>
          <span class="adminbar-notification-copy">
            <strong class="adminbar-notification-sender">${escapeHtml(sender)}</strong>
            <span>${escapeHtml(preview)}</span>
            <small>${escapeHtml(notificationDate(item.createdAt))}</small>
          </span>
          ${item.read ? '' : '<span class="adminbar-reply-cue">TIN NHẮN MỚI · TRẢ LỜI</span><i class="adminbar-notification-dot"></i>'}
        </button>
      `;
    }).join('');
  }
  async function markChatRoomMessagesRead(roomId, uid) {
    const firestore = getFirestore();
    if (!firestore || !roomId || !uid) return;
    const snapshot = await firestore
      .collection('chats')
      .doc(String(roomId))
      .collection('messages')
      .get();
    const batch = firestore.batch();
    let changed = false;
    snapshot.forEach(doc => {
      const data = doc.data() || {};
      const receiverId = directMessageReceiver(data);
      const senderId = directMessageSender(data);
      if (
        String(receiverId) === String(uid) &&
        String(senderId) !== String(uid) &&
        data.read !== true
      ) {
        batch.update(doc.ref, { read: true });
        changed = true;
      }
    });
    if (changed) await batch.commit();
  }
  async function markChatNotificationRead(item) {
    const firestore = getFirestore();
    const uid = String(state.user?.uid || '');
    const notificationId = String(item?.id || '');
    if (!firestore || !uid || !notificationId) return;

    /* Cập nhật UI ngay cả khi mạng đang chập chờn; tránh gửi lặp khi click lại. */
    const wasRead = item.read === true;
    chatNotificationRecords = chatNotificationRecords.map(record =>
      String(record.id) === notificationId
        ? { ...record, read: true }
        : record
    );
    renderChatNotifications();
    if (wasRead) return;

    try {
      /*
       * Chỉ ghi boolean `read` ở thao tác này. `serverTimestamp()` trong
       * request đánh dấu notification có thể làm WebChannel cũ trả 400;
       * thời gian đọc không ảnh hưởng đến việc mở/trả lời chat.
       */
      await firestore
        .collection('csNotifications')
        .doc(uid)
        .collection('items')
        .doc(notificationId)
        .set({ read: true }, { merge: true });
    } catch (error) {
      console.warn('[ADMIN CHAT] Không thể đồng bộ trạng thái đã đọc:', error);
    }
  }
  async function markChatNotificationsReadForRooms(roomIds, uid) {
    const firestore = getFirestore();
    if (!firestore || !uid || !Array.isArray(roomIds) || !roomIds.length) return;
    try {
      const snapshot = await firestore
        .collection('csNotifications')
        .doc(uid)
        .collection('items')
        .limit(100)
        .get();
      const roomSet = new Set(roomIds.map(String));
      const batch = firestore.batch();
      let changed = false;
      snapshot.forEach(doc => {
        const data = doc.data() || {};
        if (
          roomSet.has(String(data.roomId || data.chatId || '')) &&
          data.read !== true
        ) {
          batch.set(doc.ref, { read: true }, { merge: true });
          changed = true;
        }
      });
      if (changed) await batch.commit();
      chatNotificationRecords = chatNotificationRecords.map(item =>
        roomSet.has(String(item.roomId || item.chatId || ''))
          ? { ...item, read: true }
          : item
      );
      renderChatNotifications();
    } catch (error) {
      console.warn('[ADMIN CHAT] Không thể đánh dấu notification của room đã đọc:', error);
    }
  }
  async function openChatFromNotification(item) {
    if (!item) return;

    await markChatNotificationRead(item);

    const noticeBadge = $(SELECTOR.noticeBadge);
    if (noticeBadge) noticeBadge.hidden = true;
    const notice = $(SELECTOR.noticePanel);
    const noticeButton = $(SELECTOR.noticeButton);
    const messenger = $(SELECTOR.messengerPanel);
    const messengerButton = $(SELECTOR.messengerButton);

    if (notice) notice.hidden = true;
    noticeButton?.setAttribute('aria-expanded', 'false');
    if (messenger) messenger.hidden = false;
    messengerButton?.setAttribute('aria-expanded', 'true');

    await loadChatUsers();
    setChatTab('recent');
    state.showAllFriends = false;
    state.showGroupComposer = false;
    renderFriends();

    // Quan trọng: thông báo phải mở đúng cuộc trò chuyện.
    const senderUid = String(
      item.senderId || item.senderUID || item.senderUid || item.from || ''
    );
    if (senderUid && String(senderUid) !== String(state.user?.uid || '')) {
      await openChat(senderUid);
      return;
    }

    // Dự phòng cho notification chỉ có roomId/chatId.
    const roomId = String(item.roomId || item.chatId || '');
    if (!roomId) return;
    try {
      const roomSnapshot = await getFirestore().collection('chats').doc(roomId).get();
      const roomData = roomSnapshot.data() || {};
      const participants = Array.isArray(roomData.participants)
        ? roomData.participants
        : (Array.isArray(roomData.participantIds) ? roomData.participantIds : []);
      const otherUid = participants.find(
        uid => String(uid) !== String(state.user?.uid || '')
      );
      if (otherUid) await openChat(String(otherUid));
    } catch (error) {
      console.warn('[ADMIN CHAT] Không thể mở chat từ room notification:', error);
    }
  }
  function setupChatNotificationUI() {
    if (chatNotificationUIReady) return;
    chatNotificationUIReady = true;
    const list = $(SELECTOR.noticePanel)?.querySelector('#adminbarNotificationList');
    if (!list) return;
    list.addEventListener('click', async event => {
      const button = event.target.closest('[data-chat-notification-id]');
      if (!button) return;
      const item = chatNotificationRecords.find(
        record => String(record.id) === String(button.dataset.chatNotificationId)
      );
      if (item) await openChatFromNotification(item);
    });
  }
  function bindChatNotifications(user) {
    if (unsubscribeChatNotifications) {
      unsubscribeChatNotifications();
      unsubscribeChatNotifications = null;
    }
    chatNotificationRecords = [];
    renderChatNotifications();
    setupChatNotificationUI();
    const firestore = getFirestore();
    if (!firestore || !user?.uid) return;
    unsubscribeChatNotifications = firestore
      .collection('csNotifications')
      .doc(user.uid)
      .collection('items')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(
        snapshot => {
          chatNotificationRecords = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item =>
              item.type === 'chat_message' ||
              item.type === 'message' ||
              item.senderId ||
              item.from
            );
          renderChatNotifications();
        },
        error => {
          console.warn('[ADMIN CHAT] Không đồng bộ notification chat:', error);
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
          ((messenger && messenger.contains(target)) ||
            (notice && notice.contains(target)) ||
            target.closest('.adminbar-panel-wrap'))
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
      const recentByUid = new Map();
      const roomSnapshots = await Promise.all(
        ['participantIds', 'participants'].map(async field => {
          try {
            return await firestore
              .collection('chats')
              .where(field, 'array-contains', String(currentUser.uid))
              .limit(100)
              .get();
          } catch (error) {
            console.warn('[ADMIN CHAT] Không tải được room gần đây theo ' + field + ':', error);
            return null;
          }
        })
      );
      roomSnapshots.filter(Boolean).forEach(roomSnapshot => {
        roomSnapshot.forEach(roomDoc => {
          const room = roomDoc.data() || {};
          const participants = [
            ...(Array.isArray(room.participantIds) ? room.participantIds : []),
            ...(Array.isArray(room.participants) ? room.participants : [])
          ].map(String);
          const otherUid = participants.find(uid => uid !== String(currentUser.uid));
          if (!otherUid) return;
          const participantNames = room.participantNames && typeof room.participantNames === 'object'
            ? room.participantNames
            : {};
          const otherName = String(participantNames[otherUid] || '').trim();
          const updatedAtValue = room.updatedAt?.toMillis
            ? room.updatedAt.toMillis()
            : room.updatedAt?.seconds
              ? room.updatedAt.seconds * 1000
              : 0;
          const previous = recentByUid.get(String(otherUid));
          if (!previous || updatedAtValue >= previous.updatedAtValue) {
            recentByUid.set(String(otherUid), {
              hasRoom: true,
              roomId: roomDoc.id,
              ...(otherName ? { displayName: otherName, name: otherName } : {}),
              lastMessage: room.lastMessage || '',
              lastMessageBy: room.lastMessageBy || room.lastMessageSenderId || '',
              lastMessageReadBy: room.lastMessageReadBy || '',
              updatedAtValue
            });
          }
        });
      });
      const usersByUid = new Map();
      snapshot.docs.forEach(doc => {
        const data = doc.data() || {};
        const uid = String(data.uid || data.authUid || data.firebaseUid || doc.id);
        if (uid && uid !== String(currentUser.uid)) {
          usersByUid.set(uid, { uid, ...data });
        }
      });
      /* Nếu Admin/CS chưa có profile trong users, room vẫn phải hiện ở Gần đây. */
      recentByUid.forEach((recent, uid) => {
        if (uid === String(currentUser.uid)) return;
        const existing = usersByUid.get(uid) || { uid };
        usersByUid.set(uid, {
          ...existing,
          uid,
          ...(recent.displayName && !existing.displayName && !existing.name
            ? { displayName: recent.displayName, name: recent.name }
            : {}),
          ...recent
        });
      });
      state.users = [...usersByUid.values()]
        .map(user => ({
          ...user,
          ...(recentByUid.get(String(user.uid)) || {
            hasRoom: false,
            updatedAtValue: 0,
            lastMessage: '',
            lastMessageBy: ''
          })
        }))
        .sort((a, b) => {
          if (Boolean(a.hasRoom) !== Boolean(b.hasRoom)) return a.hasRoom ? -1 : 1;
          if (a.updatedAtValue !== b.updatedAtValue) return b.updatedAtValue - a.updatedAtValue;
          return getName(a).localeCompare(getName(b), 'vi');
        });
      await loadContacts();
      renderFriends();
      renderGroupMembers();
      await loadChatGroups();
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
    const sourceUsers = state.showAllFriends ? state.users : state.users.filter(user => user.hasRoom);
    const users =
      sourceUsers.filter(
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
          ${state.showAllFriends ? 'Không tìm thấy người dùng.' : 'Chưa có cuộc trò chuyện gần đây.'}
        </p>
      `;
      return;
    }
    list.innerHTML =
      users
        .map(
          user => {
            const userUid = String(user.uid || '');
            const unreadCount = Math.max(
              0,
              Number(state.unreadByUser[userUid] || 0)
            );
            const unreadCountKnown = Object.prototype.hasOwnProperty.call(state.unreadByUser, userUid);
            const isMine = Boolean(
              user.lastMessage &&
              String(user.lastMessageBy || user.lastMessageSenderId || '') === String(state.user?.uid || '')
            );
            const metadataUnread = Boolean(
              user.hasRoom &&
              user.lastMessage &&
              !isMine &&
              !valueContainsUid(user.lastMessageReadBy, state.user?.uid)
            );
            // Khi đã có kết quả từ messages thì số 0 thắng metadata room cũ.
            const isUnread = unreadCount > 0 || (!unreadCountKnown && metadataUnread);
            const preview = user.lastMessage
              ? String(user.lastMessageBy) === String(state.user?.uid)
                ? `Bạn: ${user.lastMessage}`
                : String(user.lastMessage)
              : (user.hasRoom ? 'Mở để xem tin nhắn' : '');
            const isContact = state.contactIds.has(String(user.uid));
            return `
            <div
              class="adminbar-friend-row ${isUnread ? 'is-unread' : 'is-read'}"
              data-chat="${escapeHtml(user.uid)}"
              role="button"
              tabindex="0"
              aria-label="Mở cuộc trò chuyện với ${escapeHtml(getName(user))}"
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
                <strong class="adminbar-friend-name ${isUnread ? 'is-unread' : 'is-read'}">
                  ${escapeHtml(getName(user))}
                </strong>
                <span class="adminbar-friend-preview ${isUnread ? 'is-unread' : 'is-read'}">${escapeHtml(preview)}</span>
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
              ${unreadCount ? `<b class="adminbar-chat-unread-count" aria-label="${unreadCount} tin nhắn chưa đọc">${unreadCount > 99 ? '99+' : unreadCount}</b>` : ''}
              ${isContact ? '' : `<button type="button" class="adminbar-invite-btn" data-add-contact="${escapeHtml(user.uid)}">Thêm bạn</button>`}
            </div>
          `;
          }
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
  function ensureChatGroupList() {
    const groupsView = $(SELECTOR.groupsView);
    if (!groupsView) return null;
    let list = $(SELECTOR.groupList);
    if (!list) {
      const title = document.createElement('p');
      title.className = 'adminbar-field-title';
      title.textContent = 'Nhóm của bạn';
      list = document.createElement('div');
      list.id = 'adminbarGroupList';
      list.className = 'adminbar-list adminbar-chat-group-list';
      groupsView.append(title, list);
    }
    return list;
  }
  function renderChatGroups() {
    const list = ensureChatGroupList();
    if (!list) return;
    if (!state.chatGroups.length) {
      list.innerHTML = '<p class="adminbar-state">Chưa có nhóm chat nào.</p>';
      return;
    }
    list.innerHTML = state.chatGroups.map(group => {
      const count = Array.isArray(group.participants) ? group.participants.length : 0;
      return `<div class="adminbar-friend-row" data-chat-group="${escapeHtml(group.id)}" role="button" tabindex="0"><span class="adminbar-chat-avatar">${escapeHtml(getInitials(group.name || 'Nhóm'))}</span><span class="adminbar-friend-info"><strong>${escapeHtml(group.name || 'Nhóm chat')}</strong><span class="adminbar-friend-preview">${escapeHtml(group.lastMessage || 'Chưa có tin nhắn')}</span><small>${count} thành viên</small></span></div>`;
    }).join('');
  }
  async function loadChatGroups() {
    const firestore = getFirestore();
    const currentUser = state.user;
    const list = ensureChatGroupList();
    if (!firestore || !currentUser || !list) return;
    try {
      const snapshot = await firestore.collection('chatGroups').where('participants', 'array-contains', currentUser.uid).get();
      state.chatGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      state.chatGroups.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const bTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return bTime - aTime;
      });
      renderChatGroups();
    } catch (error) {
      console.warn('[ADMIN CHAT] Không tải được nhóm chat:', error);
      list.innerHTML = '<p class="adminbar-state">Không tải được danh sách nhóm.</p>';
    }
  }
  /* =========================================================
     SET CHAT TAB
  ========================================================= */
  function setChatTab(tab) {
    const friends = $(SELECTOR.friendsView);
    const groups = $(SELECTOR.groupsView);
    const listView = $(SELECTOR.messengerListView);
    const chatView = $(SELECTOR.chatView);
    if (listView) listView.hidden = false;
    if (chatView) chatView.hidden = true;
    if (tab === 'friends') {
      state.showAllFriends = !state.showAllFriends;
      if (friends) friends.dataset.viewMode = state.showAllFriends ? 'friends' : 'recent';
      state.showGroupComposer = false;
      if (friends) friends.hidden = false;
      if (groups) groups.hidden = true;
    } else if (tab === 'groups') {
      state.showGroupComposer = !state.showGroupComposer;
      if (friends) friends.dataset.viewMode = 'groups';
      if (friends) friends.hidden = state.showGroupComposer;
      if (groups) groups.hidden = !state.showGroupComposer;
      if (state.showGroupComposer) renderGroupMembers();
    } else {
      state.showAllFriends = false;
      if (friends) friends.dataset.viewMode = 'recent';
      state.showGroupComposer = false;
      if (friends) friends.hidden = false;
      if (groups) groups.hidden = true;
    }
    $$('[data-messenger-tab]').forEach(button => {
      const value = button.dataset.messengerTab;
      const active = (value === 'recent' && !state.showAllFriends && !state.showGroupComposer) ||
        (value === 'friends' && state.showAllFriends) ||
        (value === 'groups' && state.showGroupComposer);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-expanded', String(active));
    });
    renderFriends();
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
    state.selectedGroup = null;
    state.chatMode = 'direct';
    // Bỏ dấu chưa đọc ngay khi mở conversation; listener sẽ đồng bộ lại từ messages.
    state.unreadByUser[String(target.uid)] = 0;
    renderFriends();
    /* Badge sẽ được ẩn ngay sau khi phòng được mở. */
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
    const roomIds = await findDirectRoomIds(firestore, currentUser.uid, target.uid);
    const primaryRoomId = roomIds[0] || getChatId(currentUser.uid, target.uid);
    if (primaryRoomId) {
      try {
        const primaryRoomRef = firestore.collection('chats').doc(primaryRoomId);
        const primaryRoomSnapshot = await primaryRoomRef.get();
        if (!primaryRoomSnapshot.exists) {
          await primaryRoomRef.set({
            participants: [String(currentUser.uid), String(target.uid)],
            participantIds: [String(currentUser.uid), String(target.uid)],
            participantNames: {
              [currentUser.uid]: getName(currentUser),
              [target.uid]: getName(target)
            },
            lastMessage: '',
            lastMessageBy: '',
            lastMessageSenderId: '',
            lastMessageReadBy: '',
            lastMessageReadAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          if (!roomIds.includes(primaryRoomId)) roomIds.unshift(primaryRoomId);
        }
      } catch (error) {
        console.warn('[ADMIN CHAT] Không thể khởi tạo room chat:', error);
      }
    }
    console.log('[ADMIN CHAT] OPEN rooms:', roomIds);
    /* Đồng bộ cả notification bell khi mở cuộc trò chuyện. */
    await markChatNotificationsReadForRooms(roomIds, currentUser.uid);
    const noticeBadge = $(SELECTOR.noticeBadge);
    if (noticeBadge) noticeBadge.hidden = true;
    /* Mở đúng cuộc trò chuyện = đã xem tin đến mình. */
    setMessengerUnreadBadge(0);
    Promise.all(
      roomIds.map(async roomId => {
        try {
          await markChatRoomMessagesRead(roomId, currentUser.uid);
          await firestore.collection('chats').doc(roomId).set({
            lastMessageReadBy: currentUser.uid
          }, { merge: true });
        } catch (error) {
          console.warn('[ADMIN CHAT] Không thể đánh dấu room đã đọc:', roomId, error);
        }
      })
    ).then(() => {
      /* Cho listener thời gian nhận trạng thái mới rồi tính lại badge. */
      setTimeout(() => setMessengerUnreadBadge(0), 150);
    });
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
        const senderId = directMessageSender(data);
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
  async function openChatGroup(groupId) {
    const currentUser = state.user;
    const firestore = getFirestore();
    const group = state.chatGroups.find(item => String(item.id) === String(groupId));
    if (!currentUser || !firestore || !group) return;
    if (state.unsubscribeMessages) {
      state.unsubscribeMessages();
      state.unsubscribeMessages = null;
    }
    state.selectedUser = null;
    state.selectedGroup = group;
    state.chatMode = 'group';
    const listView = $(SELECTOR.messengerListView);
    const chatView = $(SELECTOR.chatView);
    const messages = $(SELECTOR.chatMessages);
    if (!listView || !chatView || !messages) return;
    listView.hidden = true;
    chatView.hidden = false;
    setText(document, SELECTOR.chatName, group.name || 'Nhóm chat');
    setText(document, SELECTOR.chatRole, `${(group.participants || []).length} thành viên`);
    setText(document, SELECTOR.chatAvatar, getInitials(group.name || 'Nhóm'));
    setMessengerStatus(document, `Đang trò chuyện trong ${group.name || 'nhóm chat'}`);
    messages.innerHTML = '<p class="adminbar-state">Đang tải tin nhắn...</p>';
    state.unsubscribeMessages = firestore.collection('chatGroups').doc(group.id).collection('messages').orderBy('createdAt', 'asc').onSnapshot(snapshot => {
      const rows = snapshot.docs.map(doc => doc.data() || {});
      messages.innerHTML = rows.length ? '' : '<p class="adminbar-state">Hãy gửi tin nhắn đầu tiên.</p>';
      rows.forEach(data => {
        const bubble = document.createElement('div');
        bubble.className = 'adminbar-chat-bubble';
        if (String(data.from || data.senderId || '') === String(currentUser.uid)) bubble.classList.add('is-mine');
        bubble.textContent = directMessageText(data) || 'Tin nhắn không có nội dung';
        messages.appendChild(bubble);
      });
      messages.scrollTop = messages.scrollHeight;
    }, error => {
      console.warn('[ADMIN CHAT] Không tải được tin nhắn nhóm:', error);
      messages.innerHTML = '<p class="adminbar-state">Không tải được tin nhắn nhóm.</p>';
    });
  }
  async function sendChatGroupMessage(event) {
    event.preventDefault();
    const firestore = getFirestore();
    const currentUser = state.user;
    const group = state.selectedGroup;
    const input = $(SELECTOR.chatInput);
    const text = input?.value.trim() || '';
    if (!firestore || !currentUser || !group || !input || !text) return;
    input.disabled = true;
    try {
      const groupRef = firestore.collection('chatGroups').doc(group.id);
      const participants = Array.isArray(group.participants) ? group.participants.map(String) : [];
      const senderName = getName(currentUser);
      const batch = firestore.batch();
      const messageRef = groupRef.collection('messages').doc();
      batch.set(messageRef, {
        from: currentUser.uid,
        senderId: currentUser.uid,
        senderName,
        to: participants.filter(uid => uid !== String(currentUser.uid)),
        text,
        message: text,
        createdAt: serverTimestamp(),
        read: false
      });
      batch.set(groupRef, {
        lastMessage: text,
        lastMessageBy: currentUser.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
      participants.filter(uid => uid !== String(currentUser.uid)).forEach(uid => {
        const notice = firestore.collection('csNotifications').doc(uid).collection('items').doc();
        batch.set(notice, {
          type: 'chat_group_message',
          recipientUid: uid,
          senderId: currentUser.uid,
          senderName,
          chatGroupId: group.id,
          title: `${senderName} đã gửi tin nhắn trong ${group.name || 'nhóm chat'}`,
          preview: text.slice(0, 180),
          read: false,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();
      input.value = '';
      input.focus();
    } catch (error) {
      console.error('[ADMIN CHAT] Không gửi được tin nhắn nhóm:', error);
      setMessengerStatus(document, 'Không gửi được tin nhắn nhóm.');
    } finally {
      input.disabled = false;
    }
  }
  /* =========================================================
     SEND MESSAGE - gửi vào room đang tồn tại nếu có
  ========================================================= */
  async function sendMessage(event) {
    event.preventDefault();
    if (state.chatMode === 'group') {
      return sendChatGroupMessage(event);
    }
    const currentUser = state.user;
    const target = state.selectedUser;
    const firestore = getFirestore();
    const input = $(SELECTOR.chatInput);
    const text = input?.value.trim() || '';
    if (!currentUser || !target || !firestore || !text) return;
    input.disabled = true;
    try {
      const candidateIds = await findDirectRoomIds(firestore, currentUser.uid, target.uid);
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
        participantIds: [currentUser.uid, target.uid],
        participantNames: {
          [currentUser.uid]: getName(currentUser),
          [target.uid]: getName(target)
        },
        lastMessage: text,
        lastMessageBy: currentUser.uid,
        lastMessageSenderId: currentUser.uid,
        lastMessageReadBy: currentUser.uid,
        lastMessageReadAt: timestamp,
        updatedAt: timestamp
      }, { merge: true });
      await chatRef.collection('messages').add(makeDirectMessage({
        senderId: currentUser.uid,
        senderName: getName(currentUser),
        senderEmail: currentUser.email || '',
        receiverId: target.uid,
        receiverName: getName(target),
        text,
        timestamp
      }));
      await createChatNotification({
        recipientUid: target.uid,
        senderUid: currentUser.uid,
        senderName: getName(currentUser),
        roomId: chatId,
        text
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
    state.selectedGroup = null;
    state.chatMode = 'direct';
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
    setChatTab('recent');
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
    const participantNames = {};
    participants.forEach(uid => {
      const profile = String(uid) === String(currentUser.uid)
        ? currentUser
        : state.users.find(user => String(user.uid) === String(uid));
      participantNames[uid] = getName(profile || { name: 'Thành viên' });
    });
    try {
      const groupRef =
        await firestore
          .collection('chatGroups')
          .add({
            name:
              groupName,
            participants,
            participantNames,
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
      await loadChatGroups();
      await openChatGroup(groupRef.id);
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
    const uid = String(user?.uid || '');
    if (!firestore || !uid) return;

    const roomsById = new Map();
    const counts = new Map();
    const updateBadge = () => {
      let total = 0;
      const unreadByUser = {};
      counts.forEach(record => {
        const count = Number(record?.count || 0);
        total += count;
        if (record?.otherUid) {
          unreadByUser[record.otherUid] = (unreadByUser[record.otherUid] || 0) + count;
        }
      });
      state.unreadByUser = unreadByUser;
      setMessengerUnreadBadge(total);
      renderFriends();
    };
    const bindRoomMessages = (roomDoc, roomData) => {
      const participants = [
        ...(Array.isArray(roomData.participantIds) ? roomData.participantIds : []),
        ...(Array.isArray(roomData.participants) ? roomData.participants : [])
      ].map(String);
      const otherUid = String(participants.find(participant => participant !== uid) || '');
      const unsubscribe = roomDoc.ref.collection('messages').onSnapshot(
        messagesSnapshot => {
          let count = 0;
          messagesSnapshot.forEach(messageDoc => {
            const data = messageDoc.data() || {};
            const receiverId = data.to || data.receiverId || data.receiverUID || data.recipientId || '';
            const senderId = data.from || data.senderId || data.senderUID || data.senderUid || '';
            if (String(receiverId) === uid && String(senderId) !== uid && data.read !== true) count += 1;
          });
          const currentRoomData = roomsById.get(roomDoc.id) || roomData;
          if (
            count === 0 &&
            currentRoomData.lastMessageBy &&
            String(currentRoomData.lastMessageBy) !== uid &&
            String(currentRoomData.lastMessageReadBy || '') !== uid
          ) {
            count = 1;
          }
          counts.set(roomDoc.id, { count, otherUid });
          updateBadge();
        },
        error => {
          console.warn('[ADMIN CHAT] Không thể đếm tin chưa đọc:', roomDoc.id, error);
          counts.set(roomDoc.id, { count: 0, otherUid });
          updateBadge();
        }
      );
      unreadMessageListeners.push(unsubscribe);
    };
    const roomListeners = ['participantIds', 'participants'].map(field => firestore
      .collection('chats')
      .where(field, 'array-contains', uid)
      .limit(100)
      .onSnapshot(snapshot => {
        snapshot.forEach(roomDoc => {
          const roomData = roomDoc.data() || {};
          const existing = roomsById.get(roomDoc.id);
          roomsById.set(roomDoc.id, roomData);
          if (!existing) bindRoomMessages(roomDoc, roomData);
        });
        updateBadge();
      }, error => {
        console.warn('[ADMIN CHAT] Không đồng bộ được badge theo ' + field + ':', error);
        updateBadge();
      }));
    unsubscribeUnreadRooms = () => roomListeners.forEach(unsubscribe => {
      try { unsubscribe(); } catch (_) {}
    });
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
          const addButton = event.target.closest('[data-add-contact]');
          if (addButton) {
            event.preventDefault();
            event.stopPropagation();
            addContact(addButton.dataset.addContact);
            return;
          }
          const target =
            event.target.closest(
              '.adminbar-friend-row[data-chat]'
            );
          if (!target) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          void openChat(
            target.dataset.chat
          );
        }
      );
    $(SELECTOR.friendList)?.addEventListener('keydown', event => {
      const target = event.target.closest('.adminbar-friend-row[data-chat]');
      if (!target || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      event.stopPropagation();
      void openChat(target.dataset.chat);
    });
    $(SELECTOR.groupsView)
      ?.addEventListener('click', event => {
        const target = event.target.closest('[data-chat-group]');
        if (!target) return;
        event.preventDefault();
        openChatGroup(target.dataset.chatGroup);
      });
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
          bindChatNotifications(user);
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
