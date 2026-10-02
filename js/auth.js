/* ==========================================================
   auth.js
   Login dengan akun Google lewat Supabase Auth.
   ========================================================== */

App.auth = (() => {
  const { $ } = App.utils;

  const auth = () => App.db.client.auth;

  // ---------- Akses ke Supabase ----------

  /** Pengguna yang sedang login, atau null */
  const getUser = async () => {
    const { data } = await auth().getSession();
    return data.session ? data.session.user : null;
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

  /** Pasang tombol. onLogout() dipanggil setelah keluar akun */
  const init = ({ onLogout }) => {
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
      await signOut();
      onLogout();
    });
  };

  return { init, getUser, showLogin, hideLogin, setMessage };
})();
