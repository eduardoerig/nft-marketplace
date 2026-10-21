# Passo 10 — Favoritos (atualização otimista)

**Tempo alvo:** ~45min · **Desafio:** §3 Favoritos, §4 (otimista + rollback)

## O que fazer
1. Handlers `/api/favorites*` (exigem sessão).
2. `useToggleFavorite`: `onMutate` atualiza o cache `['favorites', userId]` na hora, `onError` faz rollback
   + toast "Não foi possível favoritar", `onSettled` invalida.
3. Botão de coração no card e no detalhe com `aria-pressed` e rótulo ("Adicionar aos favoritos").
   Deslogado → vai ao login com `redirect`.
4. Um cenário de mock `favorites-fail` (POST/DELETE retornam 500) para demonstrar o rollback.
5. Teste E2E: favoritar, persistir após refresh, falha com rollback.

## Pronto quando
- [ ] Com `?scenario=favorites-fail` o coração volta ao estado anterior e aparece o aviso.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/10-favoritos.md
```
