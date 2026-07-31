// Importa a ficha oficial preenchível de D&D 5E (PDF com campos AcroForm)
// e converte para o formato de personagem usado pela ferramenta.
//
// Os nomes de campo abaixo foram extraídos diretamente do PDF de referência
// (dd-5e-ficha-de-personagem-completavel-biblioteca-elfica.pdf) — incluindo
// espaços em branco incomuns nos nomes, que fazem parte do arquivo original.
import { SKILLS, abilityMod, proficiencyBonusForLevel } from "./dnd";

const SKILL_FIELD = {
  acrobacia: { text: "Acrobatics", check: "Check Box 23" },
  arcanismo: { text: "Arcana", check: "Check Box 25" },
  atletismo: { text: "Athletics", check: "Check Box 26" },
  atuacao: { text: "Performance", check: "Check Box 35" },
  blefar: { text: "Deception ", check: "Check Box 27" },
  furtividade: { text: "Stealth ", check: "Check Box 39" },
  historia: { text: "History ", check: "Check Box 28" },
  intimidacao: { text: "Intimidation", check: "Check Box 30" },
  intuicao: { text: "Insight", check: "Check Box 29" },
  investigacao: { text: "Investigation ", check: "Check Box 31" },
  lidarAnimais: { text: "Animal", check: "Check Box 24" },
  medicina: { text: "Medicine", check: "Check Box 32" },
  natureza: { text: "Nature", check: "Check Box 33" },
  percepcao: { text: "Perception ", check: "Check Box 34" },
  persuasao: { text: "Persuasion", check: "Check Box 36" },
  prestidigitacao: { text: "SleightofHand", check: "Check Box 38" },
  religiao: { text: "Religion", check: "Check Box 37" },
  sobrevivencia: { text: "Survival", check: "Check Box 40" },
};

const SAVE_CHECK = {
  for: "Check Box 11",
  des: "Check Box 18",
  con: "Check Box 19",
  int: "Check Box 20",
  sab: "Check Box 21",
  car: "Check Box 22",
};

const DEATH_SUCCESS_CHECKS = ["Check Box 12", "Check Box 13", "Check Box 14"];
const DEATH_FAIL_CHECKS = ["Check Box 15", "Check Box 16", "Check Box 17"];

function splitClasseNivel(raw) {
  const s = (raw || "").trim();
  const m = s.match(/^(.*?)[\s,]*?(\d+)\s*$/);
  if (m) {
    const nivel = Math.min(20, Math.max(1, parseInt(m[2], 10)));
    return { classe: m[1].trim(), nivel };
  }
  return { classe: s, nivel: 1 };
}

function toInt(raw, fallback = 0) {
  const n = parseInt(String(raw ?? "").replace(/[^-\d]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

export async function parsePdfCharacterSheet(arrayBuffer) {
  const { PDFDocument } = await import("pdf-lib");
  let doc;
  try {
    doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  } catch {
    throw new Error("Não foi possível abrir este arquivo como PDF.");
  }

  const form = doc.getForm();
  const fields = form.getFields();
  if (fields.length === 0) {
    throw new Error("Este PDF não tem campos preenchíveis. A importação só funciona com a ficha oficial preenchível.");
  }
  const fieldNames = new Set(fields.map((f) => f.getName()));
  if (!fieldNames.has("CharacterName")) {
    throw new Error("Não reconhecemos este PDF como a ficha oficial preenchível de D&D 5E.");
  }

  const text = (name) => {
    try {
      return form.getTextField(name).getText()?.trim() || "";
    } catch {
      return "";
    }
  };
  const checked = (name) => {
    try {
      return form.getCheckBox(name).isChecked();
    } catch {
      return false;
    }
  };

  const { classe, nivel } = splitClasseNivel(text("ClassLevel"));

  const atributos = {
    for: toInt(text("STR"), 10),
    des: toInt(text("DEX"), 10),
    con: toInt(text("CON"), 10),
    int: toInt(text("INT"), 10),
    sab: toInt(text("WIS"), 10),
    car: toInt(text("CHA"), 10),
  };

  const salvaguardas = {};
  for (const key of Object.keys(SAVE_CHECK)) salvaguardas[key] = checked(SAVE_CHECK[key]);

  const pericias = {};
  for (const s of SKILLS) {
    const f = SKILL_FIELD[s.key];
    pericias[s.key] = { proficient: f ? checked(f.check) : false, expertise: false };
  }

  const pb = proficiencyBonusForLevel(nivel);
  const percepcaoBonus = abilityMod(atributos.sab) + (pericias.percepcao?.proficient ? pb : 0);
  const passivaLida = text("Passive");
  const percepcaoPassivaExtra = passivaLida ? toInt(passivaLida) - (10 + percepcaoBonus) : 0;

  const iniciativaLida = text("Initiative");
  const iniciativaExtra = iniciativaLida ? toInt(iniciativaLida) - abilityMod(atributos.des) : 0;

  const hpMax = toInt(text("HPMax"), 10);

  const ataques = [];
  const wpnRows = [
    ["Wpn Name", "Wpn1 AtkBonus", "Wpn1 Damage"],
    ["Wpn Name 2", "Wpn2 AtkBonus ", "Wpn2 Damage "],
    ["Wpn Name 3", "Wpn3 AtkBonus  ", "Wpn3 Damage "],
  ];
  for (const [n, b, d] of wpnRows) {
    const nomeAtk = text(n), bonusAtk = text(b), danoAtk = text(d);
    if (nomeAtk || bonusAtk || danoAtk) ataques.push({ nome: nomeAtk, bonus: bonusAtk, dano: danoAtk });
  }

  const caracteristicasPartes = [text("Features and Traits"), text("Feat+Traits")].filter(Boolean);
  const attacksNotas = text("AttacksSpellcasting");
  if (attacksNotas) caracteristicasPartes.push(attacksNotas);

  const aliadosPartes = [];
  const faction = text("FactionName");
  if (faction) aliadosPartes.push(`Facção: ${faction}`);
  const allies = text("Allies");
  if (allies) aliadosPartes.push(allies);

  return {
    nome: text("CharacterName") || "Personagem Importado",
    jogador: text("PlayerName"),
    classe,
    nivel,
    antecedente: text("Background"),
    raca: text("Race "),
    tendencia: text("Alignment"),
    xp: toInt(text("XP"), 0),
    atributos,
    inspiracao: !!text("Inspiration"),
    salvaguardas,
    pericias,
    percepcaoPassivaExtra,
    ca: toInt(text("AC"), 10),
    iniciativaExtra,
    deslocamento: text("Speed") || "9m",
    pvMax: hpMax,
    pvAtual: toInt(text("HPCurrent"), hpMax),
    pvTemp: toInt(text("HPTemp"), 0),
    dadosDeVidaTotal: [text("HDTotal"), text("HD")].filter(Boolean).join("") || "1d8",
    mortSucessos: DEATH_SUCCESS_CHECKS.filter(checked).length,
    mortFracassos: DEATH_FAIL_CHECKS.filter(checked).length,
    ataques,
    tracos: text("PersonalityTraits "),
    ideais: text("Ideals"),
    ligacoes: text("Bonds"),
    defeitos: text("Flaws"),
    moedas: {
      pc: toInt(text("CP"), 0),
      pp: toInt(text("SP"), 0),
      pe: toInt(text("EP"), 0),
      po: toInt(text("GP"), 0),
      pl: toInt(text("PP"), 0),
    },
    idiomasProficiencias: text("ProficienciesLang"),
    equipamento: text("Equipment"),
    caracteristicasHabilidades: caracteristicasPartes.join("\n\n"),
    idade: text("Age"),
    altura: text("Height"),
    peso: text("Weight"),
    olhos: text("Eyes"),
    pele: text("Skin"),
    cabelos: text("Hair"),
    aliadosOrganizacoes: aliadosPartes.join("\n\n"),
    historiaPersonagem: text("Backstory"),
    tesouro: text("Treasure"),
    conjuracao: {
      classeConjuradora: text("Spellcasting Class 2"),
      habilidadeChave: text("SpellcastingAbility 2"),
      cd: text("SpellSaveDC  2"),
      bonusAtaque: text("SpellAtkBonus 2"),
      truques: [],
      espacos: Array.from({ length: 9 }, (_, i) => ({ nivel: i + 1, total: 0, usados: 0 })),
      magias: [],
    },
    notasMestre: "",
  };
}
