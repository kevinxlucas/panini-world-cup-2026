# Panini FIFA World Cup 2026

Primeira versão funcional de uma app mobile-first para gerir a caderneta Panini FIFA World Cup 2026.

## Funcionalidades

- Home com a secção `FWC` antes das 48 seleções, na ordem da checklist Panini FIFA World Cup 2026.
- Nomes das seleções carregados com a grafia da checklist: por exemplo `Czechia`, `Türkiye`, `Curaçao`, `Congo DR` e `USA`.
- Página de secção com douradas/especiais em primeiro lugar, cartas normais em falta e progresso.
- Toque numa carta em falta para marcar como “já tenho”; toque numa carta já marcada para desfazer.
- Secção Coca-Cola x Panini com 12 stickers especiais C1 a C12.
- Estatísticas gerais: total em falta, douradas/especiais em falta, Coca-Cola em falta e percentagem completa.
- Persistência local no browser/telemóvel via `localStorage`.
- Exportar/importar JSON para backup.
- Estrutura da caderneta separada da lógica em `src/albumData.js`.
- Editor simples na Home para corrigir nomes e ordem localmente sem mexer no código.

## Nota sobre dados oficiais

A estrutura base está marcada como confirmada (`officialPaniniOrderKnown: true`) e inclui 980 stickers de checklist base: `00` + `FWC1`-`FWC19`, mais 48 seleções com 20 stickers cada. A ordem e a grafia dos países foram cruzadas entre ChecklistInsider e Diamond Cards Online; os detalhes ficam registados em `sourceMetadata` dentro de `src/albumData.js`.

## Desenvolvimento

```bash
npm install
npm test
npm run build
npm run dev -- --port 5174
```

## Persistência

A app não usa login, base de dados externa nem servidor. O progresso fica guardado no dispositivo/browser onde a app é aberta. Para mover entre telemóveis/browsers, usa Exportar JSON e Importar JSON.
