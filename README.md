# Guia da Campanha — D&D 5E

Ferramenta web para mestres de D&D 5ª Edição organizarem suas campanhas: fichas completas de jogadores, NPCs em formato de stat block, um gerador de NPCs aleatórios, marcos de história e um rastreador de combate com bestiário integrado (SRD 5.1).

Todos os dados ficam salvos no navegador (`localStorage`). Use o **Backup da Campanha** no Painel para exportar/importar seus dados entre computadores.

## Rodando localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
```

Gera a pasta `dist/`, pronta para qualquer hospedagem estática (GitHub Pages, Netlify, Vercel, etc.).

## Aba Roteiro e salvamento na nuvem

- **Roteiro:** o conteúdo vem de `src/data/roteiro.json`, gerado a partir do roteiro em Markdown da campanha. Para atualizar depois de editar o roteiro: `node scripts/build-roteiro.mjs "<caminho>/Roteiro_Intensivo_Sessoes_5_e_6.md"`, depois publicar de novo. Fica embutido no site, então abre em qualquer computador sem importar nada.
- **Nuvem:** jogadores, NPCs, marcos, itens, mapas, moldes de combate, vínculos e o estado do Roteiro (capítulos jogados e notas) são salvos num projeto Supabase. Ler é aberto; gravar pede um PIN, digitado uma vez por aparelho. Para ativar, rode `supabase/guia-schema.sql` uma vez no SQL Editor do Supabase (trocando o PIN no fim do arquivo). Cartas de Tarot continuam só no navegador.
- **Testar sem tocar no banco:** `node ../mock-nuvem.js` (simula a nuvem com PIN 1234) e, no console do navegador, `localStorage.setItem('dnd.nuvemUrl','http://localhost:5191')`.
- No Windows, caminhos com `&` quebram `npx`: use `node node_modules/vite/bin/vite.js build`.
