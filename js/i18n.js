/**
 * i18n.js — Lightweight Internationalization for UE Guild Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
  window.i18n = {
    languages: ['en', 'es', 'fr', 'pt', 'ja', 'vi', 'zh'],
    currentLang: localStorage.getItem('ue_guild_lang') || 'en',
    data: {},

    async init() {
      // 1. Determine language BEFORE fetching
      if (!localStorage.getItem('ue_guild_lang')) {
        const browserLang = navigator.language.slice(0, 2).toLowerCase();
        if (this.languages.includes(browserLang)) {
          this.currentLang = browserLang;
        }
      }

      try {
        const response = await fetch('./js/translations.json?v=' + Date.now());
        this.data = await response.json();
        
        // 3. Normalize currentLang (ensure it exists in data, else fallback to 'en')
        const shortLang = this.currentLang.split('-')[0].toLowerCase();
        if (this.data[this.currentLang]) {
          // Keep as is
        } else if (this.data[shortLang]) {
          this.currentLang = shortLang;
        } else {
          this.currentLang = 'en';
        }

        this.applyTranslations();

        // 2. Initialise switchers
        const tryInit = () => {
          const container = document.getElementById('topbar-lang')
                         || document.querySelector('.lang-switcher-container');
          if (container) {
            this.initSwitcher();
          } else {
            requestAnimationFrame(tryInit);
          }
        };
        requestAnimationFrame(tryInit);

      } catch (err) {
        console.error('Failed to load translations:', err);
      }
    },

    t(key, args = null) {
      if (!this.data || Object.keys(this.data).length === 0) return key;
      const langData = this.data[this.currentLang] || this.data['en'] || {};
      let translation = langData[key] || (this.data['en'] && this.data['en'][key]) || key;
      
      if (args) {
        for (const [k, v] of Object.entries(args)) {
          translation = translation.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
      }
      return translation;
    },

    applyTranslations() {
      if (!this.data || !this.currentLang) return;

      // Ensure all switchers reflect the current language
      document.querySelectorAll('.lang-select').forEach(sel => {
        sel.value = this.currentLang;
      });
      
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        let translation = this.t(key);
        if (!translation || translation === key) return;

        // Argument replacement
        const args = el.getAttribute('data-i18n-args');
        if (args) {
          try {
            const parsed = JSON.parse(args);
            for (const [k, v] of Object.entries(parsed)) {
              translation = translation.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
            }
          } catch (e) {}
        }

        // Surgical update: if element has children (like icons/spans), only update text nodes
        if (el.children.length > 0) {
          let foundText = false;
          Array.from(el.childNodes).forEach(node => {
            // nodeType 3 is Text
            if (node.nodeType === 3 && node.textContent.trim().length > 1) {
              node.textContent = translation;
              foundText = true;
            }
          });
          // If no significant text node found, we check if there's a nav-text span
          if (!foundText) {
            const textSpan = el.querySelector('.nav-text, .nav-label, .stat-label');
            if (textSpan) {
               textSpan.innerText = translation;
            }
          }
        } else {
          // No children, safe to update content
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translation;
          } else {
            // Use innerText to avoid accidental HTML injection and keep it clean
            el.innerText = translation;
          }
        }
      });

      const pageTitleKey = document.querySelector('h1[data-i18n]')?.getAttribute('data-i18n');
      if (pageTitleKey) {
        document.title = this.t(pageTitleKey) + ' | UE Guild';
      }
      document.documentElement.lang = this.currentLang;
    },

    setLanguage(lang) {
      if (this.languages.includes(lang)) {
        this.currentLang = lang;
        localStorage.setItem('ue_guild_lang', lang);
        
        // Sync all switchers on the page
        document.querySelectorAll('.lang-select').forEach(sel => {
          sel.value = lang;
        });

        this.applyTranslations();
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
      }
    },

    initSwitcher() {
      // Prefer the topbar lang container injected by nav.js, then fall back
      const container = document.getElementById('topbar-lang')
                     || document.querySelector('.lang-switcher-container');
      if (container) {
        container.innerHTML = `
          <select class="lang-select" id="lang-switcher">
            <option value="en">🇬🇧 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="fr">🇫🇷 FR</option>
            <option value="pt">🇧🇷 PT</option>
            <option value="vi">🇻🇳 VI</option>
            <option value="ja">🇯🇵 JA</option>
            <option value="zh">🇨🇳 ZH</option>
          </select>
        `;
        const switcher = document.getElementById('lang-switcher');
        switcher.value = this.currentLang;
        switcher.addEventListener('change', (e) => {
          this.setLanguage(e.target.value);
        });
      }
    }
  };

  // Start initialization
  window.i18n.init();
});

/** Global helper function */
window.t = (key, args) => window.i18n ? window.i18n.t(key, args) : key;
