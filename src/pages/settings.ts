// 設定画面
export function renderSettings(): string {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  
  return `
    <div class="page">
      <header class="header">
        <button class="btn btn-back" onclick="location.hash='home'">
          ← 戻る
        </button>
        <h1>設定</h1>
      </header>
      
      <main class="main">
        <div class="settings-card">
          <div class="setting-item">
            <label class="setting-label">
              <span>ダークモード</span>
              <input 
                type="checkbox" 
                class="setting-toggle"
                ${isDarkMode ? 'checked' : ''} 
                onchange="toggleDarkMode(this.checked)"
              />
            </label>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">
              <span>通知</span>
              <input 
                type="checkbox" 
                class="setting-toggle"
                onchange="toggleNotifications(this.checked)"
              />
            </label>
          </div>
        </div>
        
        <div class="info-section">
          <h3>アプリ情報</h3>
          <p>バージョン: 1.0.0</p>
          <p>最終更新: ${new Date().toLocaleDateString('ja-JP')}</p>
        </div>
      </main>
    </div>
  `;
}

// ダークモード切り替え関数をグローバルに公開
(window as any).toggleDarkMode = (enabled: boolean) => {
  localStorage.setItem('darkMode', enabled.toString());
  document.body.classList.toggle('dark-mode', enabled);
};

// 通知切り替え関数をグローバルに公開  
(window as any).toggleNotifications = (enabled: boolean) => {
  console.log('通知設定:', enabled ? '有効' : '無効');
  // 実装は省略（デモ用）
};