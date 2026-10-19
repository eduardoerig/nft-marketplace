# Passo 09 — Perfil e carteiras

**Tempo alvo:** ~1h30 · **Desafio:** §3 Perfil/Carteiras, §5

## Objetivo
Edição de perfil, avatar, senha e carteiras com validação e persistência.

## O que fazer
1. Handlers `/api/profile*` e `/api/wallets*` (422 com `fields`; senha atual errada → 422 no campo).
2. Tela Perfil (`Desktop / Perfil do Colecionador` + versão mobile adaptada): dados, upload de avatar
   (arquivo → data URL guardada no mock, preview, limite de tamanho), formulário de troca de senha separado.
3. Tela Carteiras (`Desktop / Carteiras` + mobile adaptado): principal e secundária, cadastro e edição,
   validação de endereço (`0x` + 40 hex) e rede.
4. Após salvar: `invalidateQueries` + toast acessível; refresh mantém os dados.
5. Teste E2E: editar perfil, avatar, senha (com erro), carteiras (com erro de validação).

## Pronto quando
- [ ] Alterações persistem após refresh; erros aparecem no campo certo.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/09-perfil-carteiras.md
```
