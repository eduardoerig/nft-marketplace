# Passo 08 — Login, cadastro e sessão

**Tempo alvo:** ~2h · **Desafio:** §3 Conta e sessão

## Objetivo
Autenticação completa contra o mock, com rotas protegidas e isolamento entre usuários.

## O que fazer
1. Handlers `/api/auth/*`: register (409 `EMAIL_TAKEN`, 422 com `fields`), login (401 credenciais inválidas),
   session (401 se token inválido/expirado), logout. Sessão expira (campo `expiresAt`; cenário para forçar no passo 15).
2. Telas Login e Cadastro fiéis ao Figma (desktop/mobile), `react-hook-form` + zod, erros ligados aos campos
   (`aria-invalid`, `aria-describedby`), erros da API exibidos no campo certo.
3. `features/auth/queries.ts`: `useSession()` (`['session']`), `useLogin`, `useRegister`, `useLogout`.
4. Proteção: `beforeLoad` das rotas privadas usa `queryClient.ensureQueryData(['session'])`;
   sem sessão → `redirect({ to: '/login', search: { redirect: location.href } })`. Após login volta ao `redirect`.
5. Evento `session-expired` (do axios): limpa dados privados, mostra toast e leva ao login mantendo o `redirect`.
6. Logout e troca de usuário: `queryClient.clear()` (e, no passo 12, desconectar o socket).
7. Header mostra usuário logado / botão Entrar.
8. Teste E2E: cadastro (incluindo conflito), login, logout, troca de usuário sem ver dados do anterior.

## Pronto quando
- [ ] Refresh mantém sessão; `/account/profile` deslogado redireciona e volta após login.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/08-auth-sessao.md
```
