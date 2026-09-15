// Registro central dos tipos de entidade que podem ser relacionados entre si
// (usado pelo seletor "Relacionar com...", pela timeline e pelo grafo de
// conexões). Adicionar um novo tipo aqui é o único passo para que ele apareça
// em todos os três lugares.
export const ENTITY_TYPES = {
  npc: { label: "NPC", icon: "🎭", listKey: "npcs", color: "#c39a3f" },
  milestone: { label: "Marco", icon: "📜", listKey: "milestones", color: "#8a2c2c" },
  item: { label: "Item", icon: "🎒", listKey: "items", color: "#4b8a72" },
  map: { label: "Local/Mapa", icon: "🗺️", listKey: "maps", color: "#4b6a8a" },
  player: { label: "Jogador", icon: "🧙", listKey: "players", color: "#8a5ea0" },
};

// Rota (dentro de HashRouter) da ficha de cada tipo, quando existe uma —
// usado pelo grafo de conexões pra abrir a entidade ao clicar no nó.
export const ENTITY_ROUTES = {
  npc: (id) => `/npcs/${id}`,
  item: (id) => `/itens/${id}`,
  map: (id) => `/mapas/${id}`,
  player: (id) => `/jogadores/${id}`,
};

export function nodeKey(tipo, id) {
  return `${tipo}__${id}`;
}

function listaDe(data, tipo) {
  const key = ENTITY_TYPES[tipo]?.listKey;
  return (key && data[key]) || [];
}

export function entityLabel(data, tipo, entId) {
  const found = listaDe(data, tipo).find((e) => e.id === entId);
  if (!found) return "(removido)";
  return found.nome || found.titulo || "Sem nome";
}

export function entityOptions(data, tipo) {
  return listaDe(data, tipo).map((e) => ({ id: e.id, label: e.nome || e.titulo || "Sem nome" }));
}

// Todos os vínculos que tocam a entidade (tipo, id), em qualquer ponta.
export function linksFor(links, tipo, entId) {
  return links.filter(
    (l) => (l.deTipo === tipo && l.deId === entId) || (l.paraTipo === tipo && l.paraId === entId)
  );
}

// Dado um vínculo e "de que lado estou olhando", retorna a outra ponta.
export function otherSide(link, tipo, entId) {
  if (link.deTipo === tipo && link.deId === entId) return { tipo: link.paraTipo, id: link.paraId };
  return { tipo: link.deTipo, id: link.deId };
}

export function sameLink(a, b) {
  return (
    (a.deTipo === b.deTipo && a.deId === b.deId && a.paraTipo === b.paraTipo && a.paraId === b.paraId) ||
    (a.deTipo === b.paraTipo && a.deId === b.paraId && a.paraTipo === b.deTipo && a.paraId === b.deId)
  );
}
