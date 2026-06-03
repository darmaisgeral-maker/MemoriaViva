# CLAUDE.md — Alma Studio

Guidance for AI assistants (Claude Code and others) working on **Alma Studio**.

Alma Studio is a standalone PWA for a **clinical pilates + physiotherapy
studio**. It is an independent project with its own stack, design system, and
data model — it is **not** related to any other app.

> **Status:** specification / early scaffold. This document is the build
> blueprint; implement features to match it. Keep this file updated as the
> codebase grows.

---

## Product

- **Name:** Alma Studio
- **Tagline:** "alinhar · cuidar · reabilitar"
- **Domain:** clinical pilates, reformer, physiotherapy, personal training,
  physical evaluations, nutrition plans, and anamnesis questionnaires.
- **Roles:**
  - **ADMIN** (physiotherapist / instructor) — full management.
  - **ALUNO** (student) — personal view of their own data only.
- **Language:** all user-facing text is **PT-PT** (European Portuguese).

---

## Stack

- **Frontend:** HTML/CSS/JS **vanilla**, single-page app, mobile-first. No build
  step / framework unless introduced later (document it here if so).
- **Backend (optional):** Node.js + Express — only for work that must not run in
  the browser (Storage signing, admin bulk ops). Most CRUD goes directly to
  Supabase from the client. Deploy to Railway or Render.
- **Database:** Supabase (PostgreSQL).
- **Auth:** Supabase Auth — email + password.
- **Storage:** Supabase Storage (evaluation photos).
- **Deploy:** Netlify (frontend) + Railway/Render (backend, if used).

### Supabase access rules

- The browser uses the **anon** key + project URL only. Security is enforced by
  **Row Level Security**, never by hiding the anon key.
- **Never** put the Supabase **service-role / secret** key in frontend code.
  Service-role usage lives in Node admin scripts and reads from `.env` (which
  must be git-ignored).

---

## Design system

| Token | Value |
| --- | --- |
| Background | `#0a0c0f` (dark, subtle grid) |
| Primary | `#00B4D8` (cyan) |
| Secondary | `#0077B6` |
| Fonts | Montserrat (body) + Bebas Neue (display) |
| Cards | Glassmorphism — `rgba(255,255,255,…)` + `backdrop-filter: blur()` |
| Nav | Bottom navigation, 5 tabs, elevated centre button |
| Theme color | `#00B4D8` |
| Reference look | FitManager.app style |

- **Logo:** `alma-logo.png` (to be added to the project).

### Bottom navigation

- **Aluno:** Home · **Treinos** (centre, elevated) · Nutri. · Avaliação · Quest.
- **Admin:** Início · **Alunos** (centre) · Treinos · Aval. · Sessões.

---

## Feature scope

### Admin

- **Alunos:** create / edit / deactivate (nome, email, password, foto); view
  full profile.
- **Planos de treino:** per-student plans (nome, aluno, rest time); exercises
  (nome, séries, repetições, obs); multiple plans per student (Treino A/B…).
- **Sessões / Agenda:** create sessions (aluno, tipo, data, hora início/fim);
  status agendada (green) / realizada (grey) / cancelada (red); weekly view with
  navigation.
- **Avaliações físicas:** record IMC, peso, massa gorda/magra + body measurements
  (bícep D/E, peito, abdómen, cintura, quadril, coxa D/E, gémeo D/E); upload
  photos (frente, costas, perfil) to Supabase Storage; history + weight-evolution
  chart.
- **Questionários (anamnese):** builder with 3 question types — aberta
  (textarea), múltipla escolha (radio), escala 1–5; assign to a student; view
  submitted answers.
- **Planos alimentares:** plan (nome, aluno, macro targets kcal/proteína/carbos/
  gordura); meals → foods (nome + quantidade); structured by meal.

### Aluno

- **Home / Dashboard:** greeting; summary cards (treinos realizados, último
  peso); weekly calendar (Seg–Dom) with activity dots; selected-day sessions;
  prev / today / next week navigation.
- **Planos de treino:** list assigned plans; each shows exercises with
  séries:reps + obs; "Começar Treino" and "Treino Livre" buttons.
- **Execução de treino:** sticky MM:SS workout timer; per exercise show name +
  admin notes; per set, inputs for repetições + carga/peso and a ✓ to complete;
  RPE 1–10; automatic rest-timer overlay after marking a set; "Finalizar Treino"
  saves to history.
- **Histórico de treinos:** chronological list (nome, data, duração, nº de
  exercícios).
- **Avaliação física:** 4-column grid of all values + delta vs previous
  evaluation, coloured green (better) / red (worse) / yellow (equal); weight line
  chart; before/after photos labelled Frente / Costas / Perfil.
- **Plano alimentar:** daily macros + structured meals with foods/quantities.
- **Questionários:** list with status (por responder / respondido); inline answer
  form; submit saves to server.

---

## Database schema (Supabase / PostgreSQL)

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

### Enums & conventions

- `users.role` ∈ {ADMIN, ALUNO}; `users.ativo` toggles soft-deactivation.
- `sessoes.tipo` ∈ {Pilates Clínico, Reformer, Fisioterapia, Acompanhamento,
  Avaliação, Treino Personalizado}; `sessoes.status` ∈ {agendada, realizada,
  cancelada}.
- `fotos_avaliacao.tipo` ∈ {frente, costas, perfil}.
- `perguntas.tipo` ∈ {aberta, multipla, escala}; multiple-choice options live in
  `opcoes_json`.
- Keep schema + policies as committed `.sql` files (e.g. under `sql/`).

### Row Level Security (required)

- **Aluno** sees only their own rows — `aluno_id = auth.uid()` (and equivalent
  joins for child tables like `exercicios`, `historico_series`,
  `respostas_detalhe`, `refeicoes`, `alimentos`).
- **Admin** sees all rows.
- Enable RLS on every table; do not rely on the client to scope data.

---

## Auth & PWA

- **Login:** email + password; "Lembrar dados de login" (persistent session);
  "Esqueceu a password?" → `resetPasswordForEmail`; redirect by role after login
  (ADMIN → painel, ALUNO → home).
- **PWA:** `manifest.json` (name, icons, `theme_color: #00B4D8`); a service
  worker for basic offline caching; an "Instalar APP" button on the login screen
  when the `beforeinstallprompt` event is available.

---

## UX conventions

- All user-facing text in **PT-PT**.
- **Confirm before deleting** any record.
- **Toast** notifications for action feedback.
- **Loading states** on every API call.
- Friendly, human error messages — never raw errors to the user.

---

## Working agreements for AI assistants

- **Git:** develop on the designated feature branch; commit with clear messages;
  push with `git push -u origin <branch>`. Do **not** open a pull request unless
  explicitly asked.
- **Secrets:** never commit `.env` or real keys; keep the service-role key out of
  the browser entirely.
- **No build/test tooling exists yet** — verify changes in the browser (e.g.
  `npx serve .`) and state honestly what you did and did not verify. If you add
  tooling (tests, linter, CI), document it in this file.
- **Keep this file current:** update the schema, feature scope, and conventions
  here whenever they change.
