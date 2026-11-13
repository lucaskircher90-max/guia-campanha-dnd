// Converte o roteiro em Markdown (fonte da verdade, fica na pasta da campanha)
// em src/data/roteiro.json, que a aba "Roteiro" do Guia lê.
//
// Uso:  node scripts/build-roteiro.mjs [caminho/do/Roteiro.md]
// Padrão: ../../../Roteiro_Intensivo_Sessoes_5_e_6.md
//
// Estrutura gerada:  partes (H1) > capítulos (H2) > seções (H3, viram sub-abas).
// Dentro de uma seção, blocos H4 viram caixas recolhíveis; fichas (CA + PV) e
// props ganham uma classe própria.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(process.argv[2] || path.join(here, "../../../Roteiro_Intensivo_Sessoes_5_e_6.md"));
const out = path.join(here, "../src/data/roteiro.json");

const md = fs.readFileSync(src, "utf8").replace(/\r\n/g, "\n");
const lines = md.split("\n");

const slug = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "x";
const unique = (set, base) => {
  let id = base, n = 2;
  while (set.has(id)) id = `${base}-${n++}`;
  set.add(id);
  return id;
};
const clean = (t) => t.replace(/\*\*|__|`/g, "").trim();
const semMarcas = (t) => t.replace(/[*_]/g, "");
const isFicha = (text) => {
  const t = semMarcas(text).slice(0, 700);
  return /\bCA\b\s*\d+/.test(t) && /\bPV\b/.test(t);
};

const partes = [];
let parte = null, cap = null, sec = null;
const capIds = new Set();

function novaParte(titulo) {
  parte = { id: slug(titulo), titulo, capitulos: [] };
  partes.push(parte);
  cap = null; sec = null;
}
function novoCapitulo(titulo) {
  if (!parte) novaParte("Início");
  if (titulo === "Início") titulo = "Apresentação";
  cap = { id: unique(capIds, slug(titulo)), titulo, secoes: [], _secIds: new Set() };
  parte.capitulos.push(cap);
  sec = null;
}
function novaSecao(titulo) {
  if (!cap) novoCapitulo("Início");
  sec = { id: unique(cap._secIds, slug(titulo)), titulo, linhas: [] };
  cap.secoes.push(sec);
}

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  let m;
  if (i === 0 && /^# /.test(l)) continue; // título do documento
  if ((m = l.match(/^# (.+)$/))) { novaParte(clean(m[1])); continue; }
  if ((m = l.match(/^## (.+)$/))) { novoCapitulo(clean(m[1])); continue; }
  if ((m = l.match(/^### (.+)$/))) { novaSecao(clean(m[1])); continue; }
  if (!cap) {
    if (l.trim() === "") continue;
    novoCapitulo("Início");
  }
  if (!sec) novaSecao("Visão geral");
  sec.linhas.push(l);
}

// ---------- renderização ----------
function renderChunk(mdText) {
  let html = marked.parse(mdText, { gfm: true, breaks: true });
  html = html.replace(/<table>/g, '<div class="tbl"><table>').replace(/<\/table>/g, "</table></div>");
  return html;
}

// Marca listas de estatísticas (CA + PV) e o nome em negrito logo acima delas.
function marcarFichas(html, secId, fichas, ids) {
  // Padrão A: título H5/H6, linha de tipo em itálico (opcional) e lista com CA/PV.
  html = html.replace(
    /<h([56])>([\s\S]*?)<\/h\1>(\s*<p>(?:(?!<\/p>)[\s\S])*<\/p>)?(\s*)<ul>([\s\S]*?)<\/ul>/g,
    (all, nivel, titulo, tipoP, esp, ul) => {
      const primeira = (ul.match(/<li>([\s\S]*?)<\/li>/) || [, ""])[1].replace(/<[^>]+>/g, "");
      if (!/\bCA\b\s*\d+/.test(primeira)) return all;
      const nome = titulo.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
      const id = unique(ids, slug("f-" + nome));
      fichas.push({ titulo: nome, secao: secId, ancora: id });
      return `<h${nivel} class="ficha-nome" id="${id}">${titulo}</h${nivel}>${tipoP || ""}${esp}<ul class="ficha-box">${ul}</ul>`;
    }
  );
  const re = /(<p><strong>[^<]{2,80}<\/strong>[\s\S]*?<\/p>\s*)?<ul>([\s\S]*?)<\/ul>/g;
  return html.replace(re, (all, nomeP, ul) => {
    const primeira = (ul.match(/<li>([\s\S]*?)<\/li>/) || [, ""])[1].replace(/<[^>]+>/g, "");
    if (!/\bCA\b\s*\d+/.test(primeira)) return all;
    let prefixo = nomeP || "";
    if (nomeP && /^<p><strong>/.test(nomeP) && nomeP.length < 400) {
      const nome = (nomeP.match(/<strong>([^<]+)<\/strong>/) || [, ""])[1].replace(/[:.]$/, "").trim();
      const id = unique(ids, slug("f-" + nome));
      prefixo = nomeP.replace("<p>", `<p class="ficha-nome" id="${id}">`);
      if (nome) fichas.push({ titulo: nome, secao: secId, ancora: id });
    }
    return `${prefixo}<ul class="ficha-box">${ul}</ul>`;
  });
}

function renderSecao(s, fichas) {
  const parts = [];
  let cur = { titulo: null, linhas: [] };
  for (const l of s.linhas) {
    const m = l.match(/^#### (.+)$/);
    if (m) {
      parts.push(cur);
      cur = { titulo: clean(m[1]), linhas: [] };
    } else cur.linhas.push(l);
  }
  parts.push(cur);
  const ids = new Set();
  let html = "";
  for (const p of parts) {
    const body = p.linhas.join("\n").trim();
    if (!p.titulo) {
      if (body) html += marcarFichas(renderChunk(body), s.id, fichas, ids);
      continue;
    }
    const id = unique(ids, slug(p.titulo));
    const ficha = /^ficha:/i.test(p.titulo) || (isFicha(body) && body.length < 1800 && !/^\d+\./.test(p.titulo));
    const prop = /^prop\b/i.test(p.titulo);
    const cls = ["bloco", ficha ? "ficha" : "", prop ? "prop" : ""].filter(Boolean).join(" ");
    if (ficha) fichas.push({ titulo: p.titulo.replace(/^ficha:\s*/i, ""), secao: s.id, ancora: id });
    const aberto = ficha ? "" : " open";
    const titulo = p.titulo.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    html += `<details class="${cls}" id="${id}"${aberto}><summary>${titulo}</summary><div class="bloco-corpo">${marcarFichas(renderChunk(body), s.id, fichas, ids)}</div></details>\n`;
  }
  return html;
}

const resultado = {
  geradoEm: new Date().toISOString(),
  fonte: path.basename(src),
  partes: partes
    .map((pt) => ({
      id: pt.id,
      titulo: pt.titulo,
      capitulos: pt.capitulos.map((c) => {
        const fichas = [];
        const secoes = c.secoes
          .map((s) => ({ id: s.id, titulo: s.titulo, html: renderSecao(s, fichas) }))
          .filter((s) => s.html.trim());
        for (const s of c.secoes) {
          if (/^ficha:/i.test(s.titulo)) fichas.push({ titulo: s.titulo.replace(/^ficha:\s*/i, ""), secao: s.id, ancora: null });
        }
        return { id: c.id, titulo: c.titulo, secoes, fichas };
      }),
    }))
    .filter((pt) => pt.capitulos.length),
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(resultado));
const soma = (f) => resultado.partes.reduce((a, p) => a + p.capitulos.reduce((b, c) => b + f(c), 0), 0);
console.log(
  `Roteiro: ${resultado.partes.length} partes, ${soma(() => 1)} capítulos, ${soma((c) => c.secoes.length)} seções, ` +
    `${soma((c) => c.fichas.length)} fichas. ${(fs.statSync(out).size / 1024).toFixed(0)} KB`
);
