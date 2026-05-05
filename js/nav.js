(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;

    // --- Masthead collapse on scroll ---
    var masthead = document.getElementById('siteMasthead');
    if (masthead) {
      var _mastheadCollapsed = false;
      function _onMastheadScroll() {
        var should = window.scrollY > 120;
        if (should !== _mastheadCollapsed) {
          _mastheadCollapsed = should;
          masthead.classList.toggle('is-collapsed', _mastheadCollapsed);
        }
      }
      window.addEventListener('scroll', _onMastheadScroll, { passive: true });
      _onMastheadScroll();
    }

    // --- Progress bar (shared across all pages) ---
    var progressBar = document.getElementById('progressBar');
    if (progressBar) {
      function updateProgress() {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
      }
      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }

    // --- Hamburger menu ---
    var toggle = nav.querySelector('.nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var isOpen = nav.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      nav.querySelectorAll('.nav-links .nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
          nav.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });

      document.addEventListener('click', function (e) {
        if (!nav.contains(e.target)) {
          nav.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // --- Tippy.js tooltips ---
    if (typeof tippy !== 'undefined') {
      tippy('[data-tooltip]', {
        content: function (ref) { return ref.getAttribute('data-tooltip'); },
        placement: 'bottom',
        arrow: true,
        theme: 'light-border',
        animation: 'shift-away',
        duration: [150, 100],
        offset: [0, 8],
        maxWidth: 240,
      });
    }

    // --- About modal ---
    var aboutModal = document.getElementById('aboutModal');
    var aboutClose = document.getElementById('aboutCloseBtn');
    if (aboutModal && aboutClose) {
      var lastFocus = null;
      function openAbout() {
        aboutModal.hidden = false;
        document.body.style.overflow = 'hidden';
        aboutClose.focus();
      }
      function closeAbout() {
        aboutModal.hidden = true;
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
      }
      document.querySelectorAll('.nav-about-btn, #bottomAboutBtn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          lastFocus = btn;
          openAbout();
        });
      });
      aboutClose.addEventListener('click', closeAbout);
      aboutModal.addEventListener('click', function (e) {
        if (e.target && e.target.dataset.closeModal === 'true') closeAbout();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !aboutModal.hidden) closeAbout();
      });
    }
  });
})();
