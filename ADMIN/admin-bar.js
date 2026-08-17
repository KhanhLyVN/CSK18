(() => {
  'use strict';

  const getInitials = (name) => (String(name || 'Admin').trim().split(/\s+/).filter(Boolean).slice(-2).map(part => part[0]).join('').slice(0, 2) || 'AD').toUpperCase();

  const install = (markup) => {
    const host = document.getElementById('adminBar');
    const main = document.querySelector('main.main-content');
    if (!host || !main) return;
    host.innerHTML = markup;
    const topbar = host.querySelector('.topbar');
    if (topbar) main.prepend(topbar);

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
    sidebar?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeSidebar));
    window.addEventListener('resize', () => { if (window.innerWidth > 780) closeSidebar(); });

    const notificationButton = host.querySelector('#noticeBtn');
    const notificationPanel = host.querySelector('#notificationPanel');
    notificationButton?.addEventListener('click', () => {
      const isOpen = notificationPanel?.hidden === false;
      if (notificationPanel) notificationPanel.hidden = isOpen;
      notificationButton.setAttribute('aria-expanded', String(!isOpen));
    });
    document.addEventListener('click', event => {
      if (notificationPanel && !notificationPanel.hidden && !event.target.closest('.notification-wrapper')) {
        notificationPanel.hidden = true;
        notificationButton?.setAttribute('aria-expanded', 'false');
      }
    });

    const updateIdentity = (user) => {
      const name = user?.displayName || user?.email || 'Administrator';
      const initials = getInitials(name);
      const set = (id, value) => { const node = host.querySelector(id); if (node) node.textContent = value; };
      set('#sidebarUserName', name);
      set('#sidebarAvatar', initials);
      set('#topAdminName', name);
      set('#topAdminAvatar', initials);
    };
    if (typeof firebase !== 'undefined' && firebase.auth) firebase.auth().onAuthStateChanged(updateIdentity);

    host.querySelector('#sidebarLogoutBtn')?.addEventListener('click', async () => {
      try { if (typeof firebase !== 'undefined' && firebase.auth) await firebase.auth().signOut(); } finally { window.location.replace('/CS/login/login.html'); }
    });
    document.dispatchEvent(new CustomEvent('adminbar:ready'));
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const host = document.getElementById('adminBar');
    if (!host) return;
    try {
      const response = await fetch('admin-bar.html', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      install(await response.text());
    } catch (error) {
      console.error('Không thể tải Admin Bar dùng chung.', error);
    }
  });
})();

