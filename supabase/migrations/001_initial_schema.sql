-- ============================================================
-- Coloring Books — initial schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Parent profiles (1:1 with auth.users) ──────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- Automatically create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Child profiles (multiple per parent) ───────────────────
create table if not exists public.children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  avatar_color text not null default '#FF6B6B',
  created_at   timestamptz not null default now()
);

-- ─── Book catalog (admin-managed) ───────────────────────────
create table if not exists public.books (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text,
  cover_image_url      text,
  price_digital_cents  integer not null default 0,
  price_physical_cents integer not null default 1999,
  page_count           integer not null default 1,
  created_at           timestamptz not null default now()
);

-- ─── Pages within books ──────────────────────────────────────
create table if not exists public.pages (
  id                        uuid primary key default gen_random_uuid(),
  book_id                   uuid not null references public.books(id) on delete cascade,
  page_number               integer not null,
  outline_url               text not null,
  animatable_elements_url   text not null,
  created_at                timestamptz not null default now(),
  unique (book_id, page_number)
);

-- ─── User libraries (which books a parent owns) ──────────────
create table if not exists public.user_libraries (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.profiles(id) on delete cascade,
  book_id      uuid not null references public.books(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  unique (parent_id, book_id)
);

-- ─── Per-child coloring progress ────────────────────────────
create table if not exists public.user_saved_pages (
  id                uuid primary key default gen_random_uuid(),
  child_id          uuid not null references public.children(id) on delete cascade,
  page_id           uuid not null references public.pages(id) on delete cascade,
  colored_image_url text,                        -- Supabase Storage path
  fill_percentage   float not null default 0,
  completed_at      timestamptz,                  -- null until fill >= 85 %
  updated_at        timestamptz not null default now(),
  unique (child_id, page_id)
);

-- ─── Row-Level Security ──────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.books enable row level security;
alter table public.pages enable row level security;
alter table public.user_libraries enable row level security;
alter table public.user_saved_pages enable row level security;

-- profiles: only own row
create policy "profiles: owner access"
  on public.profiles for all
  using (auth.uid() = id);

-- children: parent owns their children
create policy "children: parent access"
  on public.children for all
  using (auth.uid() = parent_id);

-- books: readable by anyone authenticated
create policy "books: authenticated read"
  on public.books for select
  using (auth.uid() is not null);

-- pages: readable by anyone authenticated
create policy "pages: authenticated read"
  on public.pages for select
  using (auth.uid() is not null);

-- user_libraries: owner access
create policy "user_libraries: owner access"
  on public.user_libraries for all
  using (auth.uid() = parent_id);

-- user_saved_pages: accessible if you own the child
create policy "user_saved_pages: parent access via child"
  on public.user_saved_pages for all
  using (
    exists (
      select 1 from public.children c
      where c.id = child_id
        and c.parent_id = auth.uid()
    )
  );

-- ─── Indexes ─────────────────────────────────────────────────
create index if not exists idx_children_parent_id on public.children(parent_id);
create index if not exists idx_pages_book_id on public.pages(book_id);
create index if not exists idx_user_libraries_parent_id on public.user_libraries(parent_id);
create index if not exists idx_user_saved_pages_child_id on public.user_saved_pages(child_id);
create index if not exists idx_user_saved_pages_page_id on public.user_saved_pages(page_id);

-- ─── Seed: placeholder book for development ──────────────────
insert into public.books (id, title, description, price_digital_cents, price_physical_cents, page_count)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Cockapoo''s Big Adventure',
  'Join our fluffy cockapoo friend on an exciting car trip across the countryside!',
  0,
  1999,
  1
)
on conflict do nothing;

insert into public.pages (book_id, page_number, outline_url, animatable_elements_url)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  1,
  '/assets/placeholder/outline.png',
  '/assets/placeholder/animatable_elements.json'
)
on conflict do nothing;
