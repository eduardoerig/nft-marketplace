# Passo 15 — Cenários de rede e falhas

**Tempo alvo:** ~1h30 · **Desafio:** §6 (cenários determinísticos)

## O que fazer
1. Completar `src/mocks/scenarios.ts` — uma tabela simples, cada cenário com nome e descrição:
   `default`, `empty`, `slow` (2s), `variable-latency` (determinística por seed), `out-of-order`,
   `offline` (`HttpResponse.error()`), `server-error` (500), `unauthorized`, `session-expired`,
   `register-conflict`, `favorites-fail`, `price-change-checkout`, `sold-out-checkout`,
   `order-timeout`, `payment-rejected`, `wallet-reject`.
2. Um helper `applyScenario(request)` usado no início de cada handler (latência/erro) — sem lógica espalhada.
3. Painel de dev discreto (botão fixo, só com mocks ligados): escolher cenário, resetar dados, disparar `nft.updated`
   e desconectar socket. Usa só os endpoints `/api/__mock/*`.
4. UI: todo erro tem mensagem clara e "Tentar novamente"; skeletons aparecem no `slow`.
5. Testes E2E: skeleton no `slow`, erro + retry no `server-error`, `offline`, `empty`.

## Pronto quando
- [ ] Cada cenário reproduz o mesmo resultado sempre (determinístico).

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/15-cenarios-rede.md
```
