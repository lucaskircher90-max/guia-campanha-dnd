// Constantes e helpers de regras de D&D 5ª Edição

export const ABILITIES = [
  { key: "for", label: "Força" },
  { key: "des", label: "Destreza" },
  { key: "con", label: "Constituição" },
  { key: "int", label: "Inteligência" },
  { key: "sab", label: "Sabedoria" },
  { key: "car", label: "Carisma" },
];

export const SKILLS = [
  { key: "acrobacia", label: "Acrobacia", ability: "des" },
  { key: "arcanismo", label: "Arcanismo", ability: "int" },
  { key: "atletismo", label: "Atletismo", ability: "for" },
  { key: "atuacao", label: "Atuação", ability: "car" },
  { key: "blefar", label: "Blefar", ability: "car" },
  { key: "furtividade", label: "Furtividade", ability: "des" },
  { key: "historia", label: "História", ability: "int" },
  { key: "intimidacao", label: "Intimidação", ability: "car" },
  { key: "intuicao", label: "Intuição", ability: "sab" },
  { key: "investigacao", label: "Investigação", ability: "int" },
  { key: "lidarAnimais", label: "Lidar com Animais", ability: "sab" },
  { key: "medicina", label: "Medicina", ability: "sab" },
  { key: "natureza", label: "Natureza", ability: "int" },
  { key: "percepcao", label: "Percepção", ability: "sab" },
  { key: "persuasao", label: "Persuasão", ability: "car" },
  { key: "prestidigitacao", label: "Prestidigitação", ability: "des" },
  { key: "religiao", label: "Religião", ability: "int" },
  { key: "sobrevivencia", label: "Sobrevivência", ability: "sab" },
];

export function abilityMod(score) {
  const s = Number(score);
  if (Number.isNaN(s)) return 0;
  return Math.floor((s - 10) / 2);
}

export function fmtMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function proficiencyBonusForLevel(level) {
  const lvl = Number(level) || 1;
  return Math.ceil(lvl / 4) + 1;
}

// Desafio -> Bônus de Proficiência (para NPCs/monstros) e XP aproximado
export const CR_TABLE = [
  { cr: "0", pb: 2, xp: 10 },
  { cr: "1/8", pb: 2, xp: 25 },
  { cr: "1/4", pb: 2, xp: 50 },
  { cr: "1/2", pb: 2, xp: 100 },
  { cr: "1", pb: 2, xp: 200 },
  { cr: "2", pb: 2, xp: 450 },
  { cr: "3", pb: 2, xp: 700 },
  { cr: "4", pb: 2, xp: 1100 },
  { cr: "5", pb: 3, xp: 1800 },
  { cr: "6", pb: 3, xp: 2300 },
  { cr: "7", pb: 3, xp: 2900 },
  { cr: "8", pb: 3, xp: 3900 },
  { cr: "9", pb: 4, xp: 5000 },
  { cr: "10", pb: 4, xp: 5900 },
  { cr: "11", pb: 4, xp: 7200 },
  { cr: "12", pb: 4, xp: 8400 },
  { cr: "13", pb: 5, xp: 10000 },
  { cr: "14", pb: 5, xp: 11500 },
  { cr: "15", pb: 5, xp: 13000 },
  { cr: "16", pb: 5, xp: 15000 },
  { cr: "17", pb: 6, xp: 18000 },
  { cr: "18", pb: 6, xp: 20000 },
  { cr: "19", pb: 6, xp: 22000 },
  { cr: "20", pb: 6, xp: 25000 },
  { cr: "21", pb: 7, xp: 33000 },
  { cr: "22", pb: 7, xp: 41000 },
  { cr: "23", pb: 7, xp: 50000 },
  { cr: "24", pb: 7, xp: 62000 },
  { cr: "25", pb: 8, xp: 75000 },
  { cr: "30", pb: 9, xp: 155000 },
];

export const CONDITIONS = [
  "Agarrado",
  "Amedrontado",
  "Atordoado",
  "Caído",
  "Cego",
  "Confuso",
  "Enfeitiçado",
  "Envenenado",
  "Exaustão",
  "Impedido",
  "Incapacitado",
  "Inconsciente",
  "Invisível",
  "Paralisado",
  "Petrificado",
  "Surdo",
];

export const DAMAGE_TYPES = [
  "Ácido", "Contundente", "Cortante", "Elétrico", "Fogo", "Frio",
  "Força", "Necrótico", "Perfurante", "Psíquico", "Radiante", "Trovejante",
];

export function emptyAbilities(base = 10) {
  return { for: base, des: base, con: base, int: base, sab: base, car: base };
}

export const ITEM_RARITIES = ["Comum", "Incomum", "Raro", "Muito Raro", "Lendário", "Artefato"];

export const ITEM_TYPES = [
  "Arma", "Armadura", "Escudo", "Item Maravilhoso", "Poção", "Pergaminho",
  "Anel", "Bastão", "Cajado", "Varinha", "Equipamento de Aventura", "Ferramenta", "Outro",
];

// Tabela oficial do DMG (5ª Ed.) — Limiares de XP por Nível de Personagem
// Índice 0 = nível 1 ... índice 19 = nível 20
export const XP_THRESHOLDS = [
  { facil: 25, medio: 50, dificil: 75, mortal: 100 },
  { facil: 50, medio: 100, dificil: 150, mortal: 200 },
  { facil: 75, medio: 150, dificil: 225, mortal: 400 },
  { facil: 125, medio: 250, dificil: 375, mortal: 500 },
  { facil: 250, medio: 500, dificil: 750, mortal: 1100 },
  { facil: 300, medio: 600, dificil: 900, mortal: 1400 },
  { facil: 350, medio: 750, dificil: 1100, mortal: 1700 },
  { facil: 450, medio: 900, dificil: 1400, mortal: 2100 },
  { facil: 550, medio: 1100, dificil: 1600, mortal: 2400 },
  { facil: 600, medio: 1200, dificil: 1900, mortal: 2800 },
  { facil: 800, medio: 1600, dificil: 2400, mortal: 3600 },
  { facil: 1000, medio: 2000, dificil: 3000, mortal: 4500 },
  { facil: 1100, medio: 2200, dificil: 3400, mortal: 5100 },
  { facil: 1250, medio: 2500, dificil: 3800, mortal: 5700 },
  { facil: 1400, medio: 2800, dificil: 4300, mortal: 6400 },
  { facil: 1600, medio: 3200, dificil: 4800, mortal: 7200 },
  { facil: 2000, medio: 3900, dificil: 5900, mortal: 8800 },
  { facil: 2100, medio: 4200, dificil: 6300, mortal: 9500 },
  { facil: 2400, medio: 4900, dificil: 7300, mortal: 10900 },
  { facil: 2800, medio: 5700, dificil: 8500, mortal: 12700 },
];

// Multiplicador de XP do encontro pela quantidade de inimigos (DMG, pg. 82)
const ENCOUNTER_MULTIPLIERS = [1, 1.5, 2, 2.5, 3, 4];

function multiplierIndexForCount(count) {
  if (count <= 1) return 0;
  if (count === 2) return 1;
  if (count <= 6) return 2;
  if (count <= 10) return 3;
  if (count <= 14) return 4;
  return 5;
}

// linhas: [{ nivel, quantidade }]
export function partyXpThresholds(linhas) {
  const totais = { facil: 0, medio: 0, dificil: 0, mortal: 0 };
  let totalPersonagens = 0;
  for (const { nivel, quantidade } of linhas) {
    const lvl = Math.min(20, Math.max(1, Number(nivel) || 1));
    const qtd = Math.max(0, Number(quantidade) || 0);
    const t = XP_THRESHOLDS[lvl - 1];
    totais.facil += t.facil * qtd;
    totais.medio += t.medio * qtd;
    totais.dificil += t.dificil * qtd;
    totais.mortal += t.mortal * qtd;
    totalPersonagens += qtd;
  }
  return { totais, totalPersonagens };
}

// linhas: [{ xp, quantidade }]
export function calcularDificuldadeEncontro(personagens, inimigos) {
  const { totais, totalPersonagens } = partyXpThresholds(personagens);

  let xpTotalInimigos = 0;
  let totalInimigos = 0;
  for (const { xp, quantidade } of inimigos) {
    const qtd = Math.max(0, Number(quantidade) || 0);
    xpTotalInimigos += (Number(xp) || 0) * qtd;
    totalInimigos += qtd;
  }

  let idx = multiplierIndexForCount(totalInimigos);
  if (totalPersonagens > 0 && totalPersonagens < 3) idx = Math.min(idx + 1, ENCOUNTER_MULTIPLIERS.length - 1);
  else if (totalPersonagens >= 6) idx = Math.max(idx - 1, 0);
  const multiplicador = totalInimigos > 0 ? ENCOUNTER_MULTIPLIERS[idx] : 0;

  const xpAjustado = Math.round(xpTotalInimigos * multiplicador);

  let dificuldade = "Trivial";
  if (xpAjustado >= totais.mortal && totais.mortal > 0) dificuldade = "Mortal";
  else if (xpAjustado >= totais.dificil && totais.dificil > 0) dificuldade = "Difícil";
  else if (xpAjustado >= totais.medio && totais.medio > 0) dificuldade = "Médio";
  else if (xpAjustado >= totais.facil && totais.facil > 0) dificuldade = "Fácil";

  return {
    totais, totalPersonagens, xpTotalInimigos, totalInimigos, multiplicador, xpAjustado, dificuldade,
  };
}
