-- Run in Supabase SQL Editor for a fresh catalog database.
-- The seller password and Supabase secret key belong in Vercel environment variables.
create table if not exists public.catalog_brands (
  id text primary key,
  name text not null check (char_length(name) between 1 and 80),
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_categories (
  id text primary key,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  category text not null check (char_length(category) between 1 and 80),
  name text not null check (char_length(name) between 1 and 120),
  published boolean not null default true,
  sort_order integer not null default 0,
  sizes jsonb not null default '[]'::jsonb check (jsonb_typeof(sizes) = 'array'),
  colorways jsonb not null default '[]'::jsonb check (jsonb_typeof(colorways) = 'array'),
  updated_at timestamptz not null default now()
);

-- Upgrades databases created with the original five-category constraint.
alter table public.catalog_products drop constraint if exists catalog_products_category_check;

alter table public.catalog_brands enable row level security;
alter table public.catalog_categories enable row level security;
alter table public.catalog_products enable row level security;

revoke all on public.catalog_brands, public.catalog_categories, public.catalog_products from anon, authenticated;
grant select on public.catalog_brands, public.catalog_categories, public.catalog_products to anon;

drop policy if exists "Anyone sees brands" on public.catalog_brands;
create policy "Anyone sees brands" on public.catalog_brands for select to anon using (true);
drop policy if exists "Anyone sees categories" on public.catalog_categories;
create policy "Anyone sees categories" on public.catalog_categories for select to anon using (true);
drop policy if exists "Visitors see published products" on public.catalog_products;
create policy "Visitors see published products" on public.catalog_products for select to anon using (published);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-images', 'catalog-images', true, 4194304, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
