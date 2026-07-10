# BoraCopa

Bolão da Copa do Mundo 2026 — plataforma para criar grupos, registrar palpites e acompanhar o ranking em tempo real.

## Features

### Palpites
- Registro de placar para cada jogo antes do início da partida
- Palpites bloqueados automaticamente no horário de início (status `closed`)
- Fechamento automático via **pg_cron** (Supabase extension)
- Chip **AO VIVO** pulsante enquanto a partida está em andamento (janela de 115 min)
- Suporte a fase mata-mata: palpite de quem avança nos pênaltis em caso de empate

### Pontuação
- **+5 pts** — cravada (placar exato)
- **+3 pts** — acerto (vencedor ou empate correto)
- **0 pts** — erro
- Em empate no ranking, quem tem mais cravadas fica melhor posicionado

### Ranking
- Geral (todos os jogos da Copa)
- Fase de grupos (48 jogos)
- Mata-mata (oitavas em diante)
- Filtro por fase via seletor no topo

### Bolões (grupos)
- Criação de grupos com nome, taxa de entrada, chave PIX e descrição de prêmio
- Código de convite de 6 caracteres
- Link de convite compartilhável (`/convite/CODE`)
- Página pública de convite — funciona com e sem login
- Auto-entrada após login/cadastro via link de convite
- Gestão de pagamentos (ADM do bolão marca quem pagou)
- Dono pode excluir o bolão
- Membros podem sair do bolão

### Autenticação
- Cadastro e login por e-mail/senha (Supabase Auth)
- "Esqueci minha senha" com link de recuperação por e-mail
- Redirecionamento pós-login para a página de convite de origem (`?next=`)

### Painel ADM (SuperAdmin)
- Publicar resultado de jogos e distribuir pontos automaticamente
- Corrigir resultado de jogos já finalizados (recalcula toda a pontuação)
- Alterar status de partidas (open / closed / finished)
- Lista de usuários com filtro por nome/e-mail e ordenação (mais recentes / A-Z)
- Copiar link de convite de qualquer bolão
- Resetar senha de qualquer usuário

### UX / Interface
- Design responsivo — mobile-first com bottom nav, desktop com header fixo
- Seletor de bolão ativo (persiste entre sessões via localStorage)
- Logo clicável navega para a home
- Página de Regras com explicação da pontuação e funcionamento
- Tema com variáveis CSS customizadas (suporte a dark mode futuro)

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 + Lucide Icons |
| State | Zustand 5 (com persist) |
| Backend | Supabase (PostgreSQL + Auth + RLS + pg_cron) |
| Deploy | Vercel |

## Estrutura de pastas relevante

```
app/
  (app)/          # Páginas autenticadas (layout com header/nav)
    home/         # Feed de jogos do dia
    palpites/     # Todos os jogos com palpites
    ranking/      # Ranking geral e por fase
    boloes/       # Lista e detalhe de bolões
    regras/       # Página de regras e pontuação
    adm/          # Painel de administração (SuperAdmin)
    perfil/       # Perfil do usuário
  convite/[code]/ # Página pública de convite (sem auth)
  login/          # Login + esqueci minha senha
  register/       # Cadastro
  reset-password/ # Redefinição de senha (fluxo PKCE)

components/
  nav/            # Header (desktop) e BottomNav (mobile)
  match/          # MatchCard, Flag, ScoringNote
  ui/             # BolaoSwitcher, ProfileModal, Avatar, etc.

store/
  auth.ts         # Zustand: usuário autenticado
  bolao.ts        # Zustand: bolão ativo e lista do usuário

lib/
  supabase/       # Clients SSR (server + client)
  mock.ts         # Tipos compartilhados (Match interface)
```

## Regras de negócio (banco)

- `matches` — partidas com `status`: `upcoming | open | closed | finished`
- `predictions` — palpites por usuário/partida (`score_a`, `score_b`, `points`)
- `boloes` — grupos com `invite_code` único
- `bolao_members` — relação usuário ↔ bolão com campo `paid`
- `profiles` — dados públicos do usuário (`name`, `is_super_admin`)
- RPC `apply_match_result` — aplica resultado e distribui pontos
- RPC `recalculate_all_points` — recalcula toda a pontuação (usado na correção de resultados)
- pg_cron — fecha automaticamente partidas no horário de início

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=          # URL de produção (sem barra no final)
```

## Rodando localmente

```bash
npm install
npm run dev
```
