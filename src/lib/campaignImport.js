// Importa um "pacote de conteúdo de campanha" (NPCs, Itens, Marcos e as
// Relações entre eles) SEM apagar nada que já existe — ao contrário do
// Backup completo (que substitui tudo), isso só adiciona.
//
// Formato esperado: { npcs: [{nome, papel, descricao, notasMestre}], items:
// [{nome, tipo, raridade, descricao}], milestones: [{titulo, tipo, sessao,
// descricao}], links: [{de: {tipo, nome}, para: {tipo, nome}, rotulo}] }.
// Links referenciam as outras entradas pelo nome/título (e jogadores
// existentes, tipo "player") — são resolvidos para ids reais durante a
// importação; um link cujos dois lados não forem encontrados é descartado.
export function importCampaignContent(data, api) {
  const idMap = new Map();
  for (const p of api.players) idMap.set(`player:${p.nome}`, p.id);

  const npcsCriados = (data.npcs || []).map((n) => {
    const criado = api.addNpc({
      nome: n.nome || "NPC sem nome",
      papel: n.papel || "",
      descricao: n.descricao || "",
      notasMestre: n.notasMestre || "",
      importante: true,
    });
    idMap.set(`npc:${n.nome}`, criado.id);
    return criado;
  });

  const itensCriados = (data.items || []).map((it) => {
    const criado = api.addItem({
      nome: it.nome || "Item sem nome",
      tipo: it.tipo || "Item Maravilhoso",
      raridade: it.raridade || "",
      descricao: it.descricao || "",
    });
    idMap.set(`item:${it.nome}`, criado.id);
    return criado;
  });

  const marcosCriados = (data.milestones || []).map((m) => {
    const criado = api.addMilestone({
      titulo: m.titulo || "Marco sem título",
      tipo: m.tipo || "Marco",
      sessao: m.sessao || "",
      descricao: m.descricao || "",
    });
    idMap.set(`milestone:${m.titulo}`, criado.id);
    return criado;
  });

  let linksAdicionados = 0;
  let linksIgnorados = 0;
  for (const l of data.links || []) {
    const deId = idMap.get(`${l.de?.tipo}:${l.de?.nome}`);
    const paraId = idMap.get(`${l.para?.tipo}:${l.para?.nome}`);
    if (!deId || !paraId) {
      linksIgnorados++;
      continue;
    }
    api.addLink({ deTipo: l.de.tipo, deId, paraTipo: l.para.tipo, paraId, rotulo: l.rotulo || "" });
    linksAdicionados++;
  }

  return {
    npcs: npcsCriados.length,
    items: itensCriados.length,
    milestones: marcosCriados.length,
    linksAdicionados,
    linksIgnorados,
  };
}
