# Passo 03 — Rotas e layout

**Tempo alvo:** ~45min · **Desafio:** §3, §4 (rotas, 404, acesso direto)

## Objetivo
Todas as rotas existindo (vazias) com layout fiel: header, footer e menu mobile.

## O que fazer
1. `@tanstack/react-router` + `@tanstack/router-plugin` (rotas por arquivo em `src/routes/`).
2. Rotas:
   | Rota | Tela | Privada |
   |---|---|---|
   | `/` | Início | não |
   | `/nfts/$nftId` | Detalhe | não |
   | `/cart` | Carrinho | não |
   | `/checkout` | Pagamento | sim |
   | `/orders/$orderId` | Confirmação | sim |
   | `/login` | Login (`?redirect=`) | não |
   | `/register` | Cadastro | não |
   | `/account/profile` | Perfil | sim |
   | `/account/wallets` | Carteiras | sim |
   Privadas: deixar um `beforeLoad` placeholder (a proteção real vem no passo 08).
3. `__root.tsx`: Header + `<Outlet/>` + Footer; `notFoundComponent` com página 404 no estilo do Figma.
4. Header/Footer fiéis ao Figma (desktop e mobile). Menu mobile com `Sheet` do shadcn (foco preso, Esc fecha).
   Links fora do escopo (editorial, suporte etc.): `aria-disabled` + tooltip "Em breve" — nunca simular sucesso.
5. Skip link "Pular para o conteúdo" e `<main id="conteudo">`.

## Pronto quando
- [ ] Todas as URLs abrem; URL inexistente mostra 404.
- [ ] Header/Footer parecidos com `design/screens/` em 1440 e 390.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/03-rotas-layout.md
```
