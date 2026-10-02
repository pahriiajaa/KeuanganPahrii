/* ==========================================================
   auth.js
   Login dengan akun Google lewat Supabase Auth.
   ========================================================== */

App.auth = (() => {
  const { $ } = App.utils;

  const auth = () => App.db.client.auth;

  // ---------- Akses ke Supabase ----------

  /** Pengguna yang sedang login, atau null.
      Saat offline dan sesi tidak bisa diperiksa, pakai pengguna terakhir
      yang tersimpan di HP supaya aplikasi tetap bisa dibuka. */
  const getUser = async () => {
    try {
      const { data } = await auth().getSession();
      if (data.session) return data.session.user;
    } catch {
      /* gagal memeriksa sesi: lanjut ke cadangan di bawah */
    }
    if (!navigator.onLine) return App.storage.loadLastUser();
    return null;
  };

  /** Buka halaman login Google. Setelah berhasil, Google mengembalikan
      pengguna ke alamat website ini dalam keadaan sudah login. */
  const signInWithGoogle = async () => {
    const alamatWebsite = window.location.origin + window.location.pathname;
    const { error } = await auth().signInWithOAuth({
      provider: "google",
      options: { redirectTo: alamatWebsite },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await auth().signOut();
  };

  // ---------- Tampilan layar login ----------

  const showLogin = () => {
    $("login").hidden = false;
    document.body.classList.add("login-open");
    $("login-pesan").textContent = "";
  };

  const hideLogin = () => {
    $("login").hidden = true;
    document.body.classList.remove("login-open");
  };

  const setMessage = (teks) => {
    $("login-pesan").textContent = teks;
  };

  /** Pasang tombol.
      canLogout() mengembalikan teks alasan jika belum boleh keluar, atau "" jika boleh.
      onLogout() dipanggil setelah keluar akun. */
  const init = ({ canLogout, onLogout }) => {
    $("google-btn").addEventListener("click", async () => {
      setMessage("");
      $("google-btn").disabled = true;
      try {
        await signInWithGoogle(); // halaman akan pindah ke Google
      } catch (error) {
        console.error(error);
        setMessage(`Gagal membuka login Google: ${error.message || "coba lagi"}`);
        $("google-btn").disabled = false;
      }
    });

    $("logout").addEventListener("click", async () => {
      const alasan = canLogout();
      $("logout-note").textContent = alasan;
      $("logout-note").hidden = !alasan;
      if (alasan) return;

      await signOut();
      onLogout();
    });
  };

  return { init, getUser, showLogin, hideLogin, setMessage };
})();
