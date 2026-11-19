const KEY = 'theme';
const root = document.documentElement;
const get = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

root.dataset.theme = get() === 'dark' ? 'dark' : 'light';

export function initThemeToggle(btn) {
  const sync = () => { btn.setAttribute('aria-pressed', root.dataset.theme === 'dark'); };
  btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, root.dataset.theme); } catch { /* private mode: choice lasts this page only */ }
    sync();
  });
  sync();
}
