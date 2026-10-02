/* ==========================================================
   supabase.js
   Membuat koneksi ke Supabase (App.db.client).
   ========================================================== */

App.db = (() => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = App.config;

  const sudahDiisi =
    !SUPABASE_URL.startsWith("ISI_") && !SUPABASE_ANON_KEY.startsWith("ISI_");

  // window.supabase berasal dari script CDN di index.html
  const configured = sudahDiisi && Boolean(window.supabase);

  const client = configured
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  return { client, configured };
})();