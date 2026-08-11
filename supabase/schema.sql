-- =============================================================================
-- OIC Digital App — Supabase schema
--
-- Jalankan seluruh isi file ini di Supabase Dashboard -> SQL Editor -> New query
-- -> Run. Aman dijalankan ulang (idempotent).
--
-- PENTING sebelum menjalankan:
--   1. Authentication -> Providers -> Email: AKTIFKAN, lalu MATIKAN "Enable
--      signups". Tanpa itu siapa pun bisa mendaftar sendiri dan lolos RLS.
--   2. Authentication -> Users -> Add user: email team@oic-digital.app dengan
--      password = PIN 6 digit tim. Centang "Auto Confirm User".
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. NEWS DIRECTORY (modul PR & Exposure)
-- Kolom datar untuk semua field yang difilter/diurutkan; `site` disimpan jsonb
-- karena isinya snapshot hasil estimasi yang tidak pernah di-query per-field.
-- -----------------------------------------------------------------------------
create table if not exists public.pr_articles (
    id           text primary key,
    url          text not null unique,
    domain       text,
    title        text,
    outlet       text,
    date         date,
    brand        text,
    placement    text,
    sentiment    text,
    pr_cost      numeric  not null default 0,
    actual_views numeric  not null default 0,
    notes        text,
    site         jsonb,
    est_views    numeric,
    emv          numeric,
    views_basis  text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index if not exists pr_articles_date_idx  on public.pr_articles (date desc);
create index if not exists pr_articles_brand_idx on public.pr_articles (brand);

-- -----------------------------------------------------------------------------
-- 2. DATASET IKLAN (modul Meta Ads)
-- Satu baris ('current') berisi export yang sedang dipakai tim. Disimpan utuh
-- sebagai jsonb: aplikasi memuat semuanya lalu memfilter di browser, jadi tidak
-- ada keuntungan memecahnya per baris. Postgres tidak punya batas 1 MiB seperti
-- Firestore, sehingga chunking tidak lagi diperlukan.
-- -----------------------------------------------------------------------------
create table if not exists public.ads_datasets (
    id         text primary key,
    filename   text,
    row_count  integer not null default 0,
    rows       jsonb   not null default '[]'::jsonb,
    saved_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. KONFIGURASI BERSAMA (CPM, article share, webhook URL)
-- -----------------------------------------------------------------------------
create table if not exists public.app_config (
    key        text primary key,
    value      jsonb not null,
    updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- Tanpa ini, anon key yang tertanam di aplikasi (dan terlihat oleh siapa pun)
-- bisa membaca serta menulis seluruh isi tabel. RLS adalah satu-satunya
-- pengaman sebenarnya untuk aplikasi client-side.
--
-- Kebijakan: hanya sesi yang sudah login (role `authenticated`) yang boleh
-- mengakses. Karena signup dimatikan, satu-satunya akun yang bisa ada adalah
-- yang dibuat manual di dashboard.
-- -----------------------------------------------------------------------------
alter table public.pr_articles  enable row level security;
alter table public.ads_datasets enable row level security;
alter table public.app_config   enable row level security;

drop policy if exists "team full access" on public.pr_articles;
create policy "team full access" on public.pr_articles
    for all to authenticated using (true) with check (true);

drop policy if exists "team full access" on public.ads_datasets;
create policy "team full access" on public.ads_datasets
    for all to authenticated using (true) with check (true);

drop policy if exists "team full access" on public.app_config;
create policy "team full access" on public.app_config
    for all to authenticated using (true) with check (true);

-- Cabut hak anon secara eksplisit. RLS sudah menutup akses, ini lapisan kedua
-- supaya kesalahan policy di masa depan tidak langsung membuka data.
revoke all on public.pr_articles  from anon;
revoke all on public.ads_datasets from anon;
revoke all on public.app_config   from anon;

-- -----------------------------------------------------------------------------
-- 5. REALTIME
-- Supabase hanya menyiarkan perubahan untuk tabel yang masuk publication ini.
-- Tanpa langkah ini, perubahan rekan tim tidak muncul otomatis di layar.
-- -----------------------------------------------------------------------------
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'pr_articles'
    ) then
        alter publication supabase_realtime add table public.pr_articles;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'ads_datasets'
    ) then
        alter publication supabase_realtime add table public.ads_datasets;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'app_config'
    ) then
        alter publication supabase_realtime add table public.app_config;
    end if;
end $$;

-- -----------------------------------------------------------------------------
-- 6. updated_at otomatis
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end $$;

drop trigger if exists pr_articles_touch on public.pr_articles;
create trigger pr_articles_touch before update on public.pr_articles
    for each row execute function public.touch_updated_at();

drop trigger if exists app_config_touch on public.app_config;
create trigger app_config_touch before update on public.app_config
    for each row execute function public.touch_updated_at();

-- =============================================================================
-- Verifikasi cepat (opsional): harus mengembalikan 3 baris, semua rls_enabled=t
-- =============================================================================
-- select tablename, rowsecurity as rls_enabled
-- from pg_tables where schemaname = 'public'
--   and tablename in ('pr_articles','ads_datasets','app_config');
