// ==========================================
// 多語系系統 (i18n)
// ==========================================

class I18n {
  constructor() {
    this.currentLang = this.getStoredLang() || 'zh-tw';
    this.translations = {};
    this.allowedLangs = ['zh-tw', 'zh-cn', 'en', 'ja', 'ko'];
  }

  // 從 localStorage 取得已儲存的語言
  getStoredLang() {
    return localStorage.getItem('selectedLang');
  }

  // 儲存語言到 localStorage
  setStoredLang(lang) {
    localStorage.setItem('selectedLang', lang);
  }

  // 載入語言 JSON 檔案
  async loadLanguage(lang) {
    console.log('=== 開始載入語言 ===', lang); 
    
    // 驗證語言代碼
    if (!this.allowedLangs.includes(lang)) {
      console.error(`Invalid language: ${lang}`);
      lang = 'zh-tw';
    }

    try {
      console.log('正在 fetch:', `./lang/${lang}.json`); 
      const response = await fetch(`./lang/${lang}.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to load language file: ${lang}`);
      }
      
      this.translations = await response.json();
      console.log('載入成功，翻譯內容:', this.translations); 
      
      this.currentLang = lang;
      this.setStoredLang(lang);
      this.applyTranslations();
      this.updateLangSelector();
      
      console.log('=== 語言切換完成 ===', lang); 
    } catch (error) {
      console.error('Error loading language:', error);
      if (lang !== 'zh-tw') {
        this.loadLanguage('zh-tw');
      }
    }
  }

  // 根據 key 取得翻譯文字
  getTranslation(key) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // 找不到就回傳 key
      }
    }

    return value || key;
  }

  // 套用翻譯到所有有 data-i18n 的元素
  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getTranslation(key);
      
      // 👇 加入防護罩：確保 translation 是字串才執行 .includes()
      if (typeof translation === 'string') {
        // 如果是 input/textarea 的 placeholder
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = translation;
        } 
        // 如果內容包含 HTML（如 <br>）
        else if (translation.includes('<br')) {
          element.innerHTML = translation;
        }
        // 一般文字
        else {
          element.textContent = translation;
        }
      } else {
        // 如果抓到物件或 undefined，印出警告但不讓程式崩潰
        console.warn(`翻譯金鑰 [${key}] 格式錯誤或未對應到字串，保留畫面原文字。`);
        element.innerHTML = element.innerHTML;
      }
    });

    // 更新 HTML lang 屬性
    document.documentElement.lang = this.currentLang;
  }

  // 更新語言選擇器的顯示
  updateLangSelector() {
    const langNames = {
      'zh-tw': '繁體中文',
      'zh-cn': '简体中文',
      'en': 'English',
      'ja': '日本語',
      'ko': '한국어'
    };

    // 更新桌機版選擇器（Footer）
    const selectSelected = document.querySelector('.select-selected');
    if (selectSelected) {
      selectSelected.textContent = langNames[this.currentLang];
    }

    // 更新手機版 Modal 的勾選狀態
    document.querySelectorAll('.lang-option').forEach(option => {
      const value = option.getAttribute('data-lang'); 
      const checkMark = option.querySelector('.lang-check');
      if (value === this.currentLang) {
        option.classList.add('active');
        if (checkMark) checkMark.textContent = '✓';
      } else {
        option.classList.remove('active');
        if (checkMark) checkMark.textContent = '';
      }
    });

    // 更新 Header 導航列的語言連結狀態更新
    document.querySelectorAll('.language-item .lang-switch').forEach(link => {
      const value = link.getAttribute('data-lang');
      if (value === this.currentLang) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // 切換語言
  changeLanguage(lang) {
    // 檢查語言代碼是否有效
    if (!lang || !this.allowedLangs.includes(lang)) {
      console.error('Invalid language code:', lang);
      return;
    }
    
    // 防止重複載入相同語言
    if (lang === this.currentLang) {
      console.log('Already using language:', lang);
      return;
    }
    
    console.log('Changing language to:', lang); 
    this.loadLanguage(lang);
  }
}

// 初始化多語系
const i18n = new I18n();
// 在 i18n.js 最上方加上這個全域標記
let eventsBound = false; 

// 頁面載入時套用語言
document.addEventListener('DOMContentLoaded', function() {
  // 如果已經綁定過，直接返回
  if (eventsBound) {
    console.log('事件已綁定，跳過重複綁定');
    return;
  }
  
  eventsBound = true; 
  console.log('開始綁定事件監聽器'); 

  // 載入預設或已儲存的語言
  i18n.loadLanguage(i18n.currentLang);

  // 1. 綁定 Footer 語言切換（桌機版下拉選單）
  document.querySelectorAll('.select-items div').forEach(option => {
    option.addEventListener('click', function() {
      const lang = this.getAttribute('data-value');
      console.log('Footer 切換語言:', lang);
      if (lang) i18n.changeLanguage(lang);
    });
  });

  // 2. 綁定手機版 Modal 語言切換
  document.querySelectorAll('.lang-option').forEach(option => {
    let touchHandled = false;

    option.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      touchHandled = true;
      
      const lang = this.getAttribute('data-lang') || this.dataset.lang;
      console.log('Touch - 讀取到的語言:', lang, '完整元素:', this);
      
      if (!lang) {
        console.error('無法讀取 data-lang 屬性！', this);
        return;
      }
      
      if (i18n && i18n.allowedLangs.includes(lang)) {
        i18n.changeLanguage(lang);
      }
      
      const langModal = document.querySelector('.lang-modal');
      if (langModal) {
        langModal.classList.remove('active');
        document.body.style.overflow = '';
      }
      
      setTimeout(() => { touchHandled = false; }, 500);
    });

    option.addEventListener('click', function(e) {
      if (touchHandled) {
        e.preventDefault();
        return;
      }
      
      const lang = this.getAttribute('data-lang') || this.dataset.lang;
      console.log('Click - 讀取到的語言:', lang, '完整元素:', this);
      
      if (!lang) {
        console.error('無法讀取 data-lang 屬性！', this);
        return;
      }
      
      if (i18n && i18n.allowedLangs.includes(lang)) {
        i18n.changeLanguage(lang);
      }
      
      const langModal = document.querySelector('.lang-modal');
      if (langModal) {
        langModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // 3. 綁定 Header 導航列的語言切換
  document.querySelectorAll('.language-item .lang-switch').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const lang = this.getAttribute('data-lang');
      console.log('Header 切換語言:', lang);
      if (lang) i18n.changeLanguage(lang);
      
      const dropdown = this.closest('.dropdown-menu');
      if (dropdown) {
        dropdown.classList.remove('show');
      }
    });
  });

  console.log('所有事件綁定完成'); 
});

// 暴露到全域
window.i18n = i18n;