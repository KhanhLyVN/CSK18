(() => {
  'use strict';

  const NOTIFICATION_READ_KEY = 'admin.notification.read.v1';
  const MAX_NOTIFICATIONS = 8;

  const getInitials = (name) => (
    String(name || 'Admin')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .slice(0, 2) || 'AD'
  ).toUpperCase();

  const normalize = (value) => String(value ?? '').trim().toLowerCase();

  const isTrue = (value) => value === true || ['true', '1', 'yes'].includes(normalize(value));

  const isCsAccount = (data) => {
    const accountType = normalize(data.accountType || data.account_type || data.role);
    return ['customer_success', 'customer success', 'cs', 'cs_manager', 'customer-success'].includes(accountType);
  };

  const getStatus = (data) => {
    const status = normalize(data.status || data.accountStatus || data.state);

    if (['pending', 'inactive', 'disabled', 'chưa kích hoạt', 'not_activated', 'not activated'].includes(status)) {
      return 'pending';
    }

    if (['active', 'activated', 'đang hoạt động', 'online'].includes(status)) {
      return 'active';
    }

    if (['away', 'tạm vắng', 'offline'].includes(status)) {
      return 'away';
    }

    return isTrue(data.passwordCreated) ? 'active' : 'pending';
  };

  const toDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatTime = (value) => {
    const date = toDate(value);
    if (!date) return 'Vừa cập nhật';

    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDateValue = (data) => data.updatedAt || data.createdAt || data.joinedAt || data.dateCreated;

  const readIds = () => {
    try {
      const value = JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || '[]');
      return new Set(Array.isArray(value) ? value : []);
    } catch {
      return new Set();
    }
  };

  const saveReadIds = (ids) => {
    localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify([...ids].slice(-100)));
  };

  const install = (markup) => {
    const host = document.getElementById('adminBar');
    const main = document.querySelector('.main-content');
    if (!host) return;

    host.innerHTML = markup;

    const topbar = host.querySelector('.topbar');
    if (topbar && main) main.prepend(topbar);

    const page = document.body.dataset.adminPage || '';
    const active = host.querySelector(`[data-page="${page}"]`);
    if (active) {
      active.classList.add('active');
      active.setAttribute('aria-current', 'page');
    }

    const sidebar = host.querySelector('#adminSidebar');
    const menuBtn = document.getElementById('menuBtn');
    const backdrop = host.querySelector('#adminSidebarBackdrop');

    const closeSidebar = () => {
      sidebar?.classList.remove('open');
      document.body.classList.remove('sidebar-open');
      if (backdrop) backdrop.hidden = true;
    };

    menuBtn?.addEventListener('click', () => {
      const open = sidebar?.classList.toggle('open');
      document.body.classList.toggle('sidebar-open', Boolean(open));
      if (backdrop) backdrop.hidden = !open;
    });

    backdrop?.addEventListener('click', closeSidebar);
    sidebar?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeSidebar));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 780) closeSidebar();
    });

    const notificationButton = host.querySelector('#noticeBtn');
    const notificationPanel = host.querySelector('#notificationPanel');
    const notificationList = host.querySelector('#notificationList');
    const notificationCount = host.querySelector('#notificationCount');
    const noticeBadge = host.querySelector('#noticeBadge');
    const markAllReadButton = host.querySelector('#markAllReadBtn');
    let notifications = [];
    let readNotificationIds = readIds();

    const escapeHtml = (value) => {
      const div = document.createElement('div');
      div.textContent = String(value ?? '');
      return div.innerHTML;
    };

    const updateBadge = () => {
      const unreadCount = notifications.filter((item) => !readNotificationIds.has(item.id)).length;

      if (noticeBadge) {
        noticeBadge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
        noticeBadge.classList.toggle('hidden', unreadCount === 0);
      }

      if (notificationCount) {
        notificationCount.textContent = unreadCount
          ? `${unreadCount} thông báo chưa đọc`
          : 'Không có thông báo mới';
      }
    };

    const renderNotifications = () => {
      if (!notificationList) return;

      if (!notifications.length) {
        notificationList.innerHTML = `
          <div class="notification-empty">
            <span class="material-symbols-rounded">notifications_none</span>
            <p>Không có thông báo mới</p>
          </div>
        `;
        updateBadge();
        return;
      }

      notificationList.innerHTML = notifications.map((item) => {
        const unread = !readNotificationIds.has(item.id);
        return `
          <button type="button" class="notification-item ${unread ? 'unread' : ''}" data-notification-id="${escapeHtml(item.id)}">
            <span class="notification-icon material-symbols-rounded">${escapeHtml(item.icon)}</span>
            <span class="notification-content">
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.message)}</p>
              <span class="notification-time">${escapeHtml(item.time)}</span>
            </span>
            ${unread ? '<span class="notification-unread-dot" aria-label="Chưa đọc"></span>' : ''}
          </button>
        `;
      }).join('');

      notificationList.querySelectorAll('[data-notification-id]').forEach((node) => {
        node.addEventListener('click', () => {
          const id = node.dataset.notificationId;
          readNotificationIds.add(id);
          saveReadIds(readNotificationIds);
          node.classList.remove('unread');
          node.querySelector('.notification-unread-dot')?.remove();
          updateBadge();
        });
      });

      updateBadge();
    };

    const buildNotifications = (snapshot) => {
      const docs = snapshot.docs
        .map((doc) => ({ id: doc.id, data: doc.data() || {} }))
        .filter(({ data }) => isCsAccount(data));

      const result = [];
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const pendingAccounts = docs.filter(({ data }) => getStatus(data) === 'pending');

      if (pendingAccounts.length) {
        result.push({
          id: `pending-accounts-${pendingAccounts.length}`,
          icon: 'priority_high',
          title: 'Tài khoản cần kích hoạt',
          message: `Có ${pendingAccounts.length} tài khoản CS chưa được kích hoạt.`,
          time: 'Cần xử lý'
        });
      }

      docs
        .filter(({ data }) => {
          const date = toDate(data.createdAt || data.joinedAt || data.dateCreated);
          return date && now - date.getTime() <= sevenDays;
        })
        .sort((a, b) => (toDate(getDateValue(b.data))?.getTime() || 0) - (toDate(getDateValue(a.data))?.getTime() || 0))
        .slice(0, 4)
        .forEach(({ id, data }) => {
          const name = data.name || data.displayName || data.email || 'Tài khoản CS';
          result.push({
            id: `new-account-${id}`,
            icon: 'person_add',
            title: 'Tài khoản CS mới',
            message: `${name} vừa được thêm vào hệ thống.`,
            time: formatTime(data.createdAt || data.joinedAt || data.dateCreated)
          });
        });

      docs
        .filter(({ data }) => {
          const date = toDate(data.updatedAt);
          return date && now - date.getTime() <= sevenDays;
        })
        .sort((a, b) => (toDate(b.data.updatedAt)?.getTime() || 0) - (toDate(a.data.updatedAt)?.getTime() || 0))
        .slice(0, 3)
        .forEach(({ id, data }) => {
          const name = data.name || data.displayName || data.email || 'Tài khoản CS';
          result.push({
            id: `updated-account-${id}-${String(data.updatedAt)}`,
            icon: 'sync',
            title: 'Tài khoản vừa cập nhật',
            message: `${name} vừa được cập nhật thông tin.`,
            time: formatTime(data.updatedAt)
          });
        });

      return result.slice(0, MAX_NOTIFICATIONS);
    };

    const loadNotifications = () => {
      if (typeof firebase === 'undefined' || !firebase.firestore) {
        renderNotifications();
        return;
      }

      firebase.firestore().collection('users').onSnapshot(
        (snapshot) => {
          notifications = buildNotifications(snapshot);
          renderNotifications();
        },
        (error) => {
          console.error('Không thể tải thông báo từ Firebase:', error);
          notifications = [];
          renderNotifications();
        }
      );
    };

    notificationButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = notificationPanel?.hidden === false;
      if (notificationPanel) notificationPanel.hidden = isOpen;
      notificationButton.setAttribute('aria-expanded', String(!isOpen));
    });

    notificationPanel?.addEventListener('click', (event) => event.stopPropagation());

    document.addEventListener('click', () => {
      if (notificationPanel && !notificationPanel.hidden) {
        notificationPanel.hidden = true;
        notificationButton?.setAttribute('aria-expanded', 'false');
      }
    });

    markAllReadButton?.addEventListener('click', () => {
      notifications.forEach((item) => readNotificationIds.add(item.id));
      saveReadIds(readNotificationIds);
      renderNotifications();
    });

    const updateIdentity = async (user) => {
      const name = user?.displayName || user?.email || 'Administrator';
      const set = (selector, value) => {
        const node = host.querySelector(selector);
        if (node) node.textContent = value;
      };

      set('#sidebarUserName', name);
      set('#sidebarAvatar', getInitials(name));
      set('#topAdminName', name);
      set('#topAdminAvatar', getInitials(name));
      set('#topAdminCampus', '');

      if (!user || typeof firebase === 'undefined' || !firebase.firestore) return;

      try {
        const profile = await firebase.firestore().collection('users').doc(user.uid).get();
        const data = profile.exists ? profile.data() || {} : {};
        const campus = String(data.campus || data.campusName || data['code-campus'] || data.campusId || data.codeCampus || '').trim();
        set('#topAdminCampus', campus);
      } catch (error) {
        console.warn('Không lấy được campus của Admin:', error);
      }
    };

    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged(updateIdentity);
    }

    host.querySelector('#sidebarLogoutBtn')?.addEventListener('click', async () => {
      try {
        if (typeof firebase !== 'undefined' && firebase.auth) await firebase.auth().signOut();
      } finally {
        window.location.replace('/CS/login/login.html');
      }
    });

    const loadCsAccountCount = async () => {
      const badge = host.querySelector('#sidebarAccountCount');
      if (!badge || typeof firebase === 'undefined' || !firebase.firestore) return;

      try {
        const snapshot = await firebase.firestore().collection('users').get();
        const count = snapshot.docs.filter((doc) => isCsAccount(doc.data() || {})).length;
        badge.textContent = String(count);
        badge.hidden = false;
      } catch (error) {
        badge.textContent = '—';
        console.error('Không thể đếm tài khoản CS:', error);
      }
    };

    loadCsAccountCount();
    loadNotifications();
    renderNotifications();
    document.dispatchEvent(new CustomEvent('adminbar:ready'));
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const host = document.getElementById('adminBar');
    if (!host) return;

    try {
      const response = await fetch('/ADMIN/admin-bar.html', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      install(await response.text());
    } catch (error) {
      console.error('Không thể tải Admin Bar dùng chung:', error);
    }
  });
})();
