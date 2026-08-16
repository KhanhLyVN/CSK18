(() => {
  const host = document.getElementById('sharedSidebar');
  if (!host) return;

  const page = document.body.dataset.adminPage ||
    ({
      '/ADMIN/homepage-ad.html': 'overview',
      '/ADMIN/accounts.html': 'accounts',
      '/ADMIN/activity-report.html': 'reports',
      '/ADMIN/settings.html': 'settings',
      '/ADMIN/system-log.html': 'logs'
    })[window.location.pathname] || '';

  const install = (markup) => {
    host.innerHTML = markup;
    const active = host.querySelector(`[data-page="${page}"]`);
    if (active) active.classList.add('active');

    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('adminSidebarBackdrop');
    const close = () => {
      sidebar?.classList.remove('open');
      if (backdrop) {
        backdrop.hidden = true;
        backdrop.classList.remove('open');
      }
    };
    menuBtn?.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      if (backdrop) backdrop.hidden = !sidebar?.classList.contains('open');
    });
    backdrop?.addEventListener('click', close);
    document.dispatchEvent(new CustomEvent('adminSidebarReady'));
  };

  // Synchronous loading keeps #adminSidebar available before page-specific scripts run.
  try {
    const request = new XMLHttpRequest();
    request.open('GET', new URL('sidebar.html', document.baseURI), false);
    request.send(null);
    if (request.status === 200 || request.status === 0) {
      install(request.responseText);
      return;
    }
  } catch (error) {
    console.warn('Không thể nạp sidebar dùng chung.', error);
  }

  fetch('sidebar.html')
    .then(response => response.text())
    .then(install)
    .catch(error => console.error('Không thể nạp sidebar dùng chung.', error));
})();
