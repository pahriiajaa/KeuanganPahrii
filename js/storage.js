/* ==========================================================
   storage.js
   Dua tempat penyimpanan:
   1. Supabase  : data utama transaksi (tabel "transaksi")
   2. HP        : salinan data, antrean perubahan offline, dan tema

   Di aplikasi, satu transaksi berbentuk:
   { id, t: "in" | "out", n: catatan, a: nominal, d: "2026-10-02" }
   Di database, kolomnya: id, jenis, catatan, nominal, tanggal.
   ========================================================== */

App.storage = (() => {
  // ==========================================================
  // Penyimpanan di HP (localStorage)
  // ==========================================================

  const KEY_THEME = "keuangan.tema";
  const KEY_LAST_USER = "keuangan.pengguna";
  const keyCache = (uid) => `keuangan.salinan.${uid}`;
  const keyQueue = (uid) => `keuangan.antrean.${uid}`;

  const readJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* penyimpanan penuh atau diblokir: abaikan */
    }
  };

  const remove = (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* abaikan */
    }
  };

  // Tema
  const loadTheme = () => readJson(KEY_THEME, "auto");
  const saveTheme = (theme) => writeJson(KEY_THEME, theme);

  // Pengguna terakhir (supaya aplikasi bisa dibuka saat offline)
  const loadLastUser = () => readJson(KEY_LAST_USER, null);
  const saveLastUser = (user) => writeJson(KEY_LAST_USER, user);

  // Salinan transaksi (null = belum pernah disimpan)
  const loadCache = (uid) => readJson(keyCache(uid), null);
  const saveCache = (uid, list) => writeJson(keyCache(uid), list);

  // Antrean perubahan yang belum terkirim ke Supabase
  const loadQueue = (uid) => readJson(keyQueue(uid), []);
  const saveQueue = (uid, queue) => writeJson(keyQueue(uid), queue);

  /** Hapus semua data pengguna dari HP (dipanggil saat keluar akun) */
  const clearUserData = (uid) => {
    remove(keyCache(uid));
    remove(keyQueue(uid));
    remove(KEY_LAST_USER);
  };

  // ==========================================================
  // Supabase (tabel "transaksi")
  // ==========================================================

  const table = () => App.db.client.from("transaksi");

  /** Baris database -> bentuk di aplikasi */
  const fromRow = (row) => ({
    id: row.id,
    t: row.jenis === "masuk" ? "in" : "out",
    n: row.catatan || "",
    a: Number(row.nominal),
    d: row.tanggal,
  });

  /** Bentuk di aplikasi -> baris database */
  const toRow = (item) => ({
    jenis: item.t === "in" ? "masuk" : "keluar",
    catatan: item.n,
    nominal: item.a,
    tanggal: item.d,
  });

  const DUPLICATE_KEY = "23505"; // kode Postgres: id sudah ada

  /** Lempar error jika Supabase mengembalikan error */
  const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
  };

  const loadTransactions = async () => {
    const rows = unwrap(await table().select("*").order("tanggal", { ascending: false }));
    return rows.map(fromRow);
  };

  /** ID dibuat di HP, jadi kalau terkirim dua kali tidak akan jadi dobel */
  const addTransaction = async (item) => {
    const { error } = await table().insert({ id: item.id, ...toRow(item) });
    if (error && error.code !== DUPLICATE_KEY) throw error;
  };

  const updateTransaction = async (id, item) => {
    unwrap(await table().update(toRow(item)).eq("id", id));
  };

  const removeTransaction = async (id) => {
    unwrap(await table().delete().eq("id", id));
  };

  /** Hapus semua transaksi milik akun yang login (dibatasi aturan RLS) */
  const clearTransactions = async () => {
    unwrap(await table().delete().not("id", "is", null));
  };

  return {
    loadTheme,
    saveTheme,
    loadLastUser,
    saveLastUser,
    loadCache,
    saveCache,
    loadQueue,
    saveQueue,
    clearUserData,
    loadTransactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    clearTransactions,
  };
})();
