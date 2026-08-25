-- =============================================================================
-- SEED SATU KALI: brief Bandung dan Surabaya, Agustus 2026
-- Dihasilkan dari Action_Plan_SOP_Content_Production_<KOTA>.xlsx, termasuk
-- status terkini per baris. Jalankan SETELAH schema.sql. Aman diulang
-- (on conflict do nothing), dan perbaikan salin-tempel sudah diterapkan:
-- header Surabaya di file lama masih bertuliskan "Outlet Bandung".
-- =============================================================================

insert into public.outlet_briefs (id, city, outlet_name, title, ref_memo, start_date, status, refs) values (
  'brief-bandung-aug2026', 'Bandung', 'Spa Cabin Bandung',
  'Content Production Bandung Agustus 2026',
  'Internal Memo No. 179/Int/Memo/OIC/CDM/VII/2026', '2026-08-07', 'active',
  '[{"source":"ASTON TROPICANA","category":"AMBIENCE","url":"https://www.instagram.com/reel/DaFrtThz3Ms/?igsh=MW0wbXlnZnQya2I5MA==","note":"tanpa teks"},{"source":"ASTON TROPICANA","category":"AMBIENCE","url":"https://www.instagram.com/reel/DZWpyqxPEvF/?igsh=OTJxbXZ4bDFoZDQ2","note":""},{"source":"ASTON TROPICANA","category":"TREATMENT","url":"https://www.instagram.com/reel/DYPCwy2iaaw/?igsh=MTdxc2xhY3c2NDM4cg==","note":""},{"source":"ASTON TROPICANA","category":"TREATMENT","url":"https://www.instagram.com/reel/DYMUlpWKogP/?igsh=MWZ4OWJyMnBnbGVmbQ==","note":""},{"source":"ASTON TROPICANA","category":"ENTERTAINMENT","url":"https://www.instagram.com/reel/DbW-1PtPwH9/?igsh=MnkwODJzcXNnOWx2","note":""},{"source":"ASTON TROPICANA","category":"ENTERTAINMENT","url":"https://www.instagram.com/reel/DY_m19cxCbp/?igsh=bWxwcWVrbzVheHRh","note":""},{"source":"ASTON TROPICANA","category":"ENTERTAINMENT","url":"https://www.instagram.com/reel/DUm3VgEidPM/?igsh=bjdqZ2phMXRpMHc0","note":""},{"source":"ANNATHAYA","category":"AMBIENCE","url":"https://www.instagram.com/reel/DU4qy47E99w/?igsh=MXBjZzBuZTlydmFiaw==","note":"gausah pake teks"},{"source":"ANNATHAYA","category":"AMBIENCE","url":"https://www.instagram.com/reel/DMJjdI7ykeu/?igsh=Z3o4ZnNhd2hwaTR6","note":""},{"source":"ANNATHAYA","category":"TREATMENT","url":"https://www.instagram.com/reel/DaMtsrYlckl/?igsh=MTZwOGFtM2oxOXZxdA==","note":""},{"source":"ANNATHAYA","category":"TREATMENT","url":"https://www.instagram.com/reel/DW3rQX4jrRJ/?igsh=YnZuYXd2MWp5MXJr","note":""},{"source":"ANNATHAYA","category":"ENTERTAINMENT","url":"https://www.instagram.com/reel/DU2nOobE_Lt/?igsh=MWNuMGhmdDI2NjNjZQ==","note":""},{"source":"ANNATHAYA","category":"ENTERTAINMENT","url":"https://www.instagram.com/reel/DZZyk5uIzNF/?igsh=MW1rNHhlc3Vqb3kybA==","note":""},{"source":"ANNATHAYA","category":"ENTERTAINMENT","url":"https://vt.tiktok.com/ZS4tERwa8/","note":""}]'::jsonb
) on conflict (id) do nothing;

insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t1', 'brief-bandung-aug2026', '1. Persiapan & Briefing', 'Filter outlet Spa Cabin & buat content brief promo', 'BDG', 'Tim CDM',
  '2026-08-07', '2026-08-08', 'Content Brief Approved', 'Sesuai standar visual brand & ketersediaan fasilitas cabin', 'completed', 1
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t2', 'brief-bandung-aug2026', '1. Persiapan & Briefing', 'Briefing, SOP teknis & siapkan folder GDrive', 'BDG', 'CDM',
  '2026-08-09', '2026-08-09', 'Folder Drive & Brief Ready', 'Seluruh PIC Outlet paham SOP & kualifikasi video', 'completed', 2
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t3', 'brief-bandung-aug2026', '2. Production (Take Content)', 'Cek kesiapan outlet, set-up cabin, & briefing therapist, berikan referensi video', 'BDG', 'PIC Outlet',
  '2026-08-10', '2026-08-10', 'Cabin Clean & Rapi', 'Therapist: Cepol rapi, NO accessories, seragam bersih', 'completed', 3
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t4', 'brief-bandung-aug2026', '2. Production (Take Content)', 'Take Footage Day 1: Exterior, Reception, Waiting, Welcome Drink, Cabin Ambience, Tray,', 'BDG', 'Videographer / PIC',
  '2026-08-10', '2026-08-10', 'Raw Footage Part 1', '4K/1080p 60fps, Cinematic Mode, 3-5 variasi/scene', 'in_progress', 4
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t5', 'brief-bandung-aug2026', '2. Production (Take Content)', 'Take Footage Day 2: Treatment & Aftercare, take tiktok trend', 'BDG', 'Videographer / PIC',
  '2026-08-11', '2026-08-11', 'Raw Footage Part 2', 'Lighting warm/cozy, gerakan smooth, no blur/crack', 'pending', 5
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t6', 'brief-bandung-aug2026', '3. Post-Production', 'Upload seluruh raw footage & video yang sudah edit ke Google Drive', 'Online / Drive', 'PIC Outlet BDG',
  '2026-08-12', '2026-08-12', 'Raw Files in Drive', 'Folder terstruktur rapi per outlet & jenis promo', 'pending', 6
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t7', 'brief-bandung-aug2026', '3. Post-Production', 'Editing video Cinematic Spa Cabin & TikTok creative draft 1 + Deadline Penyerahan Video Draft Pertama', 'HQ / Editor - Drive', 'PIC Outlet / Video Editor',
  '2026-08-12', '2026-08-13', 'Video Draft Cut 1', 'Pacing pas, audio clear, color grading warm & relaxing', 'pending', 7
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t8', 'brief-bandung-aug2026', '4. Review & Revisi', 'Proses Kurasi & Sortir konten dari seluruh outlet', 'CDM', 'CDM',
  '2026-08-14', '2026-08-14', 'Draft Submission Complete', 'Maksimal H+3 setelah shooting selesai (Tepat Waktu)', 'pending', 8
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t9', 'brief-bandung-aug2026', '4. Review & Revisi', 'Proses Perbaikan & Revisi Video (Final Adjustment)', 'HQ CDM Team', 'PIC / CDM',
  '2026-08-15', '2026-08-15', 'Hasil Kurasi & Catatan', 'Menjaga estetika visual & reputasi brand luxury', 'pending', 9
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t10', 'brief-bandung-aug2026', '5. Publication', 'Planning Content Upload', 'HQ / Editor', 'Video Editor',
  '2026-08-18', '2026-08-18', 'Final Approved Video', 'Selesai tepat pada Tanggal Revisi yang ditentukan', 'pending', 10
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-bandung-aug2026-t11', 'brief-bandung-aug2026', '5. Publication', 'Upload video approved ke IG Reels & TikTok sesuai calendar', 'Social Media', 'Socmed Admin',
  '2026-08-20', '2026-08-20', 'Live Social Posts', 'Posting di minggu berikutnya / landing date campaign', 'pending', 11
) on conflict (id) do nothing;

insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c1', 'brief-bandung-aug2026', 'technical', 'Device Smartphone', 'Minimal iPhone / Samsung seri terbaru', 'Resolusi 4K @ 60 FPS / HD 1080p @ 60 FPS', 'pass', 'Sesuai standar spec', 1
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c2', 'brief-bandung-aug2026', 'technical', 'Mode & Kualitas Video', 'Gunakan Cinematic Mode, Lensa bersih', 'Video tidak blur, pecah, atau patah (crack)', 'pass', 'Lensa diseka sebelum take', 2
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c3', 'brief-bandung-aug2026', 'technical', 'Pencahayaan (Lighting)', 'Terang namun warm, cozy, & relaxing', 'Hindari underexposed/overexposed', 'pass', 'Lighting alami & ambient lamp', 3
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c4', 'brief-bandung-aug2026', 'technical', 'Stok Footage (B-Roll)', '3 - 5 variasi footage per 1 scene', 'Wajib stok coverage untuk editing', 'pass', 'Variasi angle tajam & wide', 4
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c5', 'brief-bandung-aug2026', 'therapist', 'Penampilan Rambut', 'Rambut wajib dicepol rapi & bersih', 'Konsistensi tampilan luxury brand', 'pass', 'Sesuai grooming SOP', 5
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c6', 'brief-bandung-aug2026', 'therapist', 'Aksesoris Perhiasan', 'NO ACCESSORIES (Jam, cincin, gelang)', 'Dilarang keras memakai aksesoris saat take', 'pass', 'Dilepas sebelum shooting', 6
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c7', 'brief-bandung-aug2026', 'therapist', 'Seragam Therapist', 'Seragam bersih, rapi, standar brand', 'Tampilan higienis & profesional', 'pass', 'Seragam terstrika rapi', 7
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c8', 'brief-bandung-aug2026', 'setup', 'Kerapian Spa Cabin', 'Ruangan cabin wajib super rapi & bersih', 'Bebas dari barang pribadi/tak terpakai', 'pass', 'Area dipastikan steril', 8
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c9', 'brief-bandung-aug2026', 'setup', 'Hospitality Assets', 'Tray, minyak aromaterapi, handuk, kimono', 'Penataan terstruktur sesuai visual brand', 'pass', 'Handuk terlipat presisi', 9
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c10', 'brief-bandung-aug2026', 'sequence', 'Exterior & Entrance', 'Pintu masuk Spa & Signage logo brand', 'Establishing shot, welcoming & luxury vibe', 'pending', 'Shot tajam & terarah', 10
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c11', 'brief-bandung-aug2026', 'sequence', 'Greeting & Reception', 'Area Receptionist & greeting ramah staff', 'Hospitality, keramahan, & warm smile', 'pending', 'Alur kedatangan ramah', 11
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c12', 'brief-bandung-aug2026', 'sequence', 'Waiting Area', 'Ruang tunggu & ambience ruang depan', 'Kenyamanan, kebersihan ruang tunggu', 'pending', 'Sudut pandang estetik', 12
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c13', 'brief-bandung-aug2026', 'sequence', 'Foot Bath / Reflexology', 'Area reflexology / foot bath station', 'Kerapian tempat & fasilitas pembuka', 'pending', 'B-roll air & kelopak bunga', 13
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c14', 'brief-bandung-aug2026', 'sequence', 'Welcome Experience', 'Penyajian Welcome Drink & Ochibori', 'Detail pelayanan, handuk hangat/dingin', 'pending', 'Close-up nampan drink', 14
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c15', 'brief-bandung-aug2026', 'sequence', 'Cabin Ambience', 'Interior view ruang Spa Cabin menyeluruh', 'Estetika room, pencahayaan warm cozy', 'pending', 'Slow pan motion shot', 15
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c16', 'brief-bandung-aug2026', 'sequence', 'Equipment Tray', 'Close-up nampan peralatan (oil, handuk,scrub, dll)', 'Penataan produk & kebersihan kain', 'pending', 'Detail tekstur & produk', 16
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c17', 'brief-bandung-aug2026', 'sequence', 'Treatment Process', 'All treatment massage shots (gerakan)', 'Teknik therapist & kenyamanan tamu', 'pending', '3-5 variasi gerakan pijat', 17
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-bandung-aug2026-c18', 'brief-bandung-aug2026', 'sequence', 'Aftercare Experience', 'Aftercare treatment (penyajian ginger tea)', 'Sensasi rileks akhir & penutupan ramah', 'pending', 'Penyajian ginger', 18
) on conflict (id) do nothing;

insert into public.outlet_briefs (id, city, outlet_name, title, ref_memo, start_date, status, refs) values (
  'brief-surabaya-aug2026', 'Surabaya', 'Spa Cabin Surabaya',
  'Content Production Surabaya Agustus 2026',
  'Internal Memo No. 179/Int/Memo/OIC/CDM/VII/2026', '2026-08-09', 'active',
  '[{"source":"ANNATHAYA MAJAPAHIT","category":"AMBIENCE","url":"https://vt.tiktok.com/ZS47Fp3ES/","note":""},{"source":"ANNATHAYA MAJAPAHIT","category":"AMBIENCE","url":"https://vt.tiktok.com/ZS47YRjQN/","note":""},{"source":"ANNATHAYA MAJAPAHIT","category":"TREATMENT","url":"https://vt.tiktok.com/ZS47Fnsww/","note":""},{"source":"ANNATHAYA MAJAPAHIT","category":"TREATMENT","url":"https://vt.tiktok.com/ZS47F7XEU/","note":"sesuaikan dengan treatment yang ada di Annathaya"},{"source":"ANNATHAYA MAJAPAHIT","category":"ENTERTAINMENT","url":"https://vt.tiktok.com/ZS47FBvJP/","note":""},{"source":"ANNATHAYA MAJAPAHIT","category":"ENTERTAINMENT","url":"https://vt.tiktok.com/ZS47FXdUq/","note":""},{"source":"ANNATHAYA MAJAPAHIT","category":"ENTERTAINMENT","url":"https://vt.tiktok.com/ZS47FPvFY/","note":""},{"source":"ANNATHAYA WYNDHAM","category":"AMBIENCE","url":"https://vt.tiktok.com/ZS47Y8cKv/","note":""},{"source":"ANNATHAYA WYNDHAM","category":"AMBIENCE","url":"https://www.instagram.com/reel/DU4qy47E99w/?igsh=MXBjZzBuZTlydmFiaw==","note":""},{"source":"ANNATHAYA WYNDHAM","category":"TREATMENT","url":"https://vt.tiktok.com/ZS47FcgJw/","note":""},{"source":"ANNATHAYA WYNDHAM","category":"TREATMENT","url":"https://www.instagram.com/reel/DYXQKPbOWJB/?igsh=ZTVxYW03cWVmdGpw","note":""},{"source":"ANNATHAYA WYNDHAM","category":"ENTERTAINMENT","url":"https://vt.tiktok.com/ZS47FRJkJ/","note":""},{"source":"ANNATHAYA WYNDHAM","category":"ENTERTAINMENT","url":"https://vt.tiktok.com/ZS47NE9b1/","note":""},{"source":"ANNATHAYA WYNDHAM","category":"ENTERTAINMENT","url":"https://vt.tiktok.com/ZS47FYLtP/","note":""}]'::jsonb
) on conflict (id) do nothing;

insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t1', 'brief-surabaya-aug2026', '1. Persiapan & Briefing', 'Filter outlet Spa Cabin & buat content brief promo', 'SBY', 'Tim CDM',
  '2026-08-09', '2026-08-10', 'Content Brief Approved', 'Sesuai standar visual brand & ketersediaan fasilitas cabin', 'completed', 1
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t2', 'brief-surabaya-aug2026', '1. Persiapan & Briefing', 'Briefing, SOP teknis & siapkan folder GDrive', 'SBY', 'CDM',
  '2026-08-09', '2026-08-09', 'Folder Drive & Brief Ready', 'Seluruh PIC Outlet paham SOP & kualifikasi video', 'completed', 2
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t3', 'brief-surabaya-aug2026', '2. Production (Take Content)', 'Cek kesiapan outlet, set-up cabin, & briefing therapist, berikan referensi video', 'SBY', 'PIC Outlet',
  '2026-08-11', '2026-08-11', 'Cabin Clean & Rapi', 'Therapist: Cepol rapi, NO accessories, seragam bersih', 'completed', 3
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t4', 'brief-surabaya-aug2026', '2. Production (Take Content)', 'Take Footage Day 1: Exterior, Reception, Waiting, Welcome Drink, Cabin Ambience, Tray,', 'SBY', 'Videographer / PIC',
  '2026-08-12', '2026-08-12', 'Raw Footage Part 1', '4K/1080p 60fps, Cinematic Mode, 3-5 variasi/scene', 'in_progress', 4
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t5', 'brief-surabaya-aug2026', '2. Production (Take Content)', 'Take Footage Day 2: Treatment & Aftercare, take tiktok trend', 'SBY', 'Videographer / PIC',
  '2026-08-13', '2026-08-13', 'Raw Footage Part 2', 'Lighting warm/cozy, gerakan smooth, no blur/crack', 'pending', 5
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t6', 'brief-surabaya-aug2026', '3. Post-Production', 'Editing video Cinematic Spa Cabin & TikTok creative draft 1 + Deadline Penyerahan Video Draft Pertama', 'Online / Drive', 'PIC Outlet SBY',
  '2026-08-14', '2026-08-14', 'Video Draft Cut 1', 'Folder terstruktur rapi per outlet & jenis promo', 'pending', 6
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t7', 'brief-surabaya-aug2026', '3. Post-Production', 'Upload seluruh raw footage & video yang sudah edit ke Google Drive', 'HQ / Editor - Drive', 'PIC Outlet / Video Editor',
  '2026-08-14', '2026-08-15', 'Raw Files in Drive', 'Pacing pas, audio clear, color grading warm & relaxing', 'pending', 7
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t8', 'brief-surabaya-aug2026', '4. Review & Revisi', 'Proses Kurasi & Sortir konten dari seluruh outlet', 'CDM', 'CDM',
  '2026-08-18', '2026-08-18', 'Draft Submission Complete', 'Maksimal H+3 setelah shooting selesai (Tepat Waktu)', 'pending', 8
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t9', 'brief-surabaya-aug2026', '4. Review & Revisi', 'Proses Perbaikan & Revisi Video (Final Adjustment)', 'HQ CDM Team', 'PIC / CDM',
  '2026-08-19', '2026-08-20', 'Hasil Kurasi & Catatan', 'Menjaga estetika visual & reputasi brand luxury', 'pending', 9
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t10', 'brief-surabaya-aug2026', '5. Publication', 'Planning Content Upload', 'HQ / Editor', 'Video Editor',
  '2026-08-20', '2026-08-21', 'Final Approved Video', 'Selesai tepat pada Tanggal Revisi yang ditentukan', 'pending', 10
) on conflict (id) do nothing;
insert into public.brief_tasks (id, brief_id, phase, task, scope, pic, start_date, end_date, deliverable, quality, status, sort_order) values (
  'brief-surabaya-aug2026-t11', 'brief-surabaya-aug2026', '5. Publication', 'Upload video approved ke IG Reels & TikTok sesuai calendar', 'Social Media', 'Socmed Admin',
  '2026-08-24', '2026-08-24', 'Live Social Posts', 'Posting di minggu berikutnya / terjadwal di content plan', 'pending', 11
) on conflict (id) do nothing;

insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c1', 'brief-surabaya-aug2026', 'technical', 'Device Smartphone', 'Minimal iPhone / Samsung seri terbaru', 'Resolusi 4K @ 60 FPS / HD 1080p @ 60 FPS', 'pass', 'Sesuai standar spec', 1
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c2', 'brief-surabaya-aug2026', 'technical', 'Mode & Kualitas Video', 'Gunakan Cinematic Mode, Lensa bersih', 'Video tidak blur, pecah, atau patah (crack)', 'pass', 'Lensa diseka sebelum take', 2
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c3', 'brief-surabaya-aug2026', 'technical', 'Pencahayaan (Lighting)', 'Terang namun warm, cozy, & relaxing', 'Hindari underexposed/overexposed', 'pass', 'Lighting alami & ambient lamp', 3
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c4', 'brief-surabaya-aug2026', 'technical', 'Stok Footage (B-Roll)', '3 - 5 variasi footage per 1 scene', 'Wajib stok coverage untuk editing', 'pass', 'Variasi angle tajam & wide', 4
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c5', 'brief-surabaya-aug2026', 'therapist', 'Penampilan Rambut', 'Rambut wajib dicepol rapi & bersih', 'Konsistensi tampilan luxury brand', 'pass', 'Sesuai grooming SOP', 5
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c6', 'brief-surabaya-aug2026', 'therapist', 'Aksesoris Perhiasan', 'NO ACCESSORIES (Jam, cincin, gelang)', 'Dilarang keras memakai aksesoris saat take', 'pass', 'Dilepas sebelum shooting', 6
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c7', 'brief-surabaya-aug2026', 'therapist', 'Seragam Therapist', 'Seragam bersih, rapi, standar brand', 'Tampilan higienis & profesional', 'pass', 'Seragam terstrika rapi', 7
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c8', 'brief-surabaya-aug2026', 'setup', 'Kerapian Spa Cabin', 'Ruangan cabin wajib super rapi & bersih', 'Bebas dari barang pribadi/tak terpakai', 'pass', 'Area dipastikan steril', 8
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c9', 'brief-surabaya-aug2026', 'setup', 'Hospitality Assets', 'Tray, minyak aromaterapi, handuk, kimono', 'Penataan terstruktur sesuai visual brand', 'pass', 'Handuk terlipat presisi', 9
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c10', 'brief-surabaya-aug2026', 'sequence', 'Exterior & Entrance', 'Pintu masuk Spa & Signage logo brand', 'Establishing shot, welcoming & luxury vibe', 'pending', 'Shot tajam & terarah', 10
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c11', 'brief-surabaya-aug2026', 'sequence', 'Greeting & Reception', 'Area Receptionist & greeting ramah staff', 'Hospitality, keramahan, & warm smile', 'pending', 'Alur kedatangan ramah', 11
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c12', 'brief-surabaya-aug2026', 'sequence', 'Waiting Area', 'Ruang tunggu & ambience ruang depan', 'Kenyamanan, kebersihan ruang tunggu', 'pending', 'Sudut pandang estetik', 12
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c13', 'brief-surabaya-aug2026', 'sequence', 'Foot Bath / Reflexology', 'Area reflexology / foot bath station', 'Kerapian tempat & fasilitas pembuka', 'pending', 'B-roll air & kelopak bunga', 13
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c14', 'brief-surabaya-aug2026', 'sequence', 'Welcome Experience', 'Penyajian Welcome Drink & Ochibori', 'Detail pelayanan, handuk hangat/dingin', 'pending', 'Close-up nampan drink', 14
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c15', 'brief-surabaya-aug2026', 'sequence', 'Cabin Ambience', 'Interior view ruang Spa Cabin menyeluruh', 'Estetika room, pencahayaan warm cozy', 'pending', 'Slow pan motion shot', 15
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c16', 'brief-surabaya-aug2026', 'sequence', 'Equipment Tray', 'Close-up nampan peralatan (oil, handuk,scrub, dll)', 'Penataan produk & kebersihan kain', 'pending', 'Detail tekstur & produk', 16
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c17', 'brief-surabaya-aug2026', 'sequence', 'Treatment Process', 'All treatment massage shots (gerakan)', 'Teknik therapist & kenyamanan tamu', 'pending', '3-5 variasi gerakan pijat', 17
) on conflict (id) do nothing;
insert into public.brief_checklist (id, brief_id, section, item, spec, mandatory, status, notes, sort_order) values (
  'brief-surabaya-aug2026-c18', 'brief-surabaya-aug2026', 'sequence', 'Aftercare Experience', 'Aftercare treatment (penyajian ginger tea)', 'Sensasi rileks akhir & penutupan ramah', 'pending', 'Penyajian ginger', 18
) on conflict (id) do nothing;
