import './style.css';
import { initializeInstallSupport, mountInstallDiagnostics, promptInstall } from './install';
import { Router } from './router';
import { renderHome } from './pages/home';
import { renderSettings } from './pages/settings';

// アプリケーションの初期化
class App {
  private router: Router;
  private appElement: HTMLElement;

  constructor() {
    this.appElement = document.querySelector<HTMLDivElement>('#app')!;
    this.router = new Router();
    initializeInstallSupport();
    this.setupRoutes();
    this.router.start();
    this.initializeDarkMode();
    this.registerServiceWorker();
  }

  private setupRoutes(): void {
    // ルート登録
    this.router.register('home', () => {
      this.appElement.innerHTML = renderHome();
      mountInstallDiagnostics();
    });

    this.router.register('settings', () => {
      this.appElement.innerHTML = renderSettings();
    });
  }

  private initializeDarkMode(): void {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', isDarkMode);
  }

  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      addEventListener('load', () => {
        navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then((reg) => {
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing; if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // 既存 SW あり → 更新トーストを表示
                  this.showUpdateToast(nw);
                } else {
                  // 初回インストール → 自動で有効化
                  nw.postMessage('SKIP_WAITING');
                }
              }
            });
          });
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
      });
    }
  }

  private showUpdateToast(worker: ServiceWorker): void {
    const existing = document.getElementById('sw-update-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'sw-update-toast';
    toast.className = 'sw-update-toast';
    toast.innerHTML = `
      <span>アプリ更新があります</span>
      <button class="sw-update-btn" id="sw-update-apply">今すぐ反映</button>
      <button class="sw-update-btn sw-update-dismiss" id="sw-update-dismiss">後で</button>
    `;
    document.body.appendChild(toast);

    document.getElementById('sw-update-apply')!.addEventListener('click', () => {
      worker.postMessage('SKIP_WAITING');
      toast.remove();
    });
    document.getElementById('sw-update-dismiss')!.addEventListener('click', () => {
      toast.remove();
    });
  }
}

// アプリケーション開始
(window as Window & typeof globalThis & { promptInstallApp?: () => void }).promptInstallApp = () => {
  void promptInstall();
};

new App();
