interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type InstallStatus = {
  canPromptInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isSecureContext: boolean;
  hasManifestLink: boolean;
  hasServiceWorkerSupport: boolean;
  hasServiceWorkerController: boolean;
  serviceWorkerScope: string | null;
  hasUserInteraction: boolean;
  engagementSeconds: number;
  lastPromptOutcome: 'accepted' | 'dismissed' | null;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let listenersBound = false;
let visibleSince: number | null = null;

const ENGAGEMENT_SECONDS_KEY = 'pwa-engagement-seconds';
const ENGAGEMENT_INTERACTION_KEY = 'pwa-engagement-interacted';

const status: InstallStatus = {
  canPromptInstall: false,
  isInstalled: false,
  isStandalone: false,
  isSecureContext: false,
  hasManifestLink: false,
  hasServiceWorkerSupport: false,
  hasServiceWorkerController: false,
  serviceWorkerScope: null,
  hasUserInteraction: false,
  engagementSeconds: 0,
  lastPromptOutcome: null,
};

function readEngagementSeconds(): number {
  const rawValue = localStorage.getItem(ENGAGEMENT_SECONDS_KEY);
  const parsedValue = Number(rawValue ?? '0');
  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
}

function writeEngagementSeconds(seconds: number): void {
  localStorage.setItem(ENGAGEMENT_SECONDS_KEY, String(Math.max(0, seconds)));
}

function persistVisibleDuration(): void {
  if (visibleSince === null) {
    return;
  }

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - visibleSince) / 1000));
  if (elapsedSeconds > 0) {
    const updatedSeconds = readEngagementSeconds() + elapsedSeconds;
    writeEngagementSeconds(updatedSeconds);
  }

  visibleSince = null;
}

function startVisibleTimer(): void {
  if (document.visibilityState === 'visible' && visibleSince === null) {
    visibleSince = Date.now();
  }
}

function markUserInteraction(): void {
  if (!status.hasUserInteraction) {
    localStorage.setItem(ENGAGEMENT_INTERACTION_KEY, 'true');
    status.hasUserInteraction = true;
    syncInstallUi();
  }
}

function isStandaloneMode(): boolean {
  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  const iosStandalone = 'standalone' in navigator
    && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mediaQuery.matches || iosStandalone;
}

function refreshStatus(): void {
  status.isStandalone = isStandaloneMode();
  status.isInstalled = status.isStandalone;
  status.isSecureContext = window.isSecureContext;
  status.hasManifestLink = Boolean(document.querySelector('link[rel="manifest"]'));
  status.hasServiceWorkerSupport = 'serviceWorker' in navigator;
  status.hasServiceWorkerController = Boolean(navigator.serviceWorker?.controller);
  status.hasUserInteraction = localStorage.getItem(ENGAGEMENT_INTERACTION_KEY) === 'true';
  status.engagementSeconds = readEngagementSeconds()
    + (visibleSince !== null && document.visibilityState === 'visible'
      ? Math.floor((Date.now() - visibleSince) / 1000)
      : 0);
}

function renderInstallDiagnostics(): void {
  const statusElement = document.querySelector<HTMLElement>('[data-install-status]');
  const buttonElement = document.querySelector<HTMLButtonElement>('[data-install-button]');
  const listElement = document.querySelector<HTMLElement>('[data-install-checks]');

  if (!statusElement || !buttonElement || !listElement) {
    return;
  }

  let headline = 'インストール条件を確認中';
  let detail = 'Chrome から install prompt が取得できるか待っています。';

  if (status.isInstalled) {
    headline = 'インストール済みとして判定';
    detail = 'standalone 表示です。ブラウザ側の install メニューは表示されません。';
  } else if (status.canPromptInstall) {
    headline = 'インストール可能';
    detail = '下のボタンで Chrome のインストールダイアログを開けます。';
  } else if (!status.isSecureContext) {
    headline = 'HTTPS が必要';
    detail = 'Android Chrome では HTTPS でないとインストールできません。';
  } else if (!status.hasServiceWorkerController) {
    headline = 'Service Worker の制御待ち';
    detail = '一度再読み込みしてから install 可否を再確認してください。';
  } else if (!status.hasUserInteraction || status.engagementSeconds < 30) {
    headline = 'Chrome の利用条件を蓄積中';
    detail = '画面を1回タップして、30秒以上このページを開いたままにしてください。';
  } else {
    headline = 'Chrome の install 判定待ち';
    detail = 'install prompt が未取得です。下の診断項目を確認してください。';
  }

  statusElement.innerHTML = `
    <strong>${headline}</strong>
    <p>${detail}</p>
  `;

  buttonElement.disabled = !status.canPromptInstall;
  buttonElement.textContent = status.isInstalled ? 'インストール済み' : 'アプリをインストール';

  const manifestHref = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href ?? '未検出';
  const checks = [
    ['HTTPS', status.isSecureContext, window.location.origin],
    ['Manifest', status.hasManifestLink, manifestHref],
    ['Service Worker 対応', status.hasServiceWorkerSupport, status.hasServiceWorkerSupport ? 'supported' : 'unsupported'],
    ['Service Worker 制御', status.hasServiceWorkerController, status.serviceWorkerScope ?? '未制御'],
    ['Tap / click 済み', status.hasUserInteraction, status.hasUserInteraction ? '済み' : '未操作'],
    ['30秒閲覧', status.engagementSeconds >= 30, `${status.engagementSeconds}s / 30s`],
    ['install prompt', status.canPromptInstall, status.lastPromptOutcome ? `last: ${status.lastPromptOutcome}` : '未取得'],
    ['display-mode standalone', status.isStandalone, status.isStandalone ? 'active' : 'browser'],
  ];

  listElement.innerHTML = checks.map(([label, ok, info]) => `
    <li class="install-check-item">
      <span>${label}</span>
      <span class="install-check-state ${ok ? 'check-ok' : 'check-ng'}">${ok ? 'OK' : 'NG'}</span>
      <small>${info}</small>
    </li>
  `).join('');
}

function syncInstallUi(): void {
  refreshStatus();
  renderInstallDiagnostics();
}

export function initializeInstallSupport(): void {
  if (listenersBound) {
    syncInstallUi();
    return;
  }

  listenersBound = true;
  refreshStatus();
  startVisibleTimer();

  const markInteractionOnce = () => {
    markUserInteraction();
    window.removeEventListener('pointerdown', markInteractionOnce);
    window.removeEventListener('keydown', markInteractionOnce);
  };

  window.addEventListener('pointerdown', markInteractionOnce);
  window.addEventListener('keydown', markInteractionOnce);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    status.canPromptInstall = true;
    status.lastPromptOutcome = null;
    syncInstallUi();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    status.canPromptInstall = false;
    status.lastPromptOutcome = 'accepted';
    syncInstallUi();
  });

  window.matchMedia('(display-mode: standalone)').addEventListener('change', () => {
    syncInstallUi();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      persistVisibleDuration();
    } else {
      startVisibleTimer();
    }
    syncInstallUi();
  });

  window.addEventListener('pagehide', () => {
    persistVisibleDuration();
  });

  window.setInterval(() => {
    syncInstallUi();
  }, 1000);

  navigator.serviceWorker?.ready
    .then((registration) => {
      status.serviceWorkerScope = registration.scope;
      syncInstallUi();
    })
    .catch(() => {
      syncInstallUi();
    });

  syncInstallUi();
}

export function mountInstallDiagnostics(): void {
  syncInstallUi();
}

export async function promptInstall(): Promise<void> {
  if (!deferredInstallPrompt) {
    syncInstallUi();
    return;
  }

  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  status.canPromptInstall = false;

  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  status.lastPromptOutcome = choice.outcome;
  syncInstallUi();
}
