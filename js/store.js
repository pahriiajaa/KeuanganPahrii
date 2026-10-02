/* ==========================================================
   store.js
   Data transaksi di memori + antrean perubahan.

   Cara kerja offline:
   - Setiap perubahan langsung dilakukan di HP dan dicatat di
     "antrean" (queue).
   - js/sync.js yang mengirim antrean itu ke Supabase saat ada internet.

   Bentuk satu entri antrean:
   { op: "add" | "update" | "remove" | "clear", id: "..." }
   (isi transaksi diambil dari data terbaru saat dikirim)
   ========================================================== */

App.store = (() => {
  const { uuid } = App.utils;

  const today = new Date();

  /** Bulan yang sedang ditampilkan */
  const current = { year: today.getFullYear(), month: today.getMonth() };

  let userId = null;
  let transactions = [];
  let queue = [];
  let ready = false; // true jika data sudah ada (dari salinan HP atau Supabase)

  /** Simpan salinan data dan antrean ke HP */
  const persist = () => {
    if (!userId) return;
    App.storage.saveCache(userId, transactions);
    App.storage.saveQueue(userId, queue);
  };

  // ---------- Pengguna ----------

  const hasUser = () => userId !== null;

  /** Muat salinan data milik pengguna dari HP */
  const useUser = (id) => {
    userId = id;
    const cache = App.storage.loadCache(id);
    transactions = cache || [];
    queue = App.storage.loadQueue(id);
    ready = cache !== null;
  };

  /** Dipanggil saat keluar akun: hapus semua data dari HP dan memori */
  const forgetUser = () => {
    if (userId) App.storage.clearUserData(userId);
    userId = null;
    transactions = [];
    queue = [];
    ready = false;
  };

  const isReady = () => ready;
  const markReady = () => {
    ready = true;
  };

  // ---------- Membaca data ----------

  /** Transaksi dalam satu bulan, terbaru di atas */
  const inMonth = (key) =>
    transactions
      .filter((item) => item.d.slice(0, 7) === key)
      .sort((a, b) => {
        if (a.d !== b.d) return a.d < b.d ? 1 : -1;
        return a.id < b.id ? 1 : -1;
      });

  /** Total pemasukan (i) dan pengeluaran (o) dalam satu bulan */
  const totals = (key) => {
    const hasil = { i: 0, o: 0 };
    transactions.forEach((item) => {
      if (item.d.slice(0, 7) !== key) return;
      if (item.t === "in") hasil.i += item.a;
      else hasil.o += item.a;
    });
    return hasil;
  };

  const find = (id) => transactions.find((item) => item.id === id) || null;

  // ---------- Mengubah data (langsung, tanpa menunggu internet) ----------

  const hasPendingWrite = (id) =>
    queue.some((entry) => entry.id === id && (entry.op === "add" || entry.op === "update"));

  const add = ({ t, n, a, d }) => {
    const id = uuid();
    transactions.push({ id, t, n, a, d });
    queue.push({ op: "add", id });
    persist();
  };

  const update = (id, { t, n, a, d }) => {
    const item = find(id);
    if (!item) return;
    Object.assign(item, { t, n, a, d });
    // Kalau sudah ada antrean tambah/ubah untuk id ini, datanya otomatis ikut terbaru
    if (!hasPendingWrite(id)) queue.push({ op: "update", id });
    persist();
  };

  const remove = (id) => {
    transactions = transactions.filter((item) => item.id !== id);
    const belumTerkirim = queue.some((entry) => entry.op === "add" && entry.id === id);
    queue = queue.filter((entry) => entry.id !== id);
    // Transaksi yang belum pernah terkirim cukup dibuang, tidak perlu dihapus di database
    if (!belumTerkirim) queue.push({ op: "remove", id });
    persist();
  };

  const clear = () => {
    transactions = [];
    queue = [{ op: "clear" }];
    persist();
  };

  // ---------- Dipakai oleh sync.js ----------

  const queueLength = () => queue.length;
  const peekQueue = () => queue[0];

  const shiftQueue = () => {
    queue.shift();
    persist();
  };

  /** Ganti seluruh data dengan data terbaru dari Supabase */
  const setAll = (list) => {
    transactions = list;
    ready = true;
    persist();
  };

  // ---------- Bulan yang ditampilkan ----------

  const moveMonth = (selisih) => {
    const date = new Date(current.year, current.month + selisih, 1);
    current.year = date.getFullYear();
    current.month = date.getMonth();
  };

  /** Pindah ke bulan dari tanggal "2026-10-02" */
  const goToDate = (iso) => {
    current.year = parseInt(iso.slice(0, 4), 10);
    current.month = parseInt(iso.slice(5, 7), 10) - 1;
  };

  const isCurrentMonth = () =>
    current.year === today.getFullYear() && current.month === today.getMonth();

  return {
    today,
    current,
    hasUser,
    useUser,
    forgetUser,
    isReady,
    markReady,
    inMonth,
    totals,
    find,
    add,
    update,
    remove,
    clear,
    queueLength,
    peekQueue,
    shiftQueue,
    setAll,
    moveMonth,
    goToDate,
    isCurrentMonth,
  };
})();
