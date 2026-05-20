import { ref, onMounted, shallowRef, markRaw } from 'vue';

function getWebApp() {
  return window.Telegram?.WebApp ?? null;
}

export function useTelegram() {
  const tg = shallowRef(null);
  const isReady = ref(false);

  onMounted(() => {
    const webApp = getWebApp();
    if (!webApp) {
      isReady.value = true;
      return;
    }

    try {
      tg.value = markRaw(webApp);
      webApp.ready();
      webApp.expand();

      if (typeof webApp.setHeaderColor === 'function') {
        try {
          webApp.setHeaderColor('#000000');
        } catch {
          /* not supported in older Telegram versions */
        }
      }

      if (typeof webApp.setBackgroundColor === 'function') {
        try {
          webApp.setBackgroundColor('#000000');
        } catch {
          /* not supported in older Telegram versions */
        }
      }
    } catch {
      /* ignore init errors outside Telegram */
    }

    isReady.value = true;
  });

  function haptic(type = 'light') {
    try {
      getWebApp()?.HapticFeedback?.impactOccurred(type);
    } catch {
      /* ignore */
    }
  }

  function showBackButton(callback) {
    try {
      const backButton = getWebApp()?.BackButton;
      if (!backButton || typeof backButton.show !== 'function') return false;
      backButton.show();
      if (typeof backButton.onClick === 'function') {
        backButton.onClick(callback);
      }
      return true;
    } catch {
      return false;
    }
  }

  function hideBackButton() {
    try {
      const backButton = getWebApp()?.BackButton;
      if (backButton && typeof backButton.hide === 'function') {
        backButton.hide();
      }
    } catch {
      /* ignore */
    }
  }

  return { tg, isReady, haptic, showBackButton, hideBackButton };
}
