// Exporta uma ficha de jogador da ferramenta para um PDF preenchível.
// Layout próprio (não é uma cópia da ficha oficial da WotC) — três páginas
// com campos AcroForm reais, então continua editável em qualquer leitor de PDF.
import { ABILITIES, SKILLS, abilityMod, fmtMod, proficiencyBonusForLevel } from "./dnd";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = { r: 0.09, g: 0.07, b: 0.05 };
const GOLD = { r: 0.72, g: 0.56, b: 0.22 };
const GREY = { r: 0.4, g: 0.4, b: 0.4 };
const WHITE = { r: 1, g: 1, b: 1 };
const FIELD_BG = { r: 0.98, g: 0.97, b: 0.94 };
const FIELD_BORDER = { r: 0.65, g: 0.6, b: 0.5 };

// AcroForm/WinAnsi só cobre Latin-1 — tira qualquer coisa fora disso (emojis etc.)
// pra não quebrar a geração do PDF.
function safe(v) {
  return String(v ?? "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x00-\xFF]/g, "");
}

let seq = 0;
function uid(prefix) {
  seq += 1;
  return `${prefix}_${seq}`;
}

export async function exportPlayerCharacterPdf(pc) {
  seq = 0;
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const c = (o) => rgb(o.r, o.g, o.b);

  const doc = await PDFDocument.create();
  const form = doc.getForm();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pb = proficiencyBonusForLevel(pc.nivel);

  function newPage() {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    return page;
  }

  function header(page, title) {
    page.drawText(safe(pc.nome) || "Personagem", { x: MARGIN, y: PAGE_H - 44, size: 20, font: bold, color: c(INK) });
    page.drawText(safe(title), { x: MARGIN, y: PAGE_H - 60, size: 10, font, color: c(GREY) });
    const wm = "Guia da Campanha - Ficha de Personagem";
    const wmSize = 8;
    const wmW = font.widthOfTextAtSize(wm, wmSize);
    page.drawText(wm, { x: PAGE_W - MARGIN - wmW, y: PAGE_H - 44, size: wmSize, font, color: c(GREY) });
    page.drawLine({ start: { x: MARGIN, y: PAGE_H - 68 }, end: { x: PAGE_W - MARGIN, y: PAGE_H - 68 }, thickness: 1, color: c(GOLD) });
    return PAGE_H - 90;
  }

  function sectionHeader(page, text, x, y, w) {
    page.drawRectangle({ x, y: y - 2, width: w, height: 16, color: c(GOLD) });
    page.drawText(safe(text).toUpperCase(), { x: x + 5, y: y + 2, size: 8.5, font: bold, color: c(WHITE) });
    return y - 22;
  }

  function label(page, text, x, y, size = 7) {
    page.drawText(safe(text), { x, y, size, font: bold, color: c(GREY) });
  }

  function fieldBox({ page, x, y, w, h, value, multiline = false, size = 9 }) {
    const field = form.createTextField(uid("f"));
    if (multiline) field.enableMultiline();
    try {
      field.setText(safe(value));
    } catch {
      field.setText("");
    }
    field.addToPage(page, {
      x, y, width: w, height: h,
      font,
      textColor: c(INK),
      backgroundColor: c(FIELD_BG),
      borderColor: c(FIELD_BORDER),
      borderWidth: 0.75,
    });
    try { field.setFontSize(size); } catch { /* deixa auto-size */ }
    return field;
  }

  function checkField({ page, x, y, size = 10, checked }) {
    const cb = form.createCheckBox(uid("c"));
    cb.addToPage(page, { x, y, width: size, height: size, borderColor: c(FIELD_BORDER), borderWidth: 0.75 });
    if (checked) cb.check();
    return cb;
  }

  // ---------- Página 1: identidade, atributos, resistências, perícias, combate ----------
  const p1 = newPage();
  let y = header(p1, `${safe(pc.classe) || "Classe"} - Nivel ${pc.nivel || 1} - ${safe(pc.raca) || "Raca"}`);

  const idLabels = ["Jogador", "Antecedente", "Raca", "Tendencia"];
  const idValues = [pc.jogador, pc.antecedente, pc.raca, pc.tendencia];
  const idW = (CONTENT_W - 30) / 4;
  idLabels.forEach((lbl, i) => {
    const x = MARGIN + i * (idW + 10);
    label(p1, lbl, x, y);
    fieldBox({ page: p1, x, y: y - 16, w: idW, h: 14, value: idValues[i] });
  });
  y -= 40;

  const abilW = (CONTENT_W - 5 * 6) / 6;
  ABILITIES.forEach((a, i) => {
    const x = MARGIN + i * (abilW + 6);
    const score = pc.atributos?.[a.key] ?? 10;
    const mod = abilityMod(score);
    p1.drawText(a.key.toUpperCase(), { x: x + abilW / 2 - 8, y, size: 8.5, font: bold, color: c(GREY) });
    fieldBox({ page: p1, x, y: y - 18, w: abilW, h: 18, value: score, size: 11 });
    const modStr = fmtMod(mod);
    const modW = bold.widthOfTextAtSize(modStr, 9);
    p1.drawText(modStr, { x: x + abilW / 2 - modW / 2, y: y - 32, size: 9, font: bold, color: c(INK) });
  });
  y -= 60;

  const colLeftX = MARGIN;
  const colRightX = MARGIN + CONTENT_W / 2 + 8;
  const colW = CONTENT_W / 2 - 8;

  // Coluna esquerda: resistências + pericias
  let ly = sectionHeader(p1, "Resistencias", colLeftX, y, colW);
  for (const a of ABILITIES) {
    const prof = !!pc.salvaguardas?.[a.key];
    const bonus = abilityMod(pc.atributos?.[a.key] ?? 10) + (prof ? pb : 0);
    checkField({ page: p1, x: colLeftX, y: ly, size: 9, checked: prof });
    p1.drawText(a.label, { x: colLeftX + 14, y: ly + 1, size: 8, font, color: c(INK) });
    fieldBox({ page: p1, x: colLeftX + colW - 40, y: ly - 2, w: 40, h: 12, value: fmtMod(bonus), size: 8 });
    ly -= 15;
  }
  ly -= 7;
  ly = sectionHeader(p1, "Pericias", colLeftX, ly, colW);
  for (const s of SKILLS) {
    const state = pc.pericias?.[s.key] || {};
    let bonus = abilityMod(pc.atributos?.[s.ability] ?? 10);
    if (state.proficient) bonus += pb;
    if (state.expertise) bonus += pb;
    checkField({ page: p1, x: colLeftX, y: ly, size: 9, checked: !!state.proficient });
    const nameLabel = state.expertise ? `${s.label} (E)` : s.label;
    p1.drawText(nameLabel, { x: colLeftX + 14, y: ly + 1, size: 7.5, font, color: c(INK) });
    fieldBox({ page: p1, x: colLeftX + colW - 40, y: ly - 2, w: 40, h: 12, value: fmtMod(bonus), size: 8 });
    ly -= 14;
  }

  // Coluna direita: combate, pv, ataques, moedas
  let ry = sectionHeader(p1, "Combate", colRightX, y, colW);
  const combatFields = [
    ["CA", pc.ca, 55],
    ["Iniciativa", fmtMod(abilityMod(pc.atributos?.des ?? 10) + (Number(pc.iniciativaExtra) || 0)), 60],
    ["Deslocamento", pc.deslocamento, 95],
    ["Bonus Prof.", fmtMod(pb), 55],
  ];
  let cx = colRightX;
  combatFields.forEach(([lbl, val, w]) => {
    label(p1, lbl, cx, ry);
    fieldBox({ page: p1, x: cx, y: ry - 16, w, h: 14, value: val });
    cx += w + 8;
  });
  ry -= 40;

  label(p1, "Pontos de Experiencia", colRightX, ry);
  fieldBox({ page: p1, x: colRightX, y: ry - 16, w: 90, h: 14, value: pc.xp });
  label(p1, "Inspiracao", colRightX + 100, ry);
  checkField({ page: p1, x: colRightX + 100, y: ry - 16, size: 12, checked: !!pc.inspiracao });
  ry -= 34;

  ry = sectionHeader(p1, "Pontos de Vida", colRightX, ry, colW);
  const hpFields = [
    ["PV Maximo", pc.pvMax, 58],
    ["PV Atual", pc.pvAtual, 58],
    ["PV Temp.", pc.pvTemp, 58],
    ["Dados de Vida", pc.dadosDeVidaTotal, 58],
  ];
  cx = colRightX;
  hpFields.forEach(([lbl, val, w]) => {
    label(p1, lbl, cx, ry);
    fieldBox({ page: p1, x: cx, y: ry - 16, w, h: 14, value: val });
    cx += w + 6;
  });
  ry -= 40;

  label(p1, "Salvamentos contra a Morte - Sucessos / Fracassos", colRightX, ry);
  ry -= 14;
  for (let i = 0; i < 3; i++) checkField({ page: p1, x: colRightX + i * 16, y: ry, size: 10, checked: i < (pc.mortSucessos || 0) });
  for (let i = 0; i < 3; i++) checkField({ page: p1, x: colRightX + 60 + i * 16, y: ry, size: 10, checked: i < (pc.mortFracassos || 0) });
  ry -= 26;

  ry = sectionHeader(p1, "Ataques", colRightX, ry, colW);
  label(p1, "Nome", colRightX, ry);
  label(p1, "Bonus", colRightX + 115, ry);
  label(p1, "Dano/Tipo", colRightX + 175, ry);
  ry -= 14;
  const ataques = pc.ataques && pc.ataques.length > 0 ? pc.ataques.slice(0, 4) : [{}, {}, {}];
  for (const atk of ataques) {
    fieldBox({ page: p1, x: colRightX, y: ry - 12, w: 110, h: 14, value: atk.nome, size: 8 });
    fieldBox({ page: p1, x: colRightX + 115, y: ry - 12, w: 55, h: 14, value: atk.bonus, size: 8 });
    fieldBox({ page: p1, x: colRightX + 175, y: ry - 12, w: colW - 175, h: 14, value: atk.dano, size: 8 });
    ry -= 18;
  }
  ry -= 8;

  ry = sectionHeader(p1, "Moedas", colRightX, ry, colW);
  const coinLabels = ["PC", "PP", "PE", "PO", "PL"];
  const coinKeys = ["pc", "pp", "pe", "po", "pl"];
  const coinW = (colW - 4 * 6) / 5;
  coinLabels.forEach((lbl, i) => {
    const x = colRightX + i * (coinW + 6);
    label(p1, lbl, x, ry);
    fieldBox({ page: p1, x, y: ry - 16, w: coinW, h: 14, value: pc.moedas?.[coinKeys[i]] ?? 0, size: 8 });
  });

  // ---------- Página 2: personalidade, idiomas, equipamento, aparência, história ----------
  const p2 = newPage();
  y = header(p2, "Personalidade, Antecedentes & Aparencia");

  y = sectionHeader(p2, "Personalidade", MARGIN, y, CONTENT_W);
  const persoW = (CONTENT_W - 10) / 2;
  const persoFields = [
    ["Tracos de Personalidade", pc.tracos],
    ["Ideais", pc.ideais],
    ["Vinculos", pc.ligacoes],
    ["Defeitos", pc.defeitos],
  ];
  for (let i = 0; i < persoFields.length; i += 2) {
    for (let col = 0; col < 2 && i + col < persoFields.length; col++) {
      const [lbl, val] = persoFields[i + col];
      const x = MARGIN + col * (persoW + 10);
      label(p2, lbl, x, y);
      fieldBox({ page: p2, x, y: y - 55, w: persoW, h: 53, value: val, multiline: true, size: 8 });
    }
    y -= 65;
  }
  y -= 5;

  y = sectionHeader(p2, "Idiomas, Proficiencias & Equipamento", MARGIN, y, CONTENT_W);
  label(p2, "Idiomas e Outras Proficiencias", MARGIN, y);
  fieldBox({ page: p2, x: MARGIN, y: y - 38, w: CONTENT_W, h: 36, value: pc.idiomasProficiencias, multiline: true, size: 8 });
  y -= 48;
  label(p2, "Equipamento", MARGIN, y);
  fieldBox({ page: p2, x: MARGIN, y: y - 48, w: CONTENT_W, h: 46, value: pc.equipamento, multiline: true, size: 8 });
  y -= 58;

  y = sectionHeader(p2, "Caracteristicas & Habilidades", MARGIN, y, CONTENT_W);
  fieldBox({ page: p2, x: MARGIN, y: y - 66, w: CONTENT_W, h: 64, value: pc.caracteristicasHabilidades, multiline: true, size: 8 });
  y -= 78;

  y = sectionHeader(p2, "Aparencia", MARGIN, y, CONTENT_W);
  const apLabels = ["Idade", "Altura", "Peso", "Olhos", "Pele", "Cabelos"];
  const apValues = [pc.idade, pc.altura, pc.peso, pc.olhos, pc.pele, pc.cabelos];
  const apW = (CONTENT_W - 5 * 6) / 6;
  apLabels.forEach((lbl, i) => {
    const x = MARGIN + i * (apW + 6);
    label(p2, lbl, x, y, 6.5);
    fieldBox({ page: p2, x, y: y - 15, w: apW, h: 13, value: apValues[i], size: 7.5 });
  });
  y -= 36;
  label(p2, "Descricao de Aparencia", MARGIN, y);
  fieldBox({ page: p2, x: MARGIN, y: y - 48, w: CONTENT_W, h: 46, value: pc.aparenciaDescricao, multiline: true, size: 8 });
  y -= 60;

  y = sectionHeader(p2, "Historia do Personagem", MARGIN, y, CONTENT_W);
  fieldBox({ page: p2, x: MARGIN, y: y - 168, w: CONTENT_W, h: 166, value: pc.historiaPersonagem, multiline: true, size: 8 });

  // ---------- Página 3: aliados, tesouro, conjuração ----------
  const p3 = newPage();
  y = header(p3, "Aliados, Tesouro & Conjuracao");

  y = sectionHeader(p3, "Aliados & Organizacoes", MARGIN, y, CONTENT_W);
  fieldBox({ page: p3, x: MARGIN, y: y - 68, w: CONTENT_W, h: 66, value: pc.aliadosOrganizacoes, multiline: true, size: 8 });
  y -= 80;

  y = sectionHeader(p3, "Tesouro", MARGIN, y, CONTENT_W);
  fieldBox({ page: p3, x: MARGIN, y: y - 68, w: CONTENT_W, h: 66, value: pc.tesouro, multiline: true, size: 8 });
  y -= 80;

  y = sectionHeader(p3, "Conjuracao", MARGIN, y, CONTENT_W);
  const conj = pc.conjuracao || {};
  const spellFields = [
    ["Classe Conjuradora", conj.classeConjuradora, 150],
    ["Habilidade Chave", conj.habilidadeChave, 100],
    ["CD para Resistencia", conj.cd, 90],
    ["Bonus de Ataque", conj.bonusAtaque, 90],
  ];
  cx = MARGIN;
  spellFields.forEach(([lbl, val, w]) => {
    label(p3, lbl, cx, y);
    fieldBox({ page: p3, x: cx, y: y - 16, w, h: 14, value: val, size: 8 });
    cx += w + 8;
  });
  y -= 34;

  label(p3, "Truques Conhecidos", MARGIN, y);
  const truquesStr = Array.isArray(conj.truques) ? conj.truques.join(", ") : "";
  fieldBox({ page: p3, x: MARGIN, y: y - 34, w: CONTENT_W, h: 32, value: truquesStr, multiline: true, size: 8 });
  y -= 46;

  label(p3, "Espacos de Magia (Total / Usados por Nivel)", MARGIN, y);
  y -= 14;
  const espacos = conj.espacos || [];
  const slotColW = CONTENT_W / 3;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col;
      const nivel = idx + 1;
      const slot = espacos[idx] || { total: 0, usados: 0 };
      const x = MARGIN + col * slotColW;
      p3.drawText(`Nv.${nivel}`, { x, y: y - row * 24, size: 7.5, font: bold, color: c(GREY) });
      fieldBox({ page: p3, x: x + 30, y: y - row * 24 - 3, w: 30, h: 13, value: slot.total, size: 7.5 });
      p3.drawText("/", { x: x + 62, y: y - row * 24, size: 8, font, color: c(GREY) });
      fieldBox({ page: p3, x: x + 68, y: y - row * 24 - 3, w: 30, h: 13, value: slot.usados, size: 7.5 });
    }
  }
  y -= 3 * 24 + 14;

  label(p3, "Magias Preparadas / Conhecidas", MARGIN, y);
  const magiasStr = Array.isArray(conj.magias)
    ? conj.magias.map((m) => (typeof m === "string" ? m : m?.nome)).filter(Boolean).join(", ")
    : "";
  fieldBox({ page: p3, x: MARGIN, y: y - 108, w: CONTENT_W, h: 106, value: magiasStr, multiline: true, size: 8 });

  return doc.save();
}
