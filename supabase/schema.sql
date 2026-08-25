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
-- 2. BARIS IKLAN (modul Meta Ads) — akumulatif
--
-- Satu baris tabel = satu baris export Meta. Tim mengunggah banyak CSV dari
-- waktu ke waktu dan datanya menumpuk, bukan saling menimpa.
--
-- `fingerprint` (campaign|adset|ad|tanggal) adalah primary key, sehingga
-- mengunggah ulang periode yang tumpang-tindih meng-UPDATE baris yang sama,
-- bukan menambah duplikat. Tanpa ini, spend akan terhitung dobel.
--
-- Kolom terekstrak dipakai untuk dedup dan query SQL nanti; `data` menyimpan
-- baris asli apa adanya karena kolom export Meta berbeda-beda antar akun.
-- -----------------------------------------------------------------------------
create table if not exists public.ads_rows (
    fingerprint text primary key,
    campaign    text,
    adset       text,
    ad          text,
    date        date,
    data        jsonb not null,
    source_file text,
    uploaded_at timestamptz not null default now()
);

create index if not exists ads_rows_date_idx     on public.ads_rows (date);
create index if not exists ads_rows_campaign_idx on public.ads_rows (campaign);
create index if not exists ads_rows_source_idx   on public.ads_rows (source_file);

-- Draf awal memakai satu baris jsonb raksasa (public.ads_datasets). Tabel itu
-- tidak lagi dipakai aplikasi. Kalau sudah terlanjur dibuat dan Anda yakin
-- isinya kosong, hapus manual:
--     drop table if exists public.ads_datasets;

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
alter table public.ads_rows enable row level security;
alter table public.app_config   enable row level security;

drop policy if exists "team full access" on public.pr_articles;
create policy "team full access" on public.pr_articles
    for all to authenticated using (true) with check (true);

drop policy if exists "team full access" on public.ads_rows;
create policy "team full access" on public.ads_rows
    for all to authenticated using (true) with check (true);

drop policy if exists "team full access" on public.app_config;
create policy "team full access" on public.app_config
    for all to authenticated using (true) with check (true);

-- Grant table level privileges to the signed in role explicitly. RLS decides
-- WHICH rows a session may touch, but Postgres still checks table privileges
-- first, and a table with policies but no GRANT rejects every query with
-- 42501 before any policy is evaluated. Relying on Supabase default privileges
-- is fragile, so state it here.
grant select, insert, update, delete on public.pr_articles  to authenticated;
grant select, insert, update, delete on public.ads_rows     to authenticated;
grant select, insert, update, delete on public.app_config   to authenticated;

-- Cabut hak anon secara eksplisit. RLS sudah menutup akses, ini lapisan kedua
-- supaya kesalahan policy di masa depan tidak langsung membuka data.
revoke all on public.pr_articles  from anon;
revoke all on public.ads_rows from anon;
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
        where pubname = 'supabase_realtime' and tablename = 'ads_rows'
    ) then
        alter publication supabase_realtime add table public.ads_rows;
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
--   and tablename in ('pr_articles','ads_rows','app_config');

-- -----------------------------------------------------------------------------
-- 7. OUTLET MONITORING (brief produksi konten per outlet)
--
-- Menggantikan file Action_Plan_SOP_Content_Production_<KOTA>.xlsx yang selama
-- ini diduplikasi manual per kota. Satu brief = satu rencana produksi untuk
-- satu outlet, berisi tugas berfase (action plan) dan checklist SOP.
--
-- `references` disimpan jsonb pada brief karena berupa daftar tautan yang
-- jarang diubah; tugas dan checklist berupa baris karena statusnya diperbarui
-- satu per satu dan rawan saling timpa bila disimpan sebagai satu blob.
-- -----------------------------------------------------------------------------
create table if not exists public.outlet_briefs (
    id          text primary key,
    city        text not null,
    outlet_name text not null,
    title       text not null,
    ref_memo    text,
    start_date  date,
    status      text not null default 'active',   -- active | done | archived
    refs        jsonb not null default '[]'::jsonb,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table if not exists public.brief_tasks (
    id         text primary key,
    brief_id   text not null references public.outlet_briefs(id) on delete cascade,
    phase      text not null,
    task       text not null,
    scope      text,
    pic        text,
    start_date date,
    end_date   date,
    deliverable text,
    quality    text,
    status     text not null default 'pending',   -- pending | in_progress | completed | blocked
    sort_order integer not null default 0,
    notes      text,
    updated_at timestamptz not null default now()
);

create table if not exists public.brief_checklist (
    id         text primary key,
    brief_id   text not null references public.outlet_briefs(id) on delete cascade,
    section    text not null,   -- technical | therapist | setup | sequence
    item       text not null,
    spec       text,
    mandatory  text,
    status     text not null default 'pending',   -- pending | pass | fail
    notes      text,
    sort_order integer not null default 0,
    updated_at timestamptz not null default now()
);

create index if not exists brief_tasks_brief_idx     on public.brief_tasks (brief_id, sort_order);
create index if not exists brief_checklist_brief_idx on public.brief_checklist (brief_id, sort_order);
create index if not exists outlet_briefs_city_idx    on public.outlet_briefs (city);

alter table public.outlet_briefs   enable row level security;
alter table public.brief_tasks     enable row level security;
alter table public.brief_checklist enable row level security;

drop policy if exists "team full access" on public.outlet_briefs;
create policy "team full access" on public.outlet_briefs
    for all to authenticated using (true) with check (true);

drop policy if exists "team full access" on public.brief_tasks;
create policy "team full access" on public.brief_tasks
    for all to authenticated using (true) with check (true);

drop policy if exists "team full access" on public.brief_checklist;
create policy "team full access" on public.brief_checklist
    for all to authenticated using (true) with check (true);

-- GRANT eksplisit. Pelajaran dari insiden 42501: policy tanpa GRANT menolak
-- semua kueri sebelum policy sempat dievaluasi.
grant select, insert, update, delete on public.outlet_briefs   to authenticated;
grant select, insert, update, delete on public.brief_tasks     to authenticated;
grant select, insert, update, delete on public.brief_checklist to authenticated;

revoke all on public.outlet_briefs   from anon;
revoke all on public.brief_tasks     from anon;
revoke all on public.brief_checklist from anon;

do $$
begin
    if not exists (select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'outlet_briefs') then
        alter publication supabase_realtime add table public.outlet_briefs;
    end if;
    if not exists (select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'brief_tasks') then
        alter publication supabase_realtime add table public.brief_tasks;
    end if;
    if not exists (select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'brief_checklist') then
        alter publication supabase_realtime add table public.brief_checklist;
    end if;
end $$;

drop trigger if exists outlet_briefs_touch on public.outlet_briefs;
create trigger outlet_briefs_touch before update on public.outlet_briefs
    for each row execute function public.touch_updated_at();

drop trigger if exists brief_tasks_touch on public.brief_tasks;
create trigger brief_tasks_touch before update on public.brief_tasks
    for each row execute function public.touch_updated_at();

drop trigger if exists brief_checklist_touch on public.brief_checklist;
create trigger brief_checklist_touch before update on public.brief_checklist
    for each row execute function public.touch_updated_at();
