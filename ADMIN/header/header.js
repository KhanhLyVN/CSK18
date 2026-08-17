(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', async function () {
    const container = document.querySelector('#sharedHeader');
    if (!container) {
      console.error('Không tìm thấy phần tử #sharedHeader');
      return;
    }
    try {
      /*LOAD HEADER*/
      const response = await fetch('./header/header.html', {
        cache: 'no-cache'
      });
      if (!response.ok) {
        throw new Error(
          `Không thể tải header.html: ${response.status}`
        );
      }
      container.innerHTML = await response.text();
      /*MOBILE SIDEBAR*/
      const menuBtn = document.getElementById('menuBtn');
      const sidebar = document.getElementById('adminSidebar');
      if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', function (event) {
          event.stopPropagation();
          sidebar.classList.toggle('open');
          document.body.classList.toggle(
            'sidebar-open',
            sidebar.classList.contains('open')
          );
        });
        /*CLICK OUTSIDE SIDEBAR TO OPEN/CLOSE*/
        document.addEventListener('click', function (event) {
          if (
            window.innerWidth <= 780 &&
            sidebar.classList.contains('open') &&
            !sidebar.contains(event.target) &&
            !menuBtn.contains(event.target)
          ) {
            sidebar.classList.remove('open');
            document.body.classList.remove(
              'sidebar-open'
            );
          }
        });
        /*CLICK LINK → CLOSE MOBILE SIDEBAR*/
        sidebar.querySelectorAll('a').forEach(function (link) {
          link.addEventListener('click', function () {
            if (window.innerWidth <= 780) {
              sidebar.classList.remove('open');
              document.body.classList.remove(
                'sidebar-open'
              );
            }
          });
        });
        /*RESIZE → CLOSE SIDEBAR*/
        window.addEventListener('resize', function () {
          if (window.innerWidth > 780) {
            sidebar.classList.remove('open');
            document.body.classList.remove(
              'sidebar-open'
            );
          }
        });
      } else {
        console.warn(
          'Không tìm thấy #menuBtn hoặc #adminSidebar'
        );
      }
      /*HEADER LOADED EVENT*/
      document.dispatchEvent(
        new CustomEvent('sharedheader:loaded')
      );

      /*ADMIN PROFILE AND CAMPUS*/
      loadAdminIdentity();
      initNotifications();
    } catch (error) {
      console.error(
        'Lỗi tải header:',
        error
      );
    }
  });

  function safeText(value) {
    return value === null || value === undefined
      ? ''
      : String(value).trim();
  }

  function getInitials(name) {
    const parts = (safeText(name) || 'Admin')
      .split(/\s+/)
      .filter(Boolean);
    return parts.length > 1
      ? parts.slice(-2).map(part => part.charAt(0).toUpperCase()).join('')
      : parts[0].slice(0, 2).toUpperCase();
  }

  function renderAdminIdentity(name, campus, email) {
    const nameNode = document.getElementById('topAdminName');
    const campusNode = document.getElementById('topAdminCampus');
    const avatarNode = document.getElementById('topAdminAvatar');
    const finalName = safeText(name) || safeText(email) || 'Admin';
    const finalCampus = safeText(campus);

    if (nameNode) {
      nameNode.textContent = finalName;
      nameNode.title = finalName;
    }
    if (campusNode) {
      campusNode.textContent = finalCampus;
      campusNode.title = finalCampus ? `Campus ${finalCampus}` : '';
    }
    if (avatarNode) {
      avatarNode.textContent = getInitials(finalName);
      avatarNode.setAttribute(
        'aria-label',
        `Tài khoản ${finalName}${finalCampus ? ` - ${finalCampus}` : ''}`
      );
    }
  }

  async function loadAdminIdentity() {
    const firebaseAuth = typeof auth !== 'undefined' && auth
      ? auth
      : typeof firebase !== 'undefined' && firebase.auth
        ? firebase.auth()
        : null;
    if (!firebaseAuth) return;

    const loadUser = async (user) => {
      if (!user) {
        renderAdminIdentity('Admin', '', '');
        return;
      }

      let name = user.displayName || user.email || 'Admin';
      let campus = '';
      const database = typeof db !== 'undefined' && db
        ? db
        : typeof firebase !== 'undefined' && firebase.firestore
          ? firebase.firestore()
          : null;

      try {
        if (database) {
          const userDoc = await database.collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const data = userDoc.data() || {};
            name = data.name || data.fullName || data.displayName || data.userName || name;
            campus = data.campus || data.campusName || data['code-campus'] || data.campusId || data.codeCampus || '';
          }
        }
      } catch (error) {
        console.warn('Không thể lấy thông tin Admin:', error);
      }

      renderAdminIdentity(name, campus, user.email);
    };

    if (firebaseAuth.currentUser) {
      await loadUser(firebaseAuth.currentUser);
    } else {
      firebaseAuth.onAuthStateChanged(loadUser);
    }
  }

  function getNotificationDatabase() {
    try {
      if (typeof db !== 'undefined' && db) return db;
    } catch (_) {}
    try {
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        return firebase.firestore();
      }
    } catch (_) {}
    return null;
  }

  function notificationValue(data, keys, fallback = '') {
    for (const key of keys) {
      const value = data && data[key];
      if (value !== undefined && value !== null && safeText(value)) {
        return safeText(value);
      }
    }
    return fallback;
  }

  function notificationDate(value) {
    try {
      if (value && typeof value.toDate === 'function') return value.toDate();
      if (value instanceof Date) return value;
      if (value) return new Date(value);
    } catch (_) {}
    return null;
  }

  function formatNotificationDate(value) {
    const date = notificationDate(value);
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderNotifications(items) {
    const list = document.getElementById('notificationList');
    const badge = document.getElementById('noticeBadge');
    const count = document.getElementById('notificationCount');
    if (!list || !badge || !count) return;

    const unread = items.filter(item => !item.read).length;
    badge.textContent = String(unread);
    badge.classList.toggle('hidden', unread === 0);
    count.textContent = unread
      ? `${unread} thông báo chưa đọc`
      : 'Không có thông báo mới';

    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'notification-empty';
      empty.innerHTML = '<span class="material-symbols-rounded">notifications_none</span><p>Không có thông báo mới</p>';
      list.appendChild(empty);
      return;
    }

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = `notification-item${item.read ? '' : ' unread'}`;
      row.dataset.notificationId = item.id;
      row.innerHTML = '<span class="notification-icon"><span class="material-symbols-rounded">notifications</span></span>';

      const content = document.createElement('div');
      content.className = 'notification-content';
      const title = document.createElement('strong');
      title.textContent = item.title;
      const message = document.createElement('p');
      message.textContent = item.message;
      content.append(title, message);
      if (item.date) {
        const time = document.createElement('small');
        time.className = 'notification-time';
        time.textContent = item.date;
        content.appendChild(time);
      }
      row.appendChild(content);
      row.addEventListener('click', () => markNotificationRead(item.id));
      list.appendChild(row);
    });
  }

  async function markNotificationRead(id) {
    const database = getNotificationDatabase();
    if (!database || !id) return;
    try {
      await database.collection('notifications').doc(id).update({
        read: true,
        isRead: true,
        readAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.warn('Không thể đánh dấu thông báo:', error);
    }
  }

  async function markAllNotificationsRead() {
    const database = getNotificationDatabase();
    const user = typeof auth !== 'undefined' && auth ? auth.currentUser : null;
    if (!database || !user) return;
    try {
      const snapshot = await database.collection('notifications').get();
      const batch = database.batch();
      snapshot.forEach(doc => {
        const data = doc.data() || {};
        const recipient = data.userId || data.uid || data.recipientId;
        const isForUser = !recipient || recipient === user.uid;
        if (isForUser && data.read !== true && data.isRead !== true) {
          batch.update(doc.ref, {
            read: true,
            isRead: true,
            readAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      });
      await batch.commit();
    } catch (error) {
      console.warn('Không thể đánh dấu tất cả thông báo:', error);
    }
  }

  function initNotifications() {
    const noticeBtn = document.getElementById('noticeBtn');
    const panel = document.getElementById('notificationPanel');
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (!noticeBtn || !panel) return;

    noticeBtn.addEventListener('click', event => {
      event.stopPropagation();
      const isHidden = panel.hasAttribute('hidden');
      panel.toggleAttribute('hidden', !isHidden);
      noticeBtn.setAttribute('aria-expanded', String(isHidden));
    });

    document.addEventListener('click', event => {
      if (!panel.contains(event.target) && !noticeBtn.contains(event.target)) {
        panel.setAttribute('hidden', '');
        noticeBtn.setAttribute('aria-expanded', 'false');
      }
    });

    if (markAllBtn) {
      markAllBtn.addEventListener('click', async event => {
        event.stopPropagation();
        await markAllNotificationsRead();
      });
    }

    const database = getNotificationDatabase();
    if (!database) {
      renderNotifications([]);
      return;
    }

    database.collection('notifications').onSnapshot(snapshot => {
      const user = typeof auth !== 'undefined' && auth ? auth.currentUser : null;
      const items = [];
      snapshot.forEach(doc => {
        const data = doc.data() || {};
        const recipient = data.userId || data.uid || data.recipientId;
        if (recipient && (!user || recipient !== user.uid)) return;
        items.push({
          id: doc.id,
          title: notificationValue(data, ['title', 'subject', 'name'], 'Thông báo'),
          message: notificationValue(data, ['message', 'body', 'content', 'text'], 'Bạn có thông báo mới.'),
          date: formatNotificationDate(data.createdAt || data.created || data.timestamp),
          read: data.read === true || data.isRead === true
        });
      });
      items.sort((a, b) => Number(b.read) - Number(a.read));
      renderNotifications(items.slice(0, 30));
    }, error => {
      console.warn('Không thể tải thông báo:', error);
      renderNotifications([]);
    });
  }
})();