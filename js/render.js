/* ==========================================================
   render.js
   Menggambar isi halaman (Beranda dan Laporan) dari data.
   ========================================================== */

App.render = (() => {
  const { $, rupiah, escapeHtml, formatDate, formatMonth, formatMonthShort, monthKey } = App.utils;
  const { current, today } = App.store;

  /** Teks bulan di bagian atas */
  const renderMonthLabel = () => {
    $("bulan").textContent = formatMonth(current.year, current.month);
  };

  /** Kartu saldo di Beranda */
  const renderSummary = (key) => {
    const { i, o } = App.store.totals(key);
    $("saldo").textContent = rupiah(i - o);
    $("masuk").textContent = rupiah(i);
    $("keluar").textContent = rupiah(o);
  };

  /** Satu baris transaksi */
  const transactionHtml = (item) => {
    const masuk = item.t === "in";
    return `
      <button class="tx" type="button" data-id="${escapeHtml(item.id)}">
        <div class="ico">${masuk ? "💰" : "🧾"}</div>
        <div class="tx-main">
          <b>${escapeHtml(item.n)}</b>
          <small>${masuk ? "Pemasukan" : "Pengeluaran"}, ${formatDate(item.d)}</small>
        </div>
        <div class="amt ${item.t}">${masuk ? "+" : "-"}${rupiah(item.a)}</div>
      </button>`;
  };

  /** Daftar transaksi di Beranda */
  const renderList = (items) => {
    if (!App.store.isReady()) {
      $("list").innerHTML = '<div class="empty">Memuat data...</div>';
      return;
    }
    $("list").innerHTML = items.length
      ? items.map(transactionHtml).join("")
      : '<div class="empty">Belum ada transaksi bulan ini. Ketuk + untuk menambah.</div>';
  };

  /** Grafik batang 6 bulan terakhir */
  const renderChart = () => {
    const bulanBulan = [];
    let nilaiTertinggi = 1;

    for (let offset = -5; offset <= 0; offset++) {
      const date = new Date(current.year, current.month + offset, 1);
      const total = App.store.totals(monthKey(date.getFullYear(), date.getMonth()));
      nilaiTertinggi = Math.max(nilaiTertinggi, total.i, total.o);
      bulanBulan.push({
        label: formatMonthShort(date.getFullYear(), date.getMonth()),
        total,
        sekarang: offset === 0,
      });
    }

    $("chart").innerHTML = bulanBulan
      .map(({ label, total, sekarang }) => `
        <div class="col${sekarang ? " now" : ""}">
          <div class="pair">
            <i class="bar-in"  style="height:${(total.i / nilaiTertinggi) * 100}%"></i>
            <i class="bar-out" style="height:${(total.o / nilaiTertinggi) * 100}%"></i>
          </div>
          <small>${label}</small>
        </div>`)
      .join("");
  };

  /** Ringkasan angka di halaman Laporan */
  const renderStats = (items, total) => {
    const pengeluaran = items.filter((item) => item.t === "out");
    const terbesar = pengeluaran.reduce(
      (maks, item) => (!maks || item.a > maks.a ? item : maks),
      null
    );
    const jumlahHari = App.store.isCurrentMonth()
      ? today.getDate()
      : new Date(current.year, current.month + 1, 0).getDate();

    const baris = (label, nilai) =>
      `<div class="row"><span>${label}</span><span>${nilai}</span></div>`;

    $("stats").innerHTML =
      baris("Jumlah transaksi", items.length) +
      baris("Selisih (masuk - keluar)", rupiah(total.i - total.o)) +
      baris("Rata-rata pengeluaran per hari", rupiah(Math.round(total.o / jumlahHari))) +
      baris(
        "Pengeluaran terbesar",
        terbesar ? `${escapeHtml(terbesar.n)}<br>${rupiah(terbesar.a)}` : "-"
      );
  };

  /** Gambar ulang semua bagian */
  const all = () => {
    const key = monthKey(current.year, current.month);
    const items = App.store.inMonth(key);
    const total = App.store.totals(key);

    renderMonthLabel();
    renderSummary(key);
    renderList(items);
    renderChart();
    renderStats(items, total);
  };

  /** Tulisan status sinkron di bawah judul. state: ok | busy | offline | error */
  const setStatus = (teks, state) => {
    $("status").textContent = teks;
    $("status").dataset.state = state;
  };

  return { all, setStatus };
})();
