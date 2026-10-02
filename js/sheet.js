/* ==========================================================
   sheet.js
   Form tambah / ubah / hapus transaksi (lembar dari bawah).
   Perubahan langsung tersimpan di HP, lalu dikirim ke
   Supabase di latar belakang (lihat sync.js).
   ========================================================== */

App.sheet = (() => {
  const { $, toIso, monthKey } = App.utils;
  const { today, current } = App.store;

  let editId = null;   // id transaksi yang sedang diubah (null = transaksi baru)
  let type = "out";    // "out" = pengeluaran, "in" = pemasukan

  const jenisButtons = () => document.querySelectorAll("#jenis button");

  const setOpen = (terbuka) => document.body.classList.toggle("open", terbuka);

  const setType = (value) => {
    type = value;
    jenisButtons().forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.type === value);
    });
  };

  /** Tanggal awal untuk transaksi baru */
  const defaultDate = () =>
    App.store.isCurrentMonth()
      ? toIso(today)
      : `${monthKey(current.year, current.month)}-01`;

  /** Buka form. Beri id untuk mengubah, kosongkan untuk transaksi baru */
  const open = (id) => {
    editId = id || null;
    const item = editId ? App.store.find(editId) : null;

    $("sheet-judul").textContent = item ? "Ubah transaksi" : "Tambah transaksi";
    $("save").textContent = item ? "Simpan perubahan" : "Simpan transaksi";
    $("del").hidden = !item;

    setType(item ? item.t : "out");
    $("nominal").value = item ? item.a : "";
    $("catatan").value = item ? item.n : "";
    $("tanggal").value = item ? item.d : defaultDate();

    setOpen(true);
  };

  const close = () => setOpen(false);

  /** Setelah data berubah: gambar ulang lalu kirim ke Supabase */
  const finish = () => {
    close();
    App.render.all();
    App.sync.showIdleStatus();
    App.sync.run();
  };

  const handleSave = () => {
    const nominal = parseInt($("nominal").value, 10);
    if (!nominal || nominal <= 0) {
      $("nominal").focus();
      return;
    }

    const tanggal = $("tanggal").value || toIso(today);
    const catatan =
      $("catatan").value.trim() || (type === "in" ? "Pemasukan" : "Pengeluaran");
    const data = { t: type, n: catatan, a: nominal, d: tanggal };

    if (editId) App.store.update(editId, data);
    else App.store.add(data);

    App.store.goToDate(tanggal); // tampilkan bulan transaksi yang baru disimpan
    finish();
  };

  const handleDelete = () => {
    App.store.remove(editId);
    finish();
  };

  /** Pasang semua tombol */
  const init = () => {
    $("add").addEventListener("click", () => open());
    $("scrim").addEventListener("click", close);
    $("save").addEventListener("click", handleSave);
    $("del").addEventListener("click", handleDelete);

    jenisButtons().forEach((button) => {
      button.addEventListener("click", () => setType(button.dataset.type));
    });

    // Ketuk transaksi di daftar -> buka form ubah
    $("list").addEventListener("click", (event) => {
      const baris = event.target.closest(".tx");
      if (baris) open(baris.dataset.id);
    });
  };

  return { init, open, close };
})();
