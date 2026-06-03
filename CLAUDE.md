# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

---

## ⚠️ Read this first — repository identity

This repository (`MemoriaViva`) currently contains **two distinct concerns**:

1. **Memória Viva · DAR+** — the app that is *actually implemented today*. A
   senior / elderly-care PWA (clock, cognitive games, health logging,
   medications, caregiver area). This is the live code in `index.html`.
2. **Alma Studio** — a *planned, not-yet-built* app (clinical pilates +
   physiotherapy studio). This file documents its intended architecture so it
   can be built later. **No Alma Studio code exists in the repo yet.**

When a task references **Alma Studio**, treat the spec in
[§ Alma Studio — target architecture](#alma-studio--target-architecture) as the
blueprint. When a task touches existing functionality, you are working on
**Memória Viva** — see [§ Current codebase](#current-codebase-memória-viva).

Do **not** delete or overwrite the Memória Viva `index.html` to make room for
Alma Studio unless explicitly told to. If a request is ambiguous about which app
it concerns, ask before making large or hard-to-reverse changes.

---

## Project conventions (apply to both apps)

These conventions are derived from the existing Memória Viva code and should be
reused for Alma Studio so the codebase stays consistent.

- **Language:** all user-facing text is **PT-PT** (European Portuguese). Code
  identifiers and comments are mixed PT/EN; comments are often PT.
- **Frontend:** single-file, vanilla **HTML/CSS/JS** — no build step, no
  framework, no bundler. The whole SPA lives in one `index.html` with an inline
  `<style>` block and inline `<script>`s. Mobile-first.
- **Supabase from the browser:** loaded via CDN
  (`https://unpkg.com/@supabase/supabase-js@2`). The **anon** key + project URL
  are hard-coded as `var SUPA_URL` / `var SUPA_KEY` near the top of the script.
  Security is enforced server-side by **Row Level Security**, never by hiding
  the anon key.
- **Never** put the Supabase **service-role / secret** key in `index.html` or
  any browser code. Service-role usage stays in the Node admin scripts and is
  read from `.env` (which is git-ignored).
- **Deploy:** static frontend on **Netlify** (`netlify.toml`: publish `.`, empty
  build command, SPA fallback redirect to `/index.html`). Admin scripts run
  separately with Node.
- **Confirm before destructive actions** (deletes) and surface **toast-style**
  feedback for user actions. Show loading states on API calls and friendly
  error messages.

---

## Current codebase (Memória Viva)

### File map

| Path | Purpose |
| --- | --- |
| `index.html` | The entire app: ~4.7k lines, inline CSS + JS, Supabase via CDN. |
| `index.html.html` | **Duplicate** of `index.html` (byte-identical). Likely an editor artifact — prefer consolidating to a single `index.html`. |
| `create-users.js` | Node/ESM admin script: bulk-creates Supabase Auth users from `utentes.csv` and upserts profiles into the `utentes` table. Uses the service-role key. |
| `set-default-pin.js` | Node/ESM admin script: upserts `default_caregiver_pin` into the `settings` table (service-role key). |
| `sql/create_settings.sql` | Creates the `settings(key, value)` table and seeds `default_caregiver_pin`. |
| `sql/policies_settings.sql` | Enables RLS + a public `SELECT` policy on `settings`. |
| `utentes.csv` | Input list (`name,email`) for `create-users.js`. |
| `utentes-criados.csv` | Generated output of created users (includes passwords — handle carefully). |
| `package.json` | ESM (`"type": "module"`); npm scripts `create-users`, `set-default-pin`. Deps: `@supabase/supabase-js`, `dotenv`. |
| `netlify.toml` | Netlify static deploy config + SPA redirect. |
| `.env.example` | Template for `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. |
| `logo-darmais.png.png` | DAR+ logo asset (note the doubled extension). |

### Architecture of `index.html`

- **Visual modes:** CSS classes `.manha` / `.tarde` / `.noite` swap a full set of
  CSS custom properties (`--bg`, `--pri`, `--tx`, …). Time-of-day theming.
- **Screen router:** a global `go(id)` / `goBack()` pair switches the active
  screen; `render()` (and many `renderX(el, …)` functions) build screen markup
  imperatively into a container element.
- **Supabase access:** `initSupabase()` creates the client; helpers wrap
  `_supa.auth.signInWithPassword`, `resetPasswordForEmail`, `updateUser`, and
  table calls like `_supa.from('utentes' | 'health_records' | 'medications' |
  'contacts' | 'settings').select/insert/upsert/update(...)`.
- **Offline sync queue:** `_syncQueue` holds pending write functions; they are
  flushed when `_isOnline`. Failed writes are re-queued (`unshift`) and retried.
- **Safe storage:** `ssGet/ssSet/ssDel` wrap `sessionStorage` with an in-memory
  fallback for contexts where storage throws.
- **Caregiver PIN:** read from `settings.default_caregiver_pin` (falls back to
  an `app_settings` table); set via `set-default-pin.js`.

### Admin script workflow

```bash
npm install
cp .env.example .env          # then fill SUPABASE_SERVICE_ROLE_KEY (sb_secret_...)
npm run create-users          # reads utentes.csv → creates Auth users + upserts profiles
npm run set-default-pin 5678  # writes settings.default_caregiver_pin
```

- Scripts default `SUPABASE_URL` to the project URL if unset.
- They create the client with `auth: { persistSession: false }`.
- `create-users.js` parses the CSV (skips a `name,email` header), generates
  random passwords, sets `email_confirm: true`, and writes `utentes-criados.csv`.

### There is no test suite, linter, or CI

No `test`/`lint` scripts exist. Verify changes by opening `index.html` in a
browser (or `npx serve .`) and exercising the affected screens. If you add
tooling, document it here.

---

## Alma Studio — target architecture

> Status: **specification only — not yet implemented.** Build it following the
> [project conventions](#project-conventions-apply-to-both-apps) above (vanilla
> single-page `index.html`, Supabase via CDN + RLS, Netlify static deploy).
> The Express backend below is optional and only needed for server-side work
> (e.g. Storage signing, admin bulk ops) — most CRUD can go straight to
> Supabase from the browser, exactly as Memória Viva does.

### Stack

- **Frontend:** HTML/CSS/JS vanilla, single-page, mobile-first.
- **Backend (optional):** Node.js + Express — only for operations that must not
  run in the browser. Deploy to Railway or Render.
- **Database:** Supabase (PostgreSQL).
- **Auth:** Supabase Auth — email + password.
- **Storage:** Supabase Storage (evaluation photos).
- **Deploy:** Netlify (frontend) + Railway/Render (backend, if used).

### Design system

| Token | Value |
| --- | --- |
| Background | `#0a0c0f` (dark, subtle grid) |
| Primary | `#00B4D8` (cyan) |
| Secondary | `#0077B6` |
| Fonts | Montserrat (body) + Bebas Neue (display) |
| Cards | Glassmorphism — `rgba(255,255,255,…)` + `backdrop-filter: blur()` |
| Nav | Bottom navigation, 5 tabs, elevated centre button |
| Reference look | FitManager.app style |

- **Branding:** logo `alma-logo.png`; app name "Alma Studio"; tagline
  "alinhar · cuidar · reabilitar"; `theme_color: #00B4D8`.

### Roles

- **ADMIN** (physio / instructor): full management.
- **ALUNO** (student): personal read-only-ish view of their own data.
- After login, redirect by role: ADMIN → admin panel, ALUNO → home.

### Bottom navigation

- **Aluno:** Home · **Treinos** (centre, elevated) · Nutri. · Avaliação · Quest.
- **Admin:** Início · **Alunos** (centre) · Treinos · Aval. · Sessões.

### Feature scope

**Admin:** student CRUD + deactivate (name, email, password, photo); workout
plans (per-student, rest time, exercises with sets/reps/notes, multiple plans
A/B…); sessions/agenda (type, date, start/end, status agendada/realizada/
cancelada, weekly view); physical evaluations (BMI, weight, body fat/lean mass,
body measurements, photos front/back/profile in Storage, weight-evolution
chart); questionnaire builder (open / multiple-choice / 1–5 scale, assign to
student, view answers); meal plans (macro targets, meals → foods).

**Aluno:** dashboard (greeting, summary cards, weekly calendar with activity
dots, day's sessions); assigned workout plans + "Começar Treino"/"Treino
Livre"; **workout execution** (sticky MM:SS timer, per-set reps/load inputs, ✓
to complete a set, RPE 1–10, auto rest-timer overlay, "Finalizar Treino" → saves
to history); workout history; physical evaluation (4-col grid with deltas
coloured green/red/yellow, weight line chart, before/after photos); meal plan
(daily macros + structured meals); questionnaires (list with status, inline
answer form, submit).

### Database schema (Supabase / PostgreSQL)

```
users(id, nome, email, role, foto_url, ativo, created_at)
treinos(id, nome, aluno_id, admin_id, rest_segundos, created_at)
exercicios(id, treino_id, nome, series, repeticoes, obs, ordem)
sessoes(id, aluno_id, admin_id, tipo, data, hora_inicio, hora_fim, status)
avaliacoes(id, aluno_id, data, peso, imc, massa_gorda, massa_magra,
           bicep_d, bicep_e, peito, abdomen, cintura, quadril,
           coxa_d, coxa_e, gemeo_d, gemeo_e)
fotos_avaliacao(id, avaliacao_id, tipo, url, created_at)
historico_treinos(id, aluno_id, treino_id, data, duracao_segundos)
historico_series(id, historico_treino_id, exercicio_nome, set_num,
                 repeticoes, carga, rpe)
questionarios(id, titulo, admin_id, created_at)
questionario_alunos(id, questionario_id, aluno_id, respondido)
perguntas(id, questionario_id, tipo, texto, opcoes_json, ordem)
respostas(id, questionario_id, aluno_id, data, created_at)
respostas_detalhe(id, resposta_id, pergunta_id, valor)
nutricao_planos(id, nome, aluno_id, admin_id, kcal, proteina,
                carboidratos, gordura)
refeicoes(id, plano_id, nome, ordem)
alimentos(id, refeicao_id, nome, quantidade, ordem)
```

- `sessoes.tipo` ∈ {Pilates Clínico, Reformer, Fisioterapia, Acompanhamento,
  Avaliação, Treino Personalizado}; `status` ∈ {agendada, realizada, cancelada}.
- `perguntas.tipo` ∈ {aberta, multipla, escala}; multiple-choice options live in
  `opcoes_json`.
- **RLS (required):** students see only their own rows (`aluno_id = auth.uid()`
  pattern); admins see all rows. Mirror the SQL-in-`sql/` convention from
  Memória Viva: keep schema + policies as committed `.sql` files.

### Auth & PWA

- Login: email + password; "Lembrar dados" (persistent session); "Esqueceu a
  password?" → `resetPasswordForEmail`; role-based redirect.
- PWA: `manifest.json` (name, icons, `theme_color: #00B4D8`), a service worker
  for basic offline caching, and an "Instalar APP" button on login when the
  `beforeinstallprompt` event is available.

---

## Working agreements for AI assistants

- **Git:** develop on the designated feature branch; commit with clear messages;
  push with `git push -u origin <branch>`. Do **not** open a pull request unless
  explicitly asked.
- **Secrets:** never commit `.env` or real keys. `utentes-criados.csv` contains
  generated passwords — do not expose it externally.
- **Scope discipline:** Memória Viva and Alma Studio are separate apps in this
  repo. Confirm which one a task targets before broad changes, and never replace
  one with the other without explicit instruction.
- **No build/test tooling exists** — verify in the browser and state honestly
  what you did and didn't verify.
- **GitHub:** the active repo scope is `darmaisgeral-maker/memoriaviva`; use the
  `mcp__github__*` tools for any GitHub interaction (no `gh` CLI available).
