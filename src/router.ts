// シンプルなハッシュルーター
export class Router {
  private routes: { [key: string]: () => void } = {};
  private currentRoute = '';

  constructor() {
    // ハッシュ変更イベントをリッスン
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  // ルート登録後に呼び出して初期ルートを処理する
  start(): void {
    this.handleRoute();
  }

  // ルート登録
  register(path: string, handler: () => void): void {
    this.routes[path] = handler;
  }

  // 現在のルートを処理
  private handleRoute(): void {
    const hash = window.location.hash.slice(1) || 'home';
    this.currentRoute = hash;
    
    const handler = this.routes[hash];
    if (handler) {
      handler();
    } else {
      // デフォルトルートにリダイレクト
      this.navigate('home');
    }
  }

  // プログラムによるナビゲーション
  navigate(path: string): void {
    window.location.hash = path;
  }

  // 現在のルートを取得
  getCurrentRoute(): string {
    return this.currentRoute;
  }
}