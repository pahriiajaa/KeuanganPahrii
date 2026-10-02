/* ==========================================================
   store.js
   Salinan data transaksi di memori + operasinya.
   Setiap perubahan dikirim dulu ke Supabase lewat storage.js;
   kalau berhasil, baru salinan di memori ikut diubah.
   ========================================================== */

App.store = (() => {
  const today = new Date();

  /** Bulan yang sedang ditampilkan */
  const current = { year: today.getFullYear(), month: today.getMonth() };

  let transactions = [];

  // ---------- Memuat / mengosongkan ----------

  const load = async () => {
    transactions = await App.storage.loadTransactions();
  };

  /** Dipanggil saat keluar akun, supaya data tidak tersisa di layar */
  const reset = () => {
    transactions = [];
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

  // ---------- Mengubah data (async, karena menunggu database) ----------

  const add = async (data) => {
    const saved = await App.storage.addTransaction(data);
    transactions.push(saved);
  };

  const update = async (id, data) => {
    await App.storage.updateTransaction(id, data);
    const item = find(id);
    if (item) Object.assign(item, data);
  };

  const remove = async (id) => {
    await App.storage.removeTransaction(id);
    transactions = transactions.filter((item) => item.id !== id);
  };

  const clear = async () => {
    await App.storage.clearTransactions();
    transactions = [];
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
    load,
    reset,
    inMonth,
    totals,
    find,
    add,
    update,
    remove,
    clear,
    moveMonth,
    goToDate,
    isCurrentMonth,
  };
})();