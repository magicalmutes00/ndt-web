/**
 * SQL migrations, applied in order and recorded in `schema_migrations`.
 *
 * Keep this as plain data in TypeScript rather than .sql files so it needs no
 * filesystem layout assumptions at runtime (and survives being bundled).
 */

export interface Migration {
  id: string;
  statements: string[];
}

export const migrations: Migration[] = [
  {
    id: "001_init",
    statements: [
      `create table if not exists schema_migrations (
         id text primary key,
         applied_at timestamptz not null default now()
       )`,

      // Exactly two rows: key = 'published' | 'draft'.
      `create table if not exists content (
         key text primary key,
         doc jsonb not null,
         version integer not null default 1,
         updated_at timestamptz not null default now(),
         updated_by text
       )`,

      `create table if not exists revisions (
         id bigserial primary key,
         doc jsonb not null,
         version integer not null,
         label text,
         author text,
         created_at timestamptz not null default now()
       )`,

      `create index if not exists revisions_created_at_idx on revisions (created_at desc)`,

      `create table if not exists media (
         id uuid primary key,
         cloudinary_public_id text not null,
         url text not null,
         secure_url text not null,
         alt text not null default '',
         width integer,
         height integer,
         bytes integer,
         format text,
         folder text,
         created_at timestamptz not null default now(),
         created_by text
       )`,

      `create index if not exists media_created_at_idx on media (created_at desc)`,

      `create table if not exists users (
         id uuid primary key,
         email text not null unique,
         password_hash text not null,
         created_at timestamptz not null default now(),
         last_login_at timestamptz
       )`,

      `create table if not exists sessions (
         id uuid primary key,
         token_hash text not null unique,
         user_id uuid not null references users (id) on delete cascade,
         created_at timestamptz not null default now(),
         expires_at timestamptz not null,
         user_agent text,
         ip text
       )`,

      `create index if not exists sessions_expires_at_idx on sessions (expires_at)`,

      `create table if not exists login_attempts (
         id bigserial primary key,
         ip text not null,
         email text not null,
         success boolean not null,
         attempted_at timestamptz not null default now()
       )`,

      `create index if not exists login_attempts_lookup_idx
         on login_attempts (ip, email, attempted_at desc)`,
    ],
  },
  {
    /**
     * Identity moved to Neon Auth, which keeps users and sessions in its own
     * `neon_auth` schema. The local tables from 001 are dropped so there is no
     * half-used credential store lying around. `login_attempts` is kept: the
     * lockout is ours, and it is not an identity store.
     */
    id: "002_drop_local_identity",
    statements: [
      `drop table if exists sessions`,
      `drop table if exists users`,
    ],
  },
  {
    /**
     * Records which backend holds each object. `cloudinary_public_id` already
     * stores the provider's identifier, which for S3 is the object key.
     */
    id: "003_media_storage_provider",
    statements: [
      `alter table media add column if not exists storage_provider text not null default 'cloudinary'`,
      `create index if not exists media_provider_key_idx on media (storage_provider, cloudinary_public_id)`,
    ],
  },
];
