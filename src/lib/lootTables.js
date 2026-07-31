// Gerador de loot aleatório. As tabelas do Manual do Mestre (moedas por ND,
// gemas, itens mágicos por raridade) são conteúdo proprietário da WotC e não
// fazem parte do SRD aberto — em vez de reproduzi-las, montamos tabelas
// próprias seguindo a mesma lógica de escala por Nível de Desafio, e usamos
// itens de verdade (compêndio SRD + homebrew) para o resultado de "item mágico".

export const LOOT_TIERS = [
  { key: "t1", label: "ND 0–4", raridades: ["Comum", "Incomum"] },
  { key: "t2", label: "ND 5–10", raridades: ["Incomum", "Raro"] },
  { key: "t3", label: "ND 11–16", raridades: ["Raro", "Muito Raro"] },
  { key: "t4", label: "ND 17+", raridades: ["Muito Raro", "Lendário", "Artefato"] },
];

function rollDice(n, sides) {
  let total = 0;
  for (let i = 0; i < n; i++) total += 1 + Math.floor(Math.random() * sides);
  return total;
}

// aceita formulas como "4d6" ou "4d6*100"
function rollFormula(spec) {
  const m = spec.match(/^(\d+)d(\d+)(?:\*(\d+))?$/);
  if (!m) return 0;
  const [, n, sides, mult] = m;
  const base = rollDice(Number(n), Number(sides));
  return mult ? base * Number(mult) : base;
}

const INDIVIDUAL_COINS = {
  t1: [{ tipo: "pc", formula: "5d6" }, { tipo: "pp", formula: "4d6" }],
  t2: [{ tipo: "pp", formula: "4d6*10" }, { tipo: "po", formula: "2d6*10" }],
  t3: [{ tipo: "po", formula: "4d6*10" }, { tipo: "pl", formula: "1d6" }],
  t4: [{ tipo: "po", formula: "6d6*100" }, { tipo: "pl", formula: "3d6*10" }],
};

const HOARD_COINS = {
  t1: [{ tipo: "pc", formula: "6d6*100" }, { tipo: "pp", formula: "3d6*100" }, { tipo: "po", formula: "2d6*10" }],
  t2: [{ tipo: "pp", formula: "2d6*100" }, { tipo: "po", formula: "4d6*100" }, { tipo: "pe", formula: "1d8*10" }],
  t3: [{ tipo: "po", formula: "4d6*1000" }, { tipo: "pl", formula: "1d8*100" }],
  t4: [{ tipo: "po", formula: "12d6*1000" }, { tipo: "pl", formula: "8d6*100" }],
};

const GEM_POOLS = {
  10: ["Quartzo Azulado", "Ágata Listrada", "Turquesa Opaca", "Malaquita Polida", "Pedra-da-Lua Pálida", "Olho-de-Tigre"],
  50: ["Berilo Dourado", "Granada Escura", "Coral Rosado", "Jaspe Vermelho", "Obsidiana Lustrosa", "Âmbar Antigo"],
  100: ["Ametista Violeta", "Água-Marinha Clara", "Peridoto Verde-Oliva", "Espinélio Rubro", "Crisoberilo Amarelado"],
  250: ["Opala de Fogo", "Turmalina Bicolor", "Topázio Imperial", "Quartzo Fumê Nobre", "Jade Imperial"],
  500: ["Alexandrita Rara", "Zircão Azul-Celeste", "Safira Lascada", "Esmeralda Trincada", "Broche de Prata Entalhado"],
  1000: ["Rubi Profundo", "Safira Real", "Esmeralda Pura", "Diamante Amarelado", "Cálice Adornado com Pedras"],
  2500: ["Diamante Branco Lapidado", "Opala Negra Radiante", "Rubi Estelar", "Relicário de Ouro Batido"],
  5000: ["Diamante Perfeito", "Esmeralda do Tamanho de um Punho", "Joia Real Incrustada de Ouro"],
};

const GEM_BRACKETS_BY_TIER = {
  t1: [10, 50],
  t2: [50, 100, 250],
  t3: [250, 500, 1000],
  t4: [1000, 2500, 5000],
};

const GEM_CHANCE = { t1: 0.3, t2: 0.5, t3: 0.7, t4: 0.9 };
const GEM_COUNT = { t1: [1, 3], t2: [2, 4], t3: [3, 6], t4: [4, 8] };

const ITEM_CHANCE = { t1: 0.15, t2: 0.4, t3: 0.65, t4: 0.85 };
const ITEM_COUNT = { t1: [1, 1], t2: [1, 2], t3: [1, 3], t4: [2, 4] };

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function rollCoins(tierKey, modo) {
  const table = (modo === "hoard" ? HOARD_COINS : INDIVIDUAL_COINS)[tierKey] || [];
  const moedas = { pc: 0, pp: 0, pe: 0, po: 0, pl: 0 };
  for (const { tipo, formula } of table) {
    moedas[tipo] += rollFormula(formula);
  }
  return moedas;
}

function rollGems(tierKey) {
  if (Math.random() > GEM_CHANCE[tierKey]) return [];
  const [min, max] = GEM_COUNT[tierKey];
  const count = randInt(min, max);
  const brackets = GEM_BRACKETS_BY_TIER[tierKey];
  const gemas = [];
  for (let i = 0; i < count; i++) {
    const valor = pick(brackets);
    gemas.push({ nome: pick(GEM_POOLS[valor]), valor });
  }
  return gemas;
}

// pool: itens disponíveis (compêndio SRD + homebrew), já com campo `raridade`
function rollMagicItems(tierKey, pool) {
  if (Math.random() > ITEM_CHANCE[tierKey]) return [];
  const [min, max] = ITEM_COUNT[tierKey];
  const count = randInt(min, max);
  const raridades = LOOT_TIERS.find((t) => t.key === tierKey).raridades;
  const candidatos = pool.filter((i) => raridades.includes(i.raridade));
  if (candidatos.length === 0) return [];
  const escolhidos = [];
  for (let i = 0; i < count; i++) escolhidos.push(pick(candidatos));
  return escolhidos;
}

export function rollLoot({ tierKey, modo, itemPool }) {
  return {
    tierKey,
    modo,
    moedas: rollCoins(tierKey, modo),
    gemas: modo === "hoard" ? rollGems(tierKey) : [],
    itens: modo === "hoard" ? rollMagicItems(tierKey, itemPool || []) : [],
  };
}
