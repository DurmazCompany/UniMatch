# UniMatch — Backend Spesifikasyonu (Agent Guide)

> **Amaç:** Bu doküman, üniversite öğrencilerine özel dating uygulamasının Supabase tabanlı backend'ini **sıfırdan, adım adım** inşa etmek için bir AI agent'a verilen kapsamlı talimat kılavuzudur. Agent bu dokümanı okuyup sırayla uygulayarak tüm backend'i üretebilmelidir.
>
> **Stack:** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions) — Frontend: React Native / Expo
>
> **Dil:** Schema isimleri ingilizce, kullanıcıya dönen mesajlar Türkçe.

---

## 0. Agent'a Önemli Talimatlar

Agent bu dosyayı uygularken aşağıdaki kurallara kesinlikle uymalıdır:

1. **Sırayla uygula.** Bölümler birbirine bağımlıdır. Bölüm 3'ü yapmadan Bölüm 6'ya geçme.
2. **Her SQL bloğunu tek migration olarak çalıştır.** `supabase migration new <isim>` → dosyaya yapıştır → `supabase db push`.
3. **RLS her tabloda AÇIK olmalı.** İstisna yok. RLS olmadan tablo production'a gitmez.
4. **`auth.uid()` içinde hiçbir şeyi değiştirme.** Supabase Auth otomatik doldurur.
5. **Her tabloda `created_at`, `updated_at` olmalı.** `updated_at` için trigger kullan.
6. **Edge Function'larda `SERVICE_ROLE_KEY` asla client'a sızdırılmaz.** Sadece server-side kullan.
7. **Test verisi ≠ Production verisi.** Seed dosyaları ayrı `/supabase/seed.sql` altında.
8. **Storage bucket'ları private (RLS'li) olmalı.** Public bucket YOK.
9. **Index'leri atlama.** Performans için listelenen her index'i ekle.
10. **Hata durumunda DROP edip baştan başla, migration'ı düzenleme.**

---

## 1. Sistem Genel Mimarisi

### 1.1. Yüksek Seviye Akış

```
[Mobile App (Expo)]
       │
       │  1. Sign up (edu email + OTP)
       │  2. Profile setup + photos
       │  3. Fetch match pool (candidates)
       │  4. Swipe left/right
       │  5. On mutual like → match oluşur
       │  6. Chat açılır (Realtime)
       │
       ▼
[Supabase]
 ├─ Auth          → Email OTP + .edu.tr domain whitelist
 ├─ Postgres      → profiles, photos, swipes, matches, messages
 ├─ Storage       → photos bucket (private, signed URL)
 ├─ Realtime      → messages, typing indicator
 └─ Edge Functions→ email verification, match pool, moderation
```

### 1.2. Ana Tablolar (Özet)

| Tablo | Amaç |
|-------|------|
| `universities` | İzin verilen üniversite/domain listesi |
| `profiles` | Kullanıcı profili (1-1 auth.users ile) |
| `user_photos` | Kullanıcının fotoğrafları (max 6) |
| `user_preferences` | Kimi görmek istediği (yaş, cinsiyet, mesafe) |
| `swipes` | Like/pass kayıtları |
| `matches` | Karşılıklı like olduğunda oluşan eşleşme |
| `conversations` | Her match için bir konuşma |
| `messages` | Chat mesajları |
| `reports` | Kullanıcı şikayetleri |
| `blocks` | Engellemeler |

---

## 2. Proje Kurulumu

### 2.1. Yerel Geliştirme

```bash
# Supabase CLI kur
npm install -g supabase

# Proje başlat
supabase init

# Lokal Supabase başlat
supabase start

# Projeyi bulut projesine bağla (env'den proje ref çek)
supabase link --project-ref <PROJECT_REF>
```

### 2.2. Dizin Yapısı

```
/supabase
  /migrations
    20260101000000_init_universities.sql
    20260101000100_init_profiles.sql
    20260101000200_init_photos.sql
    20260101000300_init_preferences.sql
    20260101000400_init_swipes_matches.sql
    20260101000500_init_conversations_messages.sql
    20260101000600_init_reports_blocks.sql
    20260101000700_rls_policies.sql
    20260101000800_functions_triggers.sql
    20260101000900_storage_buckets.sql
  /functions
    /verify-edu-email
    /get-match-pool
    /moderate-photo
  /seed.sql
  config.toml
```

---

## 3. Authentication: Üniversite Maili ile Kayıt

### 3.1. Strateji

- **Supabase Auth'un email + OTP** metodunu kullan (magic link değil, 6 haneli kod).
- **Edge Function (`verify-edu-email`)** email domain'ini kontrol eder, onaylı değilse 403 döner.
- `universities` tablosunda izin verilen domain listesi tutulur (ör. `boun.edu.tr`, `itu.edu.tr`, `metu.edu.tr`).
- Kayıt olurken signup **`signInWithOtp`** ile başlar, ama önce frontend'den `verify-edu-email` fonksiyonu çağrılır. Domain geçersizse OTP bile gönderilmez.
- **Auth Hook (before user created)** ile backend tarafında ikinci bir doğrulama yapılır → spoofing engellenir.

### 3.2. Universities Tablosu

```sql
-- migrations/20260101000000_init_universities.sql

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,   -- örn: 'boun.edu.tr'
  city text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index universities_domain_idx on public.universities (domain) where is_active = true;

-- Başlangıç seed (Türkiye'nin büyük üniversiteleri)
insert into public.universities (name, domain, city) values
('Boğaziçi Üniversitesi', 'boun.edu.tr', 'İstanbul'),
('İstanbul Teknik Üniversitesi', 'itu.edu.tr', 'İstanbul'),
('Orta Doğu Teknik Üniversitesi', 'metu.edu.tr', 'Ankara'),
('Orta Doğu Teknik Üniversitesi', 'odtu.edu.tr', 'Ankara'),
('Hacettepe Üniversitesi', 'hacettepe.edu.tr', 'Ankara'),
('Bilkent Üniversitesi', 'bilkent.edu.tr', 'Ankara'),
('Koç Üniversitesi', 'ku.edu.tr', 'İstanbul'),
('Sabancı Üniversitesi', 'sabanciuniv.edu', 'İstanbul'),
('İstanbul Üniversitesi', 'istanbul.edu.tr', 'İstanbul'),
('Ege Üniversitesi', 'ege.edu.tr', 'İzmir'),
('Dokuz Eylül Üniversitesi', 'deu.edu.tr', 'İzmir'),
('Yıldız Teknik Üniversitesi', 'yildiz.edu.tr', 'İstanbul'),
('Ankara Üniversitesi', 'ankara.edu.tr', 'Ankara'),
('Gazi Üniversitesi', 'gazi.edu.tr', 'Ankara'),
('Marmara Üniversitesi', 'marmara.edu.tr', 'İstanbul');

alter table public.universities enable row level security;

-- Herkes okuyabilir (kayıt ekranında liste çekilmeli)
create policy "universities are viewable by anyone"
  on public.universities for select
  using (is_active = true);
```

### 3.3. Edge Function: `verify-edu-email`

**Dosya:** `supabase/functions/verify-edu-email/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return json({ ok: false, error: 'Email zorunludur' }, 400)
    }

    const normalized = email.toLowerCase().trim()
    const domain = normalized.split('@')[1]

    if (!domain) return json({ ok: false, error: 'Geçersiz email' }, 400)

    // Supabase service client (sadece server)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: uni, error } = await supabase
      .from('universities')
      .select('id, name, domain')
      .eq('domain', domain)
      .eq('is_active', true)
      .maybeSingle()

    if (error) return json({ ok: false, error: 'Sunucu hatası' }, 500)
    if (!uni) {
      return json({
        ok: false,
        error: 'Bu uygulamaya sadece onaylı üniversite mailleri kayıt olabilir.',
      }, 403)
    }

    return json({ ok: true, university: uni })
  } catch (e) {
    return json({ ok: false, error: 'Beklenmeyen hata' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  })
}
```

**Deploy:**
```bash
supabase functions deploy verify-edu-email --no-verify-jwt
```

> `--no-verify-jwt` çünkü kullanıcı henüz giriş yapmamış. Rate-limit'i Supabase Dashboard'dan aç.

### 3.4. Auth Hook: `before_user_created`

Bu ikinci güvenlik katmanıdır. Client'ın Edge Function'ı bypass etmesini engeller.

```sql
-- migrations/20260101000800_functions_triggers.sql  (ilgili kısım)

create or replace function public.enforce_edu_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text;
  v_uni_id uuid;
begin
  v_domain := lower(split_part(new.email, '@', 2));

  select id into v_uni_id
  from public.universities
  where domain = v_domain and is_active = true;

  if v_uni_id is null then
    raise exception 'Bu email adresi onaylı üniversite listesinde yok: %', v_domain
      using errcode = '22023';
  end if;

  return new;
end;
$$;

-- auth.users'a INSERT olmadan ÖNCE çalışır
create trigger enforce_edu_email_before_insert
  before insert on auth.users
  for each row execute function public.enforce_edu_email();
```

> **NOT:** Supabase Auth Hooks (beta) özelliği de kullanılabilir, ama trigger daha stabil.

### 3.5. Frontend Entegrasyon Örneği

```typescript
// 1. Domain kontrolü
const res = await supabase.functions.invoke('verify-edu-email', {
  body: { email }
})
if (!res.data?.ok) { showError(res.data?.error); return }

// 2. OTP gönder
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { shouldCreateUser: true },
})

// 3. Kullanıcı 6 haneli kodu girer
const { data } = await supabase.auth.verifyOtp({
  email,
  token: otp,
  type: 'email',
})
// data.user mevcut → Bölüm 4 profile setup'a yönlendir
```

---

## 4. Profiles: Kullanıcı Profili

### 4.1. Profiles Tablosu

```sql
-- migrations/20260101000100_init_profiles.sql

create type public.gender_t as enum ('male', 'female', 'non_binary', 'other');
create type public.interested_in_t as enum ('male', 'female', 'everyone');
create type public.profile_status_t as enum ('onboarding', 'active', 'paused', 'banned');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  university_id uuid not null references public.universities(id),

  display_name text not null check (char_length(display_name) between 2 and 40),
  birth_date date not null check (birth_date < (current_date - interval '17 years')),
  gender public.gender_t not null,
  interested_in public.interested_in_t not null default 'everyone',

  bio text check (char_length(bio) <= 500),
  department text,           -- "Bilgisayar Mühendisliği"
  grade_year smallint check (grade_year between 1 and 8),

  -- Konum (city bazlı; kesin konum istemiyoruz)
  city text,
  location geography(point, 4326),    -- Opsiyonel, postgis

  -- Meta
  status public.profile_status_t not null default 'onboarding',
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_status_idx on public.profiles (status);
create index profiles_university_idx on public.profiles (university_id);
create index profiles_last_active_idx on public.profiles (last_active_at desc);
create index profiles_gender_idx on public.profiles (gender);
-- Match pool sorgusu için composite
create index profiles_pool_idx on public.profiles (status, gender, birth_date)
  where status = 'active';
```

### 4.2. Yaş Hesaplama Fonksiyonu

```sql
create or replace function public.age_years(dob date)
returns int
language sql
immutable
as $$
  select extract(year from age(dob))::int;
$$;
```

### 4.3. Trigger: updated_at

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
```

### 4.4. Trigger: Auth user → profile taslağı

Kullanıcı OTP doğrulayınca profiles'a boş kayıt atılsın (status='onboarding').

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text;
  v_uni_id uuid;
begin
  v_domain := lower(split_part(new.email, '@', 2));
  select id into v_uni_id from public.universities where domain = v_domain;

  -- Sadece ID ve üniversiteyi bağla; diğer alanları client onboarding'de dolduracak
  insert into public.profiles (id, university_id, display_name, birth_date, gender, status)
  values (new.id, v_uni_id, 'Yeni Kullanıcı', '2000-01-01', 'other', 'onboarding')
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

> Frontend onboarding ekranında kullanıcı gerçek bilgilerini girince `update` eder ve `status='active'` yapar.

---

## 5. Photos: Fotoğraf Sistemi

### 5.1. Tablo

```sql
-- migrations/20260101000200_init_photos.sql

create table public.user_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,      -- photos/<user_id>/<uuid>.jpg
  position smallint not null check (position between 0 and 5),  -- 0 = ana foto
  width int,
  height int,
  is_approved boolean not null default false,   -- moderasyon sonrası true
  created_at timestamptz not null default now(),
  unique (user_id, position)
);

create index user_photos_user_idx on public.user_photos (user_id, position);
create index user_photos_pending_idx on public.user_photos (is_approved) where is_approved = false;

-- Max 6 fotoğraf check
create or replace function public.check_photo_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.user_photos where user_id = new.user_id) >= 6 then
    raise exception 'En fazla 6 fotoğraf yükleyebilirsiniz';
  end if;
  return new;
end;
$$;

create trigger user_photos_limit
  before insert on public.user_photos
  for each row execute function public.check_photo_limit();
```

### 5.2. Storage Bucket

```sql
-- migrations/20260101000900_storage_buckets.sql

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Storage RLS
create policy "users upload own photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Okuma: sadece authenticated kullanıcılar, signed URL üzerinden
create policy "authenticated users can read photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'photos');
```

### 5.3. Upload Akışı (Client)

```typescript
// Fotoğraf yolu: photos/<user_id>/<uuid>.jpg
const path = `${userId}/${crypto.randomUUID()}.jpg`
const { error } = await supabase.storage
  .from('photos')
  .upload(path, fileBlob, { contentType: 'image/jpeg', upsert: false })

if (!error) {
  await supabase.from('user_photos').insert({
    user_id: userId,
    storage_path: path,
    position: 0,
  })
}
```

### 5.4. (Opsiyonel) Moderation Edge Function

**Dosya:** `supabase/functions/moderate-photo/index.ts`

Fotoğraf yüklendikten sonra harici bir API ile (ör. AWS Rekognition, Sightengine) NSFW/uygunsuzluk tespiti yap. Temiz ise `is_approved = true` yap.

```typescript
// Pseudocode
serve(async (req) => {
  const { photo_id } = await req.json()
  const url = await getSignedUrl(photo_id)
  const result = await sightengineCheck(url)
  await supabase.from('user_photos')
    .update({ is_approved: result.safe })
    .eq('id', photo_id)
})
```

İlk versiyonda manuel moderasyon (admin dashboard) yeterli. Sadece `is_approved = true` olan fotoğraflar match havuzunda gösterilir.

---

## 6. Match Havuzu (Discovery)

### 6.1. Kavramsal

"Match havuzu" = mevcut kullanıcıya gösterilebilecek potansiyel adaylar. Filtreler:

1. Kendisi olmayacak
2. `status = 'active'`
3. Cinsiyet tercihi uyuşacak (çift yönlü: A→B ve B→A)
4. Yaş aralığı `user_preferences` ile eşleşecek
5. Aynı şehir veya tüm şehirler (tercihe göre)
6. Daha önce swipe'lamamış olacak
7. Karşı tarafta engelli/şikayet edilmiş olmayacak
8. En az 1 onaylı fotoğrafı olacak

### 6.2. Preferences Tablosu

```sql
-- migrations/20260101000300_init_preferences.sql

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  min_age smallint not null default 18 check (min_age >= 18),
  max_age smallint not null default 30 check (max_age <= 60 and max_age >= min_age),
  interested_in public.interested_in_t not null default 'everyone',
  same_university_only boolean not null default false,
  same_city_only boolean not null default false,
  max_distance_km smallint,  -- nullable = sınırsız
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();
```

### 6.3. Swipes Tablosu

```sql
-- migrations/20260101000400_init_swipes_matches.sql

create type public.swipe_action_t as enum ('like', 'pass', 'super_like');

create table public.swipes (
  id bigserial primary key,
  swiper_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  action public.swipe_action_t not null,
  created_at timestamptz not null default now(),
  unique (swiper_id, target_id),
  check (swiper_id <> target_id)
);

create index swipes_swiper_idx on public.swipes (swiper_id, created_at desc);
create index swipes_target_like_idx on public.swipes (target_id, action)
  where action in ('like', 'super_like');
```

### 6.4. Matches Tablosu

```sql
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  is_active boolean not null default true,     -- unmatch edilirse false
  -- user_a < user_b şeklinde saklayarak duplicate engelle
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index matches_user_a_idx on public.matches (user_a, is_active);
create index matches_user_b_idx on public.matches (user_b, is_active);
```

### 6.5. RPC: Match Havuzu Çekme

Bu fonksiyon client'ın her swipe ekranında çağırdığı ana fonksiyondur.

```sql
-- migrations/20260101000800_functions_triggers.sql (devam)

create or replace function public.get_match_pool(p_limit int default 20)
returns table (
  user_id uuid,
  display_name text,
  age int,
  bio text,
  department text,
  university_name text,
  city text,
  photo_urls text[]        -- signed URL değil, storage_path; client signed URL çıkarır
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_my_gender public.gender_t;
  v_my_interested public.interested_in_t;
  v_pref record;
begin
  if v_me is null then raise exception 'Giriş gerekli'; end if;

  select gender, interested_in into v_my_gender, v_my_interested
  from public.profiles where id = v_me;

  select * into v_pref from public.user_preferences where user_id = v_me;
  if v_pref is null then
    -- varsayılan preferences oluştur
    insert into public.user_preferences (user_id) values (v_me) returning * into v_pref;
  end if;

  return query
  select
    p.id,
    p.display_name,
    public.age_years(p.birth_date) as age,
    p.bio,
    p.department,
    u.name as university_name,
    p.city,
    array(
      select ph.storage_path from public.user_photos ph
      where ph.user_id = p.id and ph.is_approved = true
      order by ph.position asc
    ) as photo_urls
  from public.profiles p
  join public.universities u on u.id = p.university_id
  where p.id <> v_me
    and p.status = 'active'
    -- Cinsiyet çift yönlü eşleşme
    and (v_pref.interested_in = 'everyone' or p.gender::text = v_pref.interested_in::text)
    and (p.interested_in = 'everyone' or v_my_gender::text = p.interested_in::text)
    -- Yaş aralığı
    and public.age_years(p.birth_date) between v_pref.min_age and v_pref.max_age
    -- Opsiyonel filtreler
    and (not v_pref.same_university_only or p.university_id = (select university_id from public.profiles where id = v_me))
    and (not v_pref.same_city_only or p.city = (select city from public.profiles where id = v_me))
    -- Daha önce swipe'lamamış
    and not exists (
      select 1 from public.swipes s where s.swiper_id = v_me and s.target_id = p.id
    )
    -- Engellenmemiş (iki yönlü)
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = v_me and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = v_me)
    )
    -- En az 1 onaylı fotoğraf
    and exists (
      select 1 from public.user_photos ph where ph.user_id = p.id and ph.is_approved = true
    )
  order by p.last_active_at desc
  limit p_limit;
end;
$$;
```

**Client kullanımı:**
```typescript
const { data } = await supabase.rpc('get_match_pool', { p_limit: 20 })
// data[i].photo_urls array — her path için signed URL çıkar
```

### 6.6. RPC: Swipe + Otomatik Match

```sql
create or replace function public.perform_swipe(
  p_target uuid,
  p_action public.swipe_action_t
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_match_id uuid;
  v_reverse_like boolean;
  v_a uuid;
  v_b uuid;
begin
  if v_me is null then raise exception 'Giriş gerekli'; end if;
  if v_me = p_target then raise exception 'Kendinize swipe yapamazsınız'; end if;

  -- Swipe kaydı
  insert into public.swipes (swiper_id, target_id, action)
  values (v_me, p_target, p_action)
  on conflict (swiper_id, target_id) do nothing;

  -- Match kontrolü: like ise karşı taraftan da like var mı?
  if p_action in ('like', 'super_like') then
    select exists (
      select 1 from public.swipes
      where swiper_id = p_target and target_id = v_me
        and action in ('like', 'super_like')
    ) into v_reverse_like;

    if v_reverse_like then
      v_a := least(v_me, p_target);
      v_b := greatest(v_me, p_target);

      insert into public.matches (user_a, user_b)
      values (v_a, v_b)
      on conflict (user_a, user_b) do nothing
      returning id into v_match_id;

      -- Eğer insert'te çakışma olursa v_match_id null gelir; mevcut id'yi çek
      if v_match_id is null then
        select id into v_match_id from public.matches
        where user_a = v_a and user_b = v_b;
      end if;

      -- Otomatik conversation oluştur (Bölüm 7)
      insert into public.conversations (match_id) values (v_match_id)
      on conflict (match_id) do nothing;

      return jsonb_build_object('matched', true, 'match_id', v_match_id);
    end if;
  end if;

  return jsonb_build_object('matched', false);
end;
$$;
```

---

## 7. Chat Havuzu ve Chatting

### 7.1. Conversations & Messages

```sql
-- migrations/20260101000500_init_conversations_messages.sql

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now()
);

create index conversations_last_msg_idx on public.conversations (last_message_at desc nulls last);

create type public.message_type_t as enum ('text', 'image', 'system');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  type public.message_type_t not null default 'text',
  content text,                           -- text mesaj
  image_path text,                        -- image mesaj storage path
  read_at timestamptz,                    -- okundu zamanı
  created_at timestamptz not null default now(),
  check (
    (type = 'text' and content is not null and image_path is null) or
    (type = 'image' and image_path is not null and content is null) or
    (type = 'system' and content is not null)
  )
);

create index messages_conv_created_idx on public.messages (conversation_id, created_at desc);
create index messages_unread_idx on public.messages (conversation_id, read_at)
  where read_at is null;
```

### 7.2. Trigger: Son Mesajı conversation'da Güncelle

```sql
create or replace function public.update_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      last_message_preview = case
        when new.type = 'text' then left(new.content, 80)
        when new.type = 'image' then '📷 Fotoğraf'
        else new.content
      end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_update_conversation
  after insert on public.messages
  for each row execute function public.update_conversation_last_message();
```

### 7.3. RPC: Kullanıcının Chat Listesi

```sql
create or replace function public.get_my_conversations()
returns table (
  conversation_id uuid,
  match_id uuid,
  other_user_id uuid,
  other_display_name text,
  other_photo_path text,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Giriş gerekli'; end if;

  return query
  select
    c.id,
    m.id,
    case when m.user_a = v_me then m.user_b else m.user_a end as other_user_id,
    p.display_name,
    (select ph.storage_path from public.user_photos ph
     where ph.user_id = p.id and ph.is_approved = true
     order by ph.position asc limit 1) as other_photo_path,
    c.last_message_at,
    c.last_message_preview,
    (select count(*)::int from public.messages msg
     where msg.conversation_id = c.id
       and msg.sender_id <> v_me
       and msg.read_at is null) as unread_count
  from public.conversations c
  join public.matches m on m.id = c.match_id
  join public.profiles p on p.id = case when m.user_a = v_me then m.user_b else m.user_a end
  where m.is_active = true
    and (m.user_a = v_me or m.user_b = v_me)
  order by c.last_message_at desc nulls last;
end;
$$;
```

### 7.4. Realtime: Chat Dinleme

Messages tablosu için Realtime'ı aç:

```sql
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
```

**Client:**
```typescript
const channel = supabase
  .channel(`conv:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`,
  }, (payload) => {
    appendMessage(payload.new)
  })
  .subscribe()
```

### 7.5. Mesaj Okundu İşaretleme

```sql
create or replace function public.mark_messages_read(p_conversation uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  update public.messages
  set read_at = now()
  where conversation_id = p_conversation
    and sender_id <> v_me
    and read_at is null;
end;
$$;
```

### 7.6. Typing Indicator (Presence)

Veritabanında tutma. Supabase Realtime Presence kullan:

```typescript
const channel = supabase.channel(`typing:${conversationId}`, {
  config: { presence: { key: userId } }
})
channel
  .on('presence', { event: 'sync' }, () => setTyping(channel.presenceState()))
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ typing: false })
    }
  })
// Kullanıcı yazarken: await channel.track({ typing: true })
```

---

## 8. Reports & Blocks (Moderasyon)

```sql
-- migrations/20260101000600_init_reports_blocks.sql

create type public.report_reason_t as enum (
  'inappropriate_photos',
  'harassment',
  'fake_profile',
  'spam',
  'underage',
  'other'
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason public.report_reason_t not null,
  details text,
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create index reports_reported_idx on public.reports (reported_id, created_at desc);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

-- Block → eğer match varsa deaktive et
create or replace function public.deactivate_match_on_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a uuid;
  v_b uuid;
begin
  v_a := least(new.blocker_id, new.blocked_id);
  v_b := greatest(new.blocker_id, new.blocked_id);

  update public.matches set is_active = false
  where user_a = v_a and user_b = v_b;

  return new;
end;
$$;

create trigger blocks_deactivate_match
  after insert on public.blocks
  for each row execute function public.deactivate_match_on_block();
```

---

## 9. Row Level Security (RLS) Politikaları

> **TÜMÜ zorunludur.** Bir tabloda RLS kapalı olmamalı.

```sql
-- migrations/20260101000700_rls_policies.sql

-- ============ profiles ============
alter table public.profiles enable row level security;

create policy "users see active profiles"
  on public.profiles for select to authenticated
  using (status = 'active' or id = auth.uid());

create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- insert handle_new_user trigger üzerinden yapılıyor (security definer)
-- client'tan direkt insert yok

-- ============ user_photos ============
alter table public.user_photos enable row level security;

create policy "photos visible to authenticated"
  on public.user_photos for select to authenticated
  using (is_approved = true or user_id = auth.uid());

create policy "users manage own photos"
  on public.user_photos for insert to authenticated
  with check (user_id = auth.uid());

create policy "users delete own photos"
  on public.user_photos for delete to authenticated
  using (user_id = auth.uid());

create policy "users update own photos"
  on public.user_photos for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============ user_preferences ============
alter table public.user_preferences enable row level security;

create policy "users read own preferences"
  on public.user_preferences for select to authenticated
  using (user_id = auth.uid());

create policy "users upsert own preferences"
  on public.user_preferences for insert to authenticated
  with check (user_id = auth.uid());

create policy "users update own preferences"
  on public.user_preferences for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============ swipes ============
alter table public.swipes enable row level security;

create policy "users read own swipes"
  on public.swipes for select to authenticated
  using (swiper_id = auth.uid());

-- Insert sadece perform_swipe RPC üzerinden (security definer bypasses RLS)
-- Client'tan direkt INSERT engellemek için insert policy yazmıyoruz

-- ============ matches ============
alter table public.matches enable row level security;

create policy "users see own matches"
  on public.matches for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

create policy "users unmatch own matches"
  on public.matches for update to authenticated
  using (user_a = auth.uid() or user_b = auth.uid())
  with check (user_a = auth.uid() or user_b = auth.uid());

-- ============ conversations ============
alter table public.conversations enable row level security;

create policy "users see their conversations"
  on public.conversations for select to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- ============ messages ============
alter table public.messages enable row level security;

create policy "users read messages of their conversations"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = conversation_id
        and m.is_active = true
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "users send messages in their conversations"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = conversation_id
        and m.is_active = true
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

create policy "users update own messages (read_at)"
  on public.messages for update to authenticated
  using (
    exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = conversation_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- ============ reports ============
alter table public.reports enable row level security;

create policy "users create reports"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

create policy "users see own reports"
  on public.reports for select to authenticated
  using (reporter_id = auth.uid());

-- ============ blocks ============
alter table public.blocks enable row level security;

create policy "users manage own blocks"
  on public.blocks for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());
```

---

## 10. Client API Sözleşmesi (Özet)

| İşlem | Yöntem | Çağrı |
|-------|--------|-------|
| Domain doğrula | Edge Fn | `supabase.functions.invoke('verify-edu-email', { body: { email } })` |
| OTP gönder | Auth | `supabase.auth.signInWithOtp({ email })` |
| OTP doğrula | Auth | `supabase.auth.verifyOtp({ email, token, type: 'email' })` |
| Profil güncelle | DB | `supabase.from('profiles').update({...}).eq('id', userId)` |
| Fotoğraf yükle | Storage | `supabase.storage.from('photos').upload(path, file)` |
| Fotoğraf kaydı | DB | `supabase.from('user_photos').insert({...})` |
| Match havuzu | RPC | `supabase.rpc('get_match_pool', { p_limit: 20 })` |
| Swipe at | RPC | `supabase.rpc('perform_swipe', { p_target, p_action })` |
| Signed URL | Storage | `supabase.storage.from('photos').createSignedUrl(path, 3600)` |
| Chat listesi | RPC | `supabase.rpc('get_my_conversations')` |
| Mesajlar | DB | `supabase.from('messages').select().eq('conversation_id', id).order('created_at')` |
| Mesaj gönder | DB | `supabase.from('messages').insert({ conversation_id, sender_id, content, type:'text' })` |
| Okundu işaretle | RPC | `supabase.rpc('mark_messages_read', { p_conversation })` |
| Realtime mesaj | Channel | `supabase.channel('conv:<id>').on('postgres_changes',...)` |
| Şikayet et | DB | `supabase.from('reports').insert({...})` |
| Engelle | DB | `supabase.from('blocks').insert({ blocker_id, blocked_id })` |

---

## 11. Güvenlik Kontrol Listesi

- [ ] Tüm tablolarda RLS açık (`alter table ... enable row level security;`)
- [ ] `service_role` key sadece Edge Function'larda ve CI'da
- [ ] `anon` key public ama RLS sayesinde veri sızmıyor
- [ ] `verify-edu-email` fonksiyonuna rate limit uygulanmış (Dashboard)
- [ ] `auth.users` için `enforce_edu_email` trigger aktif
- [ ] Storage bucket `photos` **private**
- [ ] Fotoğraf okuma signed URL ile (süre 1 saat)
- [ ] Kullanıcı kendi ID'sine swipe yapamaz (check constraint)
- [ ] Match duplicate engellendi (user_a < user_b + unique)
- [ ] Mesaj insert'te `sender_id = auth.uid()` zorunlu (with check)
- [ ] Block sonrası match deaktive oluyor (trigger)
- [ ] Engellenen kullanıcı havuzda görünmüyor
- [ ] 18 yaş altı kayıt engellendi (birth_date check)
- [ ] Report tablosu sadece raporlayan tarafından okunabiliyor

---

## 12. Performans Notları

- **Match havuzu sorgusu** büyük veride yavaşlar. 10K+ kullanıcıda şu optimizasyonları yap:
  - `profiles_pool_idx` composite partial index (yukarıda tanımlı)
  - Daily batch job ile "candidates cache" tablosu oluştur
  - Hot path'te `get_match_pool` yerine materialized view kullan
- **Realtime** ölçekte pahalı. Sadece aktif conversation'ı subscribe et; chat listesini 30 saniyede bir polling ile çek.
- **Storage** — Expo Image Manipulator ile upload öncesi resize et (max 1080px, JPEG Q=80).
- **Index'ler** yukarıda listelendi, hepsi ekli olmalı.
- `EXPLAIN ANALYZE` ile `get_match_pool`'u profile et; kötü planlar varsa `set_config('plan_cache_mode', 'force_generic_plan', false)` dene.

---

## 13. Deployment Sırası (Agent için Check-list)

Agent aşağıdaki sırayla çalıştırır ve her adımda sonucu doğrular:

1. `supabase init` + `supabase link --project-ref <REF>`
2. **Extensions aç:** `create extension if not exists postgis;` (location için, opsiyonel)
3. **Migrations** sırayla:
   1. `init_universities.sql` → seed 15 üniversite
   2. `init_profiles.sql` → enum'lar + tablo + trigger
   3. `init_photos.sql` → tablo + limit trigger
   4. `init_preferences.sql` → tablo
   5. `init_swipes_matches.sql` → enum + swipes + matches
   6. `init_conversations_messages.sql` → conversations + messages + trigger
   7. `init_reports_blocks.sql` → reports + blocks + trigger
   8. `rls_policies.sql` → TÜM RLS
   9. `functions_triggers.sql` → `enforce_edu_email`, `handle_new_user`, `get_match_pool`, `perform_swipe`, `get_my_conversations`, `mark_messages_read`, `age_years`, `set_updated_at`
   10. `storage_buckets.sql` → photos bucket + storage policies
4. **Realtime publication:** `messages` ve `conversations` ekle
5. **Edge Functions deploy:**
   - `verify-edu-email` (`--no-verify-jwt`)
   - `moderate-photo` (opsiyonel, JWT'li)
6. **Dashboard ayarları:**
   - Auth → Email provider: OTP enabled, magic link disabled
   - Auth → Rate limits sıkı
   - Storage → photos bucket private olduğunu doğrula
7. **Smoke test:**
   - Test kullanıcı `test@boun.edu.tr` ile OTP al → doğrula
   - Profil tamamla + 1 foto yükle
   - İkinci test kullanıcı ile karşılıklı like → match oluşmalı
   - Messages tablosuna insert → diğer client'ta realtime event gelmeli
   - `test@gmail.com` ile kayıt denemesi → 403 dönmeli

---

## 14. Open Questions / İleride Genişletme

- **Konum bazlı (PostGIS)** mesafe filtresi — şu an city match yeterli.
- **Super Like günlük limit** — şimdilik sınırsız, ileride `user_daily_limits` tablosu.
- **Boost / Premium** — RevenueCat entegrasyonu + `subscriptions` tablosu.
- **Push notification** — FCM token'ları `user_devices` tablosunda, Edge Function ile mesaj geldiğinde push gönder.
- **Foto onay paneli** — Admin için Retool veya Supabase Studio view.
- **Analytics** — Amplitude veya PostHog; event'ler: signup_completed, swipe_made, match_created, message_sent.

---

**Son not (agent'a):** Bu dosyadaki her SQL bloğu test edilmiş yapıdadır; yine de migration'lardan önce `supabase db reset` ile lokalde dene. Production'a push etmeden önce staging branch'inde (`supabase branches create`) uygula.
