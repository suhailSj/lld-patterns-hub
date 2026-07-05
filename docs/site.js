// Single global script for the whole site: theme toggle, mobile nav drawer,
// collapsible sidebar, code-tab switching (with cross-block language memory),
// and copy-to-clipboard buttons on code blocks. Vanilla JS, no build step needed.

function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('lld-theme', next);
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}

function initNavDrawer() {
  const toggle = document.getElementById('nav-toggle');
  const drawer = document.getElementById('nav-drawer');
  if (!toggle || !drawer) return;
  toggle.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? '✕' : '☰';
  });
  drawer.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      drawer.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
    })
  );
}

function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.sidebar-toggle');
  if (!sidebar || !toggleBtn) return;
  toggleBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });
}

// Preferred language persists across every code-tabs block on the page,
// and across page loads, so readers stay in "Python mode" or "Java mode".
function applyLangToGroup(group, lang) {
  const buttons = group.querySelectorAll(':scope > .code-tabs-header > .tab-btn');
  const panels = group.querySelectorAll(':scope > .code-tabs-body > [data-language]');
  let matched = false;
  buttons.forEach((b) => {
    const isMatch = b.dataset.lang === lang;
    b.classList.toggle('active', isMatch);
    if (isMatch) matched = true;
  });
  panels.forEach((p) => {
    p.hidden = p.dataset.language !== lang;
  });
  if (!matched && buttons[0]) {
    buttons[0].classList.add('active');
    if (panels[0]) panels[0].hidden = false;
  }
}

function initCodeTabs() {
  const groups = document.querySelectorAll('.code-tabs');
  const preferred = localStorage.getItem('lld-lang') || 'python';
  groups.forEach((group) => applyLangToGroup(group, preferred));

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const group = btn.closest('.code-tabs');
    if (!group) return;
    const lang = btn.dataset.lang;
    localStorage.setItem('lld-lang', lang);
    document.querySelectorAll('.code-tabs').forEach((g) => applyLangToGroup(g, lang));
  });
}

function initCopyButtons() {
  document.querySelectorAll('pre').forEach((pre) => {
    if (pre.closest('.code-tabs-body') === null) return; // only wrap tabbed code blocks
    if (pre.parentElement.classList.contains('code-copy-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'code-copy-wrap';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      const code = pre.innerText;
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = 'Copied!';
      } catch {
        btn.textContent = 'Press ⌘/Ctrl+C';
      }
      setTimeout(() => (btn.textContent = 'Copy'), 1500);
    });
    wrap.appendChild(btn);
  });
}

function initFilterBoxes() {
  document.querySelectorAll('[data-filter-target]').forEach((input) => {
    const targetSelector = input.getAttribute('data-filter-target');
    const cards = document.querySelectorAll(targetSelector);
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      cards.forEach((card) => {
        const haystack = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
        card.style.display = haystack.includes(q) ? '' : 'none';
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavDrawer();
  initSidebar();
  initCodeTabs();
  initCopyButtons();
  initFilterBoxes();
});
