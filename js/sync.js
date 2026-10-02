/* ==========================================================
   sync.js
   Menyinkronkan data HP <-> Supabase.

   1. Kirim semua perubahan di antrean (yang dibuat saat offline).
   2. Ambil data terbaru dari Supabase (termasuk dari perangkat lain).
   Dijalankan saat aplikasi dibuka, saat internet kembali, dan
   saat aplikasi dibuka kembali dari latar belakang.
   ========================================================== */

App.sync = (() => {
  let running = false;

  const setStatus = (teks, state) => App.render.setStatus(teks, state);

  /** Tampilkan status sesuai kondisi internet dan antrean */
  const showIdleStatus = () => {
    const menunggu = App.store.queueLength();
    if (!navigator.onLine) {
      setStatus(menunggu ? `Offline · ${menunggu} perubahan menunggu` : "Offline", "offline");
    } else if (menunggu) {
      setStatus(`${menunggu} perubahan menunggu dikirim`, "offline");
    } else {
      setStatus("Tersinkron", "ok");
    }
  };

  const isNetworkError = (error) =>
    !navigator.onLine ||
    error instanceof TypeError ||
    /fetch|network|load failed|timeout/i.test(error.message || "");

  /** Kirim satu entri antrean pertama ke Supabase */
  const processNext = async () => {
    const entry = App.store.peekQueue();

    if (entry.op === "add") {
      const item = App.store.find(entry.id);
      if (item) await App.storage.addTransaction(item);
    } else if (entry.op === "update") {
      const item = App.store.find(entry.id);
      if (item) await App.storage.updateTransaction(entry.id, item);
    } else if (entry.op === "remove") {
      await App.storage.removeTransaction(entry.id);
    } else if (entry.op === "clear") {
      await App.storage.clearTransactions();
    }

    App.store.shiftQueue();
  };

  const run = async () => {
    if (running || !App.store.hasUser()) return;

    if (!navigator.onLine) {
      showIdleStatus();
      App.store.markReady();
      App.render.all();
      return;
    }

    running = true;
    setStatus("Menyinkronkan...", "busy");

    try {
      // Pastikan masih login (sesi bisa habis kalau lama tidak online)
      const user = await App.auth.getUser();
      if (!user) {
        App.auth.showLogin();
        App.auth.setMessage("Sesi berakhir. Masuk lagi untuk melanjutkan sinkron.");
        return;
      }

      let selesai = false;
      while (!selesai) {
        while (App.store.queueLength()) await processNext();

        const list = await App.storage.loadTransactions();
        // Kalau selama menunggu ada perubahan baru, kirim dulu sebelum menimpa data
        if (App.store.queueLength() === 0) {
          App.store.setAll(list);
          selesai = true;
        }
      }
      setStatus("Tersinkron", "ok");
    } catch (error) {
      console.error(error);
      if (isNetworkError(error)) showIdleStatus();
      else setStatus(`Gagal sinkron: ${error.message}`, "error");
    } finally {
      running = false;
      App.store.markReady();
      App.render.all();
    }
  };

  /** Jalankan sinkron otomatis pada saat yang tepat */
  const init = () => {
    window.addEventListener("online", run);
    window.addEventListener("offline", () => {
      showIdleStatus();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") run();
    });
  };

  return { init, run, showIdleStatus };
})();