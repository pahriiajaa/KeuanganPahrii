/* ==========================================================
   sheet.js
   Form tambah / ubah / hapus transaksi (lembar dari bawah).
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

  const saveLabel = () => (editId ? "Simpan perubahan" : "Simpan transaksi");

  const setError = (teks) => {
    $("sheet-error").textContent = teks;
    $("sheet-error").hidden = !teks;
  };

  /** Nonaktifkan tombol selama menunggu database */
  const setBusy = (sibuk) => {
    $("save").disabled = sibuk;
    $("del").disabled = sibuk;
    $("save").textContent = sibuk ? "Menyimpan..." : saveLabel();
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
    $("save").textContent = saveLabel();
    $("del").hidden = !item;
    setError("");

    setType(item ? item.t : "out");
    $("nominal").value = item ? item.a : "";
    $("catatan").value = item ? item.n : "";
    $("tanggal").value = item ? item.d : defaultDate();

    setOpen(true);
  };

  const close = () => setOpen(false);

  const handleSave = async () => {
    const nominal = parseInt($("nominal").value, 10);
    if (!nominal || nominal <= 0) {
      $("nominal").focus();
      return;
    }

    const tanggal = $("tanggal").value || toIso(today);
    const catatan =
      $("catatan").value.trim() || (type === "in" ? "Pemasukan" : "Pengeluaran");
    const data = { t: type, n: catatan, a: nominal, d: tanggal };

    setError("");
    setBusy(true);
    try {
      if (editId) await App.store.update(editId, data);
      else await App.store.add(data);

      App.store.goToDate(tanggal); // tampilkan bulan transaksi yang baru disimpan
      close();
      App.render.all();
    } catch {
      setError("Gagal menyimpan. Periksa koneksi internet lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    setBusy(true);
    try {
      await App.store.remove(editId);
      close();
      App.render.all();
    } catch {
      setError("Gagal menghapus. Periksa koneksi internet lalu coba lagi.");
    } finally {
      setBusy(false);
    }
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