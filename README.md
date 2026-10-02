# Catatan Keuangan

Aplikasi pencatat keuangan pribadi. Tahap 1: tampilan (front end), data disimpan di browser.

## Susunan folder

```
keuangan-app/
├── index.html            Struktur halaman
├── css/
│   ├── variables.css     Warna, font, ukuran, tema terang/gelap
│   ├── base.css          Reset dan tata letak dasar
│   └── components.css    Tampilan tiap komponen
├── js/
│   ├── utils.js          Fungsi bantu (format rupiah, tanggal, dll)
│   ├── storage.js        Simpan/baca data (nanti diganti Supabase)
│   ├── store.js          Data transaksi dan operasinya
│   ├── render.js         Menggambar Beranda dan Laporan
│   ├── sheet.js          Form tambah/ubah/hapus transaksi
│   └── app.js            Titik awal: navigasi, tema, pengaturan
└── README.md
```

## Urutan script

Diatur di `index.html`. File di atas dipakai oleh file di bawahnya:
`utils` -> `storage` -> `store` -> `render` -> `sheet` -> `app`.

## Langkah berikutnya

Sambungkan ke Supabase: tambahkan `js/supabase.js` dan ganti isi `js/storage.js`
agar membaca/menulis ke database, bukan localStorage.