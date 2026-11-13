import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import roteiro from "../data/roteiro.json";
import "../roteiro.css";
import { useData } from "../context/DataContext";
import { Button, Card, TextArea } from "../components/ui";

const LS_ULTIMO = "dnd.roteiro.ultimo";

function textoPuro(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function semAcento(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function Roteiro() {
  const { cap: capParam, sec: secParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { roteiro: estado, setRoteiro } = useData();
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const conteudoRef = useRef(null);

  // lista plana de capítulos, na ordem do documento
  const capitulos = useMemo(() => {
    const lista = [];
    for (const p of roteiro.partes) for (const c of p.capitulos) lista.push({ ...c, parte: p.titulo, parteId: p.id });
    return lista;
  }, []);

  // índice de busca (texto sem acento), montado uma vez
  const indice = useMemo(() => {
    const itens = [];
    for (const c of capitulos)
      for (const s of c.secoes) {
        const texto = textoPuro(s.html);
        itens.push({ cap: c, sec: s, texto, busca: semAcento(texto + " " + s.titulo + " " + c.titulo) });
      }
    return itens;
  }, [capitulos]);

  const ultimo = (() => {
    try {
      return window.localStorage.getItem(LS_ULTIMO) || "";
    } catch {
      return "";
    }
  })();
  const capAtual =
    capitulos.find((c) => c.id === capParam) ||
    capitulos.find((c) => c.id === ultimo) ||
    capitulos.find((c) => /abertura/i.test(c.titulo)) ||
    capitulos[0];
  const secAtual = capAtual.secoes.find((s) => s.id === secParam) || capAtual.secoes[0];
  const idxCap = capitulos.findIndex((c) => c.id === capAtual.id);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_ULTIMO, capAtual.id);
    } catch {
      /* ignora */
    }
  }, [capAtual.id]);

  // rola para o topo ao trocar de seção; ou abre e rola até uma ficha pedida
  useEffect(() => {
    const ancora = location.state?.ancora;
    if (ancora) {
      const el = document.getElementById(ancora);
      if (el) {
        if (el.tagName === "DETAILS") el.open = true;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [capAtual.id, secAtual?.id, location.state]);

  function ir(capId, secId, ancora) {
    navigate(`/roteiro/${capId}${secId ? `/${secId}` : ""}`, { state: ancora ? { ancora, t: Date.now() } : undefined });
  }

  const concluidos = estado?.concluidos || {};
  const notas = estado?.notas || {};
  function alternarConcluido(id) {
    setRoteiro((prev) => ({ ...prev, concluidos: { ...(prev.concluidos || {}), [id]: !prev.concluidos?.[id] } }));
  }
  function definirNota(id, texto) {
    setRoteiro((prev) => ({ ...prev, notas: { ...(prev.notas || {}), [id]: texto } }));
  }

  function abrirTodas(abrir) {
    conteudoRef.current?.querySelectorAll("details").forEach((d) => {
      d.open = abrir;
    });
  }

  const resultados = useMemo(() => {
    const q = semAcento(busca.trim());
    if (q.length < 2) return [];
    const termos = q.split(/\s+/).filter(Boolean);
    const achados = [];
    for (const it of indice) {
      if (!termos.every((t) => it.busca.includes(t))) continue;
      const pos = semAcento(it.texto).indexOf(termos[0]);
      const ini = Math.max(0, pos - 50);
      const trecho = pos >= 0 ? (ini > 0 ? "…" : "") + it.texto.slice(ini, ini + 150) + "…" : it.texto.slice(0, 120);
      achados.push({ ...it, trecho });
      if (achados.length >= 40) break;
    }
    return achados;
  }, [busca, indice]);

  // agrupa o menu lateral por parte
  const partes = roteiro.partes;

  return (
    <div className="flex flex-col md:flex-row gap-5 items-start">
      {/* Menu lateral */}
      <aside className="w-full md:w-72 shrink-0 md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          className="md:hidden w-full text-left card px-3 py-2 text-sm text-parchment-100 cursor-pointer"
        >
          ☰ Capítulos · <span className="text-gold-400">{capAtual.titulo}</span>
        </button>
        <div className={`${menuAberto ? "flex" : "hidden"} md:flex flex-col gap-3`}>
        <input
          type="search"
          placeholder="Buscar no roteiro (ex.: Voss, CD 13)"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full"
        />
        {busca.trim().length >= 2 ? (
          <div className="flex flex-col gap-1.5">
            <div className="text-xs text-parchment-300/70">
              {resultados.length} resultado{resultados.length === 1 ? "" : "s"}
            </div>
            {resultados.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setBusca("");
                  ir(r.cap.id, r.sec.id);
                }}
                className="text-left card p-2 hover:border-gold-500 cursor-pointer"
              >
                <div className="text-xs text-gold-400">{r.cap.titulo}</div>
                <div className="text-sm text-parchment-100">{r.sec.titulo}</div>
                <div className="text-xs text-parchment-300/70 mt-0.5">{r.trecho}</div>
              </button>
            ))}
          </div>
        ) : (
          <nav className="flex flex-col gap-3">
            {partes.map((p) => (
              <div key={p.id}>
                <div className="font-display text-xs text-gold-400 uppercase tracking-wider mb-1">{p.titulo}</div>
                <ul className="flex flex-col gap-0.5">
                  {p.capitulos.map((c) => {
                    const ativo = c.id === capAtual.id;
                    return (
                      <li key={c.id}>
                        <Link
                          to={`/roteiro/${c.id}`}
                          onClick={() => setMenuAberto(false)}
                          className={`flex items-start gap-2 px-2 py-1.5 rounded text-sm ${
                            ativo ? "bg-blood-600 text-parchment-50" : "text-parchment-200 hover:bg-ink-700"
                          }`}
                        >
                          <span className="w-4 shrink-0 text-gold-400">{concluidos[c.id] ? "✓" : ""}</span>
                          <span className={concluidos[c.id] && !ativo ? "opacity-60" : ""}>{c.titulo}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        )}
        </div>
      </aside>

      {/* Conteúdo */}
      <section className="flex-1 min-w-0 w-full flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-parchment-300/60">{capAtual.parte}</div>
            <h2 className="font-display text-2xl text-gold-400 leading-tight">{capAtual.titulo}</h2>
          </div>
          <Button
            variant={concluidos[capAtual.id] ? "gold" : "default"}
            onClick={() => alternarConcluido(capAtual.id)}
          >
            {concluidos[capAtual.id] ? "✓ Jogado" : "Marcar como jogado"}
          </Button>
        </div>

        {/* Sub-abas: seções do capítulo */}
        {capAtual.secoes.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {capAtual.secoes.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={s.id === secAtual.id}
                onClick={() => ir(capAtual.id, s.id)}
                className={`px-3 py-1.5 rounded text-sm border cursor-pointer ${
                  s.id === secAtual.id
                    ? "bg-gold-600 text-ink-950 border-gold-600 font-semibold"
                    : "bg-ink-800 border-ink-600 text-parchment-200 hover:border-gold-500"
                }`}
              >
                {s.titulo}
              </button>
            ))}
          </div>
        )}

        {/* Fichas do capítulo */}
        {capAtual.fichas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-parchment-300/70 text-xs uppercase tracking-wide">Fichas deste capítulo:</span>
            {capAtual.fichas.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => ir(capAtual.id, f.secao, f.ancora)}
                className="px-2 py-1 rounded border border-blood-600 text-parchment-100 hover:bg-blood-600 cursor-pointer"
              >
                {f.titulo}
              </button>
            ))}
          </div>
        )}

        <Card>
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h3 className="font-display text-lg text-parchment-100">{secAtual.titulo}</h3>
            <div className="flex gap-1.5">
              <Button variant="ghost" onClick={() => abrirTodas(true)}>Abrir tudo</Button>
              <Button variant="ghost" onClick={() => abrirTodas(false)}>Fechar tudo</Button>
            </div>
          </div>
          <div
            ref={conteudoRef}
            className="roteiro-html"
            dangerouslySetInnerHTML={{ __html: secAtual.html }}
          />
        </Card>

        <Card title="Suas notas deste capítulo">
          <TextArea
            rows={4}
            placeholder="O que aconteceu na mesa, decisões dos jogadores, improvisos..."
            value={notas[capAtual.id] || ""}
            onChange={(t) => definirNota(capAtual.id, t)}
          />
        </Card>

        <div className="flex justify-between gap-2">
          {idxCap > 0 ? (
            <Button onClick={() => ir(capitulos[idxCap - 1].id)}>← {capitulos[idxCap - 1].titulo}</Button>
          ) : <span />}
          {idxCap < capitulos.length - 1 ? (
            <Button onClick={() => ir(capitulos[idxCap + 1].id)}>{capitulos[idxCap + 1].titulo} →</Button>
          ) : <span />}
        </div>
      </section>
    </div>
  );
}
