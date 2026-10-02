/* ==========================================================
   auth.js
   Login, daftar, dan keluar memakai Supabase Auth.
   ========================================================== */

App.auth = (() => {
  const { $ } = App.utils;

  const auth = () => App.db.client.auth;

  // ---------- Pesan kesalahan dalam bahasa Indonesia ----------

  const translateError = (pesan = "") => {
    if (pesan.includes("Invalid login credentials")) return "Email atau kata sandi salah.";
    if (pesan.includes("Email not confirmed")) return "Email belum dikonfirmasi. Cek kotak masuk emailmu.";
    if (pesan.includes("already registered")) return "Email ini sudah terdaftar. Silakan masuk.";
    if (pesan.includes("at least 6")) return "Kata sandi minimal 6 karakter.";
    if (pesan.includes("valid email") || pesan.includes("invalid format")) return "Format email tidak benar.";
    if (pesan.includes("rate limit")) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
    return "Terjadi kesalahan. Periksa koneksi internet lalu coba lagi.";
  };

  // ---------- Akses ke Supabase ----------

  /** Pengguna yang sedang login, atau null */
  const getUser = async () => {
    const { data } = await auth().getSession();
    return data.session ? data.session.user : null;
  };

  const signIn = async (email, password) => {
    const { data, error } = await auth().signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  };

  const signUp = async (email, password) => {
    const { data, error } = await auth().signUp({ email, password });
    if (error) throw error;
    // data.session kosong jika Supabase meminta konfirmasi email dulu
    return data.session ? data.user : null;
  };

  const signOut = async () => {
    await auth().signOut();
  };

  // ---------- Tampilan layar login ----------

  const showLogin = () => {
    $("login").hidden = false;
    document.body.classList.add("login-open");
    $("login-pesan").textContent = "";
    $("password").value = "";
  };

  const hideLogin = () => {
    $("login").hidden = true;
    document.body.classList.remove("login-open");
  };

  const setMessage = (teks) => {
    $("login-pesan").textContent = teks;
  };

  const setBusy = (sibuk) => {
    $("masuk-btn").disabled = sibuk;
    $("daftar-btn").disabled = sibuk;
  };

  /** Jalankan aksi login/daftar sambil menampilkan status */
  const run = async (aksi, onLogin) => {
    setMessage("");
    setBusy(true);
    try {
      const user = await aksi($("email").value.trim(), $("password").value);
      if (user) {
        hideLogin();
        onLogin(user);
      } else {
        setMessage("Akun dibuat. Cek emailmu untuk konfirmasi, lalu masuk.");
      }
    } catch (error) {
      setMessage(translateError(error.message));
    } finally {
      setBusy(false);
    }
  };

  /** Pasang tombol. onLogin(user) dipanggil setelah berhasil masuk */
  const init = ({ onLogin, onLogout }) => {
    $("login-form").addEventListener("submit", (event) => {
      event.preventDefault();
      run(signIn, onLogin);
    });

    $("daftar-btn").addEventListener("click", () => run(signUp, onLogin));

    $("logout").addEventListener("click", async () => {
      await signOut();
      onLogout();
    });
  };

  return { init, getUser, showLogin, hideLogin, setMessage };
})();
