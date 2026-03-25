// ホーム画面
export function renderHome(): string {
  return `
    <div class="page">
      <header class="header">
        <h1>Mobile PWA</h1>
      </header>
      
      <main class="main">
        <div class="welcome-card">
          <h2>ようこそ</h2>
          <p>これはモバイル向けPWAの最小実装です。</p>
        </div>
        
        <div class="features">
          <div class="feature-item">
            <h3>📱 レスポンシブ</h3>
            <p>モバイルファーストデザイン</p>
          </div>
          
          <div class="feature-item">
            <h3>⚡ 高速</h3>
            <p>Service Workerによるキャッシュ</p>
          </div>
          
          <div class="feature-item">
            <h3>📦 インストール可能</h3>
            <p>条件がそろえば Chrome から追加可能</p>
          </div>
        </div>

        <section class="install-card">
          <h2>インストール診断</h2>
          <div class="install-status" data-install-status></div>
          <button class="btn btn-primary btn-block" data-install-button onclick="promptInstallApp()">
            アプリをインストール
          </button>
          <ul class="install-checks" data-install-checks></ul>
        </section>
        
        <button class="btn btn-primary" onclick="location.hash='settings'">
          設定画面へ
        </button>
      </main>
    </div>
  `;
}
