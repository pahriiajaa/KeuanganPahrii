/* ==========================================================
   pwa.js
   Mendaftarkan service worker (agar bisa offline) dan
   tombol "Pasang aplikasi".
   ========================================================== */

App.pwa = (() => {
  const { $ } = App.utils;

  let installPrompt = null;

  const registerServiceWorker = () => {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((error) => console.error(error));
    });
  };

  const initInstallButton = () => {
    // Chrome mengirim peristiwa ini kalau aplikasi bisa dipasang
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      $("install").hidden = false;
    });

    window.addEventListener("appinstalled", () => {
      installPrompt = null;
      $("install").hidden = true;
    });

    $("install").addEventListener("click", async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      $("install").hidden = true;
    });
  };

  const init = () => {
    registerServiceWorker();
    initInstallButton();
  };

  return { init };
})();