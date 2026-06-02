# Panini FIFA World Cup 2026

Primeira versão funcional de uma app mobile-first para gerir a caderneta Panini FIFA World Cup 2026.

## Funcionalidades

- Home com 48 países/secções preparados para a caderneta física.
- Página de país com cartas normais em falta, brilhantes/especiais em falta e progresso.
- Toque numa carta em falta para marcar como “já tenho”; toque numa carta já marcada para desfazer.
- Secção Coca-Cola x Panini com 12 stickers especiais C1 a C12.
- Estatísticas gerais: total em falta, brilhantes em falta, Coca-Cola em falta e percentagem completa.
- Persistência local no browser/telemóvel via `localStorage`.
- Exportar/importar JSON para backup.
- Estrutura da caderneta separada da lógica em `src/albumData.js`.
- Editor simples na Home para corrigir nomes e ordem dos 48 países sem mexer no código.

## Nota sobre dados oficiais

A ordem oficial da caderneta física Panini FIFA World Cup 2026 ainda fica marcada como editável nesta versão inicial (`officialPaniniOrderKnown: false`). Quando a ordem oficial estiver confirmada, atualiza `src/albumData.js` ou usa o editor da app e exporta o JSON.

## Desenvolvimento

```bash
npm install
npm test
npm run build
npm run dev -- --port 5174
```

## Persistência

A app não usa login, base de dados externa nem servidor. O progresso fica guardado no dispositivo/browser onde a app é aberta. Para mover entre telemóveis/browsers, usa Exportar JSON e Importar JSON.
