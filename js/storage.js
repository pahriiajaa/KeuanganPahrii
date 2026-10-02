/* ==========================================================
   storage.js
   Transaksi: disimpan di Supabase (tabel "transaksi").
   Tema: disimpan di HP (localStorage).

   Di aplikasi, satu transaksi berbentuk:
   { id, t: "in" | "out", n: catatan, a: nominal, d: "2026-10-02" }
   Di database, kolomnya: id, jenis, catatan, nominal, tanggal.
   ========================================================== */

App.storage = (() => {
  const KEY_THEME = "keuangan.tema";

  // ---------- Tema (localStorage) ----------

  const loadTheme = () => {
    try {
      return localStorage.getItem(KEY_THEME) || "auto";
    } catch {
      return "auto";
    }
  };

  const saveTheme = (theme) => {
    try {
      localStorage.setItem(KEY_THEME, theme);
    } catch {
      /* abaikan */
    }
  };

  // ---------- Transaksi (Supabase) ----------

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

  /** Lempar error jika Supabase mengembalikan error */
  const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
  };

  const loadTransactions = async () => {
    const rows = unwrap(await table().select("*").order("tanggal", { ascending: false }));
    return rows.map(fromRow);
  };

  const addTransaction = async (item) => {
    const row = unwrap(await table().insert(toRow(item)).select().single());
    return fromRow(row);
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
    loadTransactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    clearTransactions,
  };
})();