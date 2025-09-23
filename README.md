# Universidade HS — Do Zero (Catálogo + Dashboard + Google Login)

Pronto para Netlify com:
- **Login Google** via Netlify Identity;
- **Catálogo automático** (JSON local ou tabela `videos` no Supabase);
- **Tracking** (pings de 10s) e **Dashboard** com tempo assistido;
- **Functions** (`/.netlify/functions/*`) empacotadas com esbuild.

## Deploy (Git ou CLI)
- **Git (recomendado)**: linke o repositório no Netlify. O `netlify.toml` já define `command = npm install`.
- **CLI**:
  ```bash
  npm i -g netlify-cli
  netlify init   # link ao site
  netlify deploy --build --prod
  ```

## Identity (Google)
1. Site settings → **Identity → Enable Identity**.
2. **External providers → Google → Enable**.
3. Pronto: botão “Entrar com Google” na interface.

## Variáveis de ambiente (Netlify)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## SQL (Supabase)
```sql
create extension if not exists pgcrypto;

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text unique not null,
  title text not null
);

create table if not exists video_events (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  user_email text,
  video_id text not null,
  seconds int not null check (seconds >= 0),
  ts timestamptz default now()
);
```

## Catálogo via DB (opcional)
- Troque em `config.js`: `window.CATALOG_MODE = 'supabase'`.
- Rode `/.netlify/functions/seed_videos` (uma vez) para popular `videos` com os 11 ids.

## Rotas
- `/` → catálogo (lista + player embutido; tracking ativo quando PLAYING)
- `/dashboard.html` → agregados por utilizador/vídeo (tempo total e último acesso)
- `/.netlify/functions/track` → gravação de eventos
- `/.netlify/functions/dashboard` → dados agregados
- `/.netlify/functions/catalog` → catálogo vindo do Supabase
- `/.netlify/functions/seed_videos` → seed (opcional)
