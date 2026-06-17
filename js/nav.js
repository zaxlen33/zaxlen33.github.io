// Apply theme immediately to html element to prevent visual flash
(function () {
  const savedTheme = localStorage.getItem('ue-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

/**
 * nav.js — Shared Navigation Component for UE Guild Dashboard
 * Injects sidebar, overlay, and top-bar into every page.
 * Must be loaded AFTER i18n.js.
 */

(function () {

  /* ── Nav items config ── */
  // Detect if we are inside the pages/ subfolder
  const _inPages = window.location.pathname.includes('/pages/');
  const _base = _inPages ? './' : './pages/';
  const _home = _inPages ? '../index.html' : './index.html';

  const NAV_ITEMS = [
    { href: _home,                    icon: '🏠',  key: 'nav_home'     },
    { href: _base + 'war.html',      icon: '⚔️',  key: 'nav_war'      },
    { href: _base + 'hunt.html',     icon: '🦅',  key: 'nav_hunt'     },
    { href: _base + 'festival.html', icon: '🎪',  key: 'nav_festival' },
    { href: _base + 'rankings.html', icon: '🏆',  key: 'nav_rankings' },
    { href: _base + 'members.html',  icon: '👥',  key: 'nav_members'  },
    { href: _base + 'tools.html',    icon: '🛠️', key: 'nav_tools'    },
    { href: _base + 'admin.html',    icon: '⚙️',  key: 'nav_admin'    }
  ];

  /* ── Determine active page ── */
  function activePage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  /* ── Build nav links HTML ── */
  function buildLinks(t) {
    const page = activePage();
    return NAV_ITEMS.map(item => {
      const isActive = item.href.includes(page) ? 'active' : '';
      const label = (typeof t === 'function') ? t(item.key) : item.key;
      // Strip any leading emoji from the translation (keep our icon consistent)
      const text = label.replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '');
      return `
        <li>
          <a href="${item.href}" class="nav-link ${isActive}">
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-text" data-i18n="${item.key}">${text}</span>
          </a>
        </li>`;
    }).join('');
  }

  /* ── Inject sidebar HTML ── */
  function inject() {
    // Avoid double-inject
    if (document.getElementById('ue-sidebar')) return;

    const currentTheme = localStorage.getItem('ue-theme') || 'dark';
    const themeIcon = currentTheme === 'light' ? '🌙' : '☀️';

    const html = `
      <!-- ── Sidebar overlay (mobile) ── -->
      <div id="sidebar-overlay" class="sidebar-overlay" aria-hidden="true"></div>

      <!-- ── Sidebar ── -->
      <aside id="ue-sidebar" class="sidebar" aria-label="Main navigation">
        <div class="sidebar-header">
          <a href="${_home}" class="sidebar-brand">
            <span class="sidebar-logo">🏰</span>
            <span class="sidebar-title">UE Guild</span>
          </a>
          <button class="sidebar-close" id="sidebar-close" aria-label="Close menu">✕</button>
        </div>

        <nav class="sidebar-nav">
          <ul id="sidebar-links">${buildLinks(window.t)}</ul>
        </nav>

        <div class="sidebar-footer">
          <div class="lang-switcher-container" id="sidebar-lang"></div>
        </div>
      </aside>

      <!-- ── Top bar (always visible) ── -->
      <header class="topbar" id="ue-topbar">
        <button class="topbar-hamburger" id="sidebar-open" aria-label="Open menu" aria-expanded="false">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>

        <a href="${_home}" class="topbar-brand">
          <span class="topbar-logo">🏰</span>
          <span class="topbar-title">UE <span>Guild</span></span>
        </a>

        <div class="topbar-right">
          <div class="lang-switcher-container" id="topbar-lang"></div>
          <button class="theme-toggle-btn" aria-label="Toggle theme" title="Toggle light/dark mode">${themeIcon}</button>
        </div>
      </header>
    `;

    // Insert before <body>'s first child
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  /* ── Wire up open/close interactions ── */
  function wireEvents() {
    const sidebar = document.getElementById('ue-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const openBtn = document.getElementById('sidebar-open');
    const closeBtn = document.getElementById('sidebar-close');

    if (!sidebar || !overlay || !openBtn) return;

    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('visible');
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Close on nav link click (mobile)
    document.querySelectorAll('#sidebar-links .nav-link').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth < 1024) closeSidebar();
      });
    });

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSidebar();
    });

    // Theme Toggle Click Logic
    const toggleButtons = document.querySelectorAll('.theme-toggle-btn');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('ue-theme', newTheme);
        
        // Update all theme toggle buttons' icons
        const newIcon = newTheme === 'light' ? '🌙' : '☀️';
        document.querySelectorAll('.theme-toggle-btn').forEach(b => {
          b.textContent = newIcon;
        });

        // Trigger custom event so other components (like Chart.js) can update
        window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: newTheme } }));
      });
    });
  }

  /* ── Mirror lang switcher into sidebar footer ── */
  function moveLangSwitcher() {
    const sidebarLang = document.getElementById('sidebar-lang');
    if (!sidebarLang) return;

    let attempts = 0;
    const poll = setInterval(() => {
      const select = document.getElementById('lang-switcher');
      if (select) {
        clearInterval(poll);
        if (!sidebarLang.querySelector('select')) {
          const clone = select.cloneNode(true);
          clone.id = 'lang-switcher-sidebar';
          clone.value = select.value; // Sync initial value
          clone.addEventListener('change', e => window.i18n?.setLanguage(e.target.value));
          sidebarLang.appendChild(clone);
        }
      }
      if (++attempts > 50) clearInterval(poll); // give up after ~2.5s
    }, 50);
  }

  /* ── Re-render nav links when language changes ── */
  function watchLanguage() {
    // Re-render on language switch
    window.addEventListener('languageChanged', () => {
      const links = document.getElementById('sidebar-links');
      if (links) {
        links.innerHTML = buildLinks(window.t);
        links.querySelectorAll('.nav-link').forEach(a => {
          a.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
              document.getElementById('ue-sidebar')?.classList.remove('open');
              document.getElementById('sidebar-overlay')?.classList.remove('visible');
              document.body.style.overflow = '';
            }
          });
        });
      }
      const sel = document.getElementById('lang-switcher-sidebar');
      if (sel && window.i18n) sel.value = window.i18n.currentLang;
    });

    // Also re-render once translations first become available
    let polled = 0;
    const pollForI18n = setInterval(() => {
      if (window.i18n && window.i18n.data && Object.keys(window.i18n.data).length > 0) {
        clearInterval(pollForI18n);
        const links = document.getElementById('sidebar-links');
        if (links) links.innerHTML = buildLinks(window.t);
      }
      if (++polled > 100) clearInterval(pollForI18n);
    }, 50);
  }

  /* ── Init ── */
  function init() {
    inject();
    wireEvents();
    moveLangSwitcher();
    watchLanguage();
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
