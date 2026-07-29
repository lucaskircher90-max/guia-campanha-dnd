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
