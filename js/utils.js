/* ==========================================================
   utils.js
   Fungsi bantu umum (tidak bergantung pada file lain)
   ========================================================== */

window.App = window.App || {};

App.utils = (() => {
  /** Ambil elemen berdasarkan id */
  const $ = (id) => document.getElementById(id);

  /** 5 -> "05" */
  const pad = (angka) => String(angka).padStart(2, "0");

  /** 4500000 -> "Rp4.500.000" */
  const rupiah = (angka) => "Rp" + Number(angka).toLocaleString("id-ID");

  /** Cegah teks pengguna dibaca sebagai kode HTML */
  const escapeHtml = (teks) =>
    String(teks).replace(/[&<>"']/g, (huruf) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[huruf]));

  /** Date -> "2026-10-02" */
  const toIso = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  /** (2026, 9) -> "2026-10". Bulan dimulai dari 0 dan boleh melewati 0-11 */
  const monthKey = (year, month) => {
    const date = new Date(year, month, 1);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  };

  /** "2026-10-02" -> "2 Okt" */
  const formatDate = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

  /** (2026, 9) -> "Oktober 2026" */
  const formatMonth = (year, month) =>
    new Date(year, month, 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

  /** (2026, 9) -> "Okt" */
  const formatMonthShort = (year, month) =>
    new Date(year, month, 1).toLocaleDateString("id-ID", { month: "short" });

  return {
    $,
    pad,
    rupiah,
    escapeHtml,
    toIso,
    monthKey,
    formatDate,
    formatMonth,
    formatMonthShort,
  };
})();