// Converte o roteiro em Markdown (fonte original, fica na pasta da campanha)
// em src/data/roteiro.json, que a aba "Roteiro" do Guia lê.
//
// Uso:  node scripts/build-roteiro.mjs [caminho/do/Roteiro.md]
// Padrão: ../../../Roteiro_Intensivo_Sessoes_5_e_6.md
//
// Estrutura gerada:  partes (H1) > capítulos (H2) > seções (H3).
// Cada seção guarda o Markdown original (md, usado pelo editor do site) e o HTML pronto.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { limpar, renderSecaoMd, slug, unique } from "../src/lib/roteiroRender.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(process.argv[2] || path.join(here, "../../../Roteiro_Intensivo_Sessoes_5_e_6.md"));
const out = path.join(here, "../src/data/roteiro.json");

const lines = fs.readFileSync(src, "utf8").replace(/\r\n/g, "\n").split("\n");

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
  if ((m = l.match(/^# (.+)$/))) { novaParte(limpar(m[1])); continue; }
  if ((m = l.match(/^## (.+)$/))) { novoCapitulo(limpar(m[1])); continue; }
  if ((m = l.match(/^### (.+)$/))) { novaSecao(limpar(m[1])); continue; }
  if (!cap) {
    if (l.trim() === "") continue;
    novoCapitulo("Início");
  }
  if (!sec) novaSecao("Visão geral");
  sec.linhas.push(l);
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
        const secoes = [];
        for (const s of c.secoes) {
          const md = s.linhas.join("\n").trim();
          const r = renderSecaoMd(s.id, md);
          if (!r.html.trim()) continue;
          secoes.push({ id: s.id, titulo: s.titulo, md, html: r.html });
          fichas.push(...r.fichas);
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
