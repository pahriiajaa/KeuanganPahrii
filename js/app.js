/* ==========================================================
   app.js
   Titik awal aplikasi: login, navigasi, pemilih bulan, pengaturan.
   ========================================================== */

(() => {
  const { $ } = App.utils;

  const VIEWS = {
    home:    { title: "Catatan Keuangan" },
    laporan: { title: "Laporan" },
    set:     { title: "Pengaturan" },
  };

  // ---------- Navigasi antar halaman ----------

  const showView = (name) => {
    Object.keys(VIEWS).forEach((view) => {
      $(`v-${view}`).hidden = view !== name;
    });

    document.querySelectorAll(".nav button").forEach((button) => {
      if (button.dataset.v === name) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    $("judul").textContent = VIEWS[name].title;
    $("monthbox").hidden = name === "set";
    $("add").hidden = name === "set";
    window.scrollTo(0, 0);
  };

  const initNavigation = () => {
    document.querySelectorAll(".nav button").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.v));
    });
  };

  // ---------- Pemilih bulan ----------

  const initMonthPicker = () => {
    $("prev").addEventListener("click", () => {
      App.store.moveMonth(-1);
      App.render.all();
    });
    $("next").addEventListener("click", () => {
      App.store.moveMonth(1);
      App.render.all();
    });
  };

  // ---------- Tema ----------

  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");

    document.querySelectorAll("#tema button").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.th === theme);
    });
  };

  const initTheme = () => {
    applyTheme(App.storage.loadTheme());
    document.querySelectorAll("#tema button").forEach((button) => {
      button.addEventListener("click", () => {
        App.storage.saveTheme(button.dataset.th);
        applyTheme(button.dataset.th);
      });
    });
  };

  // ---------- Hapus semua data (konfirmasi ketuk dua kali) ----------

  const initReset = () => {
    const button = $("reset");
    const LABEL = "Hapus semua data";
    let timer;

    const cancelConfirm = () => {
      delete button.dataset.sure;
      button.textContent = LABEL;
    };

    button.addEventListener("click", () => {
      if (!button.dataset.sure) {
        button.dataset.sure = "1";
        button.textContent = "Ketuk lagi untuk menghapus semua";
        timer = setTimeout(cancelConfirm, 4000);
        return;
      }

      clearTimeout(timer);
      cancelConfirm();
      App.store.clear();
      App.render.all();
      App.sync.showIdleStatus();
      App.sync.run();
    });
  };

  // ---------- Masuk / keluar akun ----------

  /** Dipanggil setelah login (atau sudah login sebelumnya) */
  const enterApp = (user) => {
    App.storage.saveLastUser({ id: user.id, email: user.email });
    $("akun-email").textContent = user.email;

    App.store.useUser(user.id); // tampilkan dulu salinan data di HP
    App.render.all();
    App.sync.run();             // lalu sinkron dengan Supabase
  };

  /** Keluar hanya boleh jika tidak ada data yang tertinggal di HP */
  const canLogout = () => {
    if (!navigator.onLine) return "Perlu internet untuk keluar akun.";

    const menunggu = App.store.queueLength();
    if (menunggu) {
      return `Masih ada ${menunggu} perubahan yang belum terkirim. Tunggu sampai status "Tersinkron", lalu coba lagi.`;
    }
    return "";
  };

  const leaveApp = () => {
    App.store.forgetUser();
    App.render.all();
    showView("home");
    App.auth.showLogin();
  };

  // ---------- Mulai ----------

  const start = async () => {
    initNavigation();
    initMonthPicker();
    initTheme();
    initReset();
    App.sheet.init();
    App.pwa.init();
    App.sync.init();
    App.render.all();

    if (!App.db.configured) {
      App.auth.showLogin();
      App.auth.setMessage("Belum tersambung ke Supabase. Isi dulu file js/config.js.");
      return;
    }

    App.auth.init({ canLogout, onLogout: leaveApp });

    const user = await App.auth.getUser();
    if (user) {
      App.auth.hideLogin();
      enterApp(user);
    } else {
      App.auth.showLogin();
    }
  };

  start();
})();
