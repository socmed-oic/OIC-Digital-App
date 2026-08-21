-- =============================================================================
-- PERBAIKAN CEPAT: hak akses peran authenticated
--
-- Jalankan di Supabase Dashboard -> SQL Editor bila data yang dimasukkan lewat
-- aplikasi tidak tersimpan. Aman dijalankan berulang.
--
-- Latar belakang: RLS menentukan BARIS mana yang boleh disentuh, tetapi
-- Postgres memeriksa hak akses tingkat tabel lebih dulu. Tabel yang punya
-- policy tetapi tanpa GRANT akan menolak semua kueri dengan kode 42501
-- sebelum policy sempat dievaluasi.
-- =============================================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.pr_articles  to authenticated;
grant select, insert, update, delete on public.ads_rows     to authenticated;
grant select, insert, update, delete on public.app_config   to authenticated;

-- Verifikasi. Harus mengembalikan 12 baris, empat hak untuk tiga tabel.
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'authenticated'
  and table_schema = 'public'
  and table_name in ('pr_articles', 'ads_rows', 'app_config')
order by table_name, privilege_type;
