import { emptyAbilities, SKILLS } from "./dnd";

function id() {
  return crypto.randomUUID();
}

export function emptySkills() {
  const obj = {};
  for (const s of SKILLS) obj[s.key] = { proficient: false, expertise: false };
  return obj;
}

export function emptySaves() {
  return { for: false, des: false, con: false, int: false, sab: false, car: false };
}

export function newPlayerCharacter(overrides = {}) {
  return {
    id: id(),
    createdAt: Date.now(),
    // Cabeçalho
    nome: "Novo Personagem",
    jogador: "",
    classe: "",
    nivel: 1,
    antecedente: "",
    raca: "",
    tendencia: "",
    xp: 0,
    // Atributos
    atributos: emptyAbilities(10),
    inspiracao: false,
    // Testes de resistência e perícias
    salvaguardas: emptySaves(),
    pericias: emptySkills(),
    percepcaoPassivaExtra: 0,
    // Combate
    ca: 10,
    caObs: "",
    iniciativaExtra: 0,
    deslocamento: "9m",
    pvMax: 10,
    pvAtual: 10,
    pvTemp: 0,
    dadosDeVidaTotal: "1d8",
    dadosDeVidaGastos: 0,
    mortSucessos: 0,
    mortFracassos: 0,
    ataques: [],
    // Personalidade
    tracos: "",
    ideais: "",
    ligacoes: "",
    defeitos: "",
    // Recursos
    moedas: { pc: 0, pp: 0, pe: 0, po: 0, pl: 0 },
    idiomasProficiencias: "",
    equipamento: "",
    caracteristicasHabilidades: "",
    // Aparência / história
    idade: "",
    altura: "",
    peso: "",
    olhos: "",
    pele: "",
    cabelos: "",
    aparenciaDescricao: "",
    aliadosOrganizacoes: "",
    historiaPersonagem: "",
    tesouro: "",
    imagemUrl: "",
    // Conjuração
    conjuracao: {
      classeConjuradora: "",
      habilidadeChave: "",
      cd: "",
      bonusAtaque: "",
      truques: [],
      espacos: Array.from({ length: 9 }, (_, i) => ({ nivel: i + 1, total: 0, usados: 0 })),
      magias: [],
    },
    notasMestre: "",
    ...overrides,
  };
}

export function newNpc(overrides = {}) {
  return {
    id: id(),
    createdAt: Date.now(),
    nome: "Novo NPC",
    papel: "",
    tipoTamanhoAlinhamento: "",
    imagemUrl: "",
    ca: 10,
    caObs: "",
    pvMedio: 10,
    pvDados: "2d8+2",
    deslocamento: "9m",
    atributos: emptyAbilities(10),
    salvaguardas: "",
    pericias: "",
    resistenciasDano: "",
    imunidadesDano: "",
    vulnerabilidadesDano: "",
    imunidadesCondicao: "",
    sentidos: "",
    idiomas: "",
    nd: "",
    pe: "",
    tracos: [],
    acoes: [],
    acoesLendarias: [],
    reacoes: [],
    descricao: "",
    notasMestre: "",
    importante: true,
    ...overrides,
  };
}

export function newMilestone(overrides = {}) {
  return {
    id: id(),
    createdAt: Date.now(),
    titulo: "",
    sessao: "",
    tipo: "Marco",
    descricao: "",
    concluido: false,
    ...overrides,
  };
}

export function newCombatant(overrides = {}) {
  return {
    id: id(),
    nome: "",
    tipo: "npc", // 'pj' | 'npc'
    iniciativa: 0,
    ca: 10,
    pvMax: 10,
    pvAtual: 10,
    condicoes: [],
    notas: "",
    sourceId: null,
    ...overrides,
  };
}

export function newEncounter(overrides = {}) {
  return {
    id: id(),
    nome: "Encontro",
    rodada: 1,
    turnoAtual: 0,
    combatentes: [],
    ...overrides,
  };
}

export function newItem(overrides = {}) {
  return {
    id: id(),
    createdAt: Date.now(),
    nome: "Novo Item",
    tipo: "Item Maravilhoso",
    raridade: "",
    requerSintonizacao: false,
    custo: "",
    peso: "",
    propriedades: "",
    descricao: "",
    imagemUrl: "",
    homebrew: true,
    ...overrides,
  };
}

export function newMapEntry(overrides = {}) {
  return {
    id: id(),
    createdAt: Date.now(),
    nome: "Novo Mapa",
    local: "",
    notas: "",
    imagemDataUrl: "",
    ...overrides,
  };
}
