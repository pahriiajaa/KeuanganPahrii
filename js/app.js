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

    button.addEventListener("click", async () => {
      if (!button.dataset.sure) {
        button.dataset.sure = "1";
        button.textContent = "Ketuk lagi untuk menghapus semua";
        timer = setTimeout(cancelConfirm, 4000);
        return;
      }

      clearTimeout(timer);
      cancelConfirm();
      try {
        await App.store.clear();
        App.render.all();
      } catch {
        button.textContent = "Gagal menghapus. Coba lagi.";
        setTimeout(cancelConfirm, 3000);
      }
    });
  };

  // ---------- Masuk / keluar akun ----------

  /** Dipanggil setelah berhasil login (atau sudah login sebelumnya) */
  const enterApp = async (user) => {
    $("akun-email").textContent = user.email;
    $("list").innerHTML = '<div class="empty">Memuat data...</div>';

    try {
      await App.store.load();
      App.render.all();
    } catch {
      App.render.all();
      $("list").innerHTML =
        '<div class="empty">Gagal memuat data. Periksa koneksi internet lalu muat ulang halaman.</div>';
    }
  };

  const leaveApp = () => {
    App.store.reset();
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
    App.render.all();

    if (!App.db.configured) {
      $("login-form").addEventListener("submit", (event) => event.preventDefault());
      App.auth.showLogin();
      App.auth.setMessage("Belum tersambung ke Supabase. Isi dulu file js/config.js.");
      return;
    }

    App.auth.init({ onLogin: enterApp, onLogout: leaveApp });

    const user = await App.auth.getUser();
    if (user) enterApp(user);
    else App.auth.showLogin();
  };

  start();
})();