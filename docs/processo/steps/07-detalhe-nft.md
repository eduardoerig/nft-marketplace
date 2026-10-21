# Passo 07 — Detalhe do NFT

**Tempo alvo:** ~1h30 · **Desafio:** §3 Detalhe

## Objetivo
Tela de detalhe fiel ao Figma, com edições e quantidade.

## O que fazer
1. Layout de `Desktop / Detalhes do NFT` e `Mobile / Detalhes do NFT`.
2. `useNft(id)`; galeria acessível (miniaturas como botões, `alt` descritivo, setas do teclado).
3. Seleção de edição (radio group); edição com `available = 0` desabilitada com texto "Esgotada" (não só cor).
4. Quantidade (stepper) limitada a `min(available, maxPerOrder)`.
5. Botões "Favoritar" e "Adicionar ao carrinho" já no layout (lógica nos passos 10 e 11; até lá desabilitados com dica).
6. NFT inexistente → tela "NFT não encontrado" com link para o Início (404 do handler).
7. Skeleton do detalhe com mesmas dimensões.
8. Teste E2E: acesso direto à URL e ID inexistente.

## Pronto quando
- [ ] `/nfts/<id-valido>` em acesso direto funciona; `/nfts/xyz` mostra "não encontrado".
- [ ] Limite de quantidade respeitado.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/07-detalhe-nft.md
```
