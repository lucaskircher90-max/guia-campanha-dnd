// Converte o Markdown de uma seção do roteiro em HTML do Guia.
// Usado pelo gerador (scripts/build-roteiro.mjs) e pelo editor da aba Roteiro,
// para que o texto editado no site fique idêntico ao texto original.
import { marked } from "marked";

export const slug = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "x";

export const unique = (set, base) => {
  let id = base, n = 2;
  while (set.has(id)) id = `${base}-${n++}`;
  set.add(id);
  return id;
};

export const limpar = (t) => t.replace(/\*\*|__|`/g, "").trim();
const semMarcas = (t) => t.replace(/[*_]/g, "");
export const ehFicha = (text) => {
  const t = semMarcas(text).slice(0, 700);
  return /\bCA\b\s*\d+/.test(t) && /\bPV\b/.test(t);
};

function renderChunk(mdText) {
  let html = marked.parse(mdText, { gfm: true, breaks: true });
  html = html.replace(/<table>/g, '<div class="tbl"><table>').replace(/<\/table>/g, "</table></div>");
  return html;
}

// Marca listas de estatísticas (CA + PV) e o nome logo acima delas.
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
  // Padrão B: nome em negrito numa linha e lista com CA/PV logo abaixo.
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

// Renderiza uma seção (conteúdo de um H3). Blocos H4 viram caixas recolhíveis.
// Devolve { html, fichas }.
export function renderSecaoMd(secId, mdText) {
  const fichas = [];
  const parts = [];
  let cur = { titulo: null, linhas: [] };
  for (const l of mdText.replace(/\r\n/g, "\n").split("\n")) {
    const m = l.match(/^#### (.+)$/);
    if (m) {
      parts.push(cur);
      cur = { titulo: limpar(m[1]), linhas: [] };
    } else cur.linhas.push(l);
  }
  parts.push(cur);
  const ids = new Set();
  let html = "";
  for (const p of parts) {
    const body = p.linhas.join("\n").trim();
    if (!p.titulo) {
      if (body) html += marcarFichas(renderChunk(body), secId, fichas, ids);
      continue;
    }
    const id = unique(ids, slug(p.titulo));
    const ficha = /^ficha:/i.test(p.titulo) || (ehFicha(body) && body.length < 1800 && !/^\d+\./.test(p.titulo));
    const prop = /^prop\b/i.test(p.titulo);
    const cls = ["bloco", ficha ? "ficha" : "", prop ? "prop" : ""].filter(Boolean).join(" ");
    if (ficha) fichas.push({ titulo: p.titulo.replace(/^ficha:\s*/i, ""), secao: secId, ancora: id });
    const aberto = ficha ? "" : " open";
    const titulo = p.titulo.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    html += `<details class="${cls}" id="${id}"${aberto}><summary>${titulo}</summary><div class="bloco-corpo">${marcarFichas(renderChunk(body), secId, fichas, ids)}</div></details>\n`;
  }
  return { html, fichas };
}
