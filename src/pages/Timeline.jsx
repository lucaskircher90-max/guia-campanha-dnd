import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card, Checkbox, ConfirmButton, Field, TextArea, TextInput } from "../components/ui";
import RelationsPanel from "../components/RelationsPanel";
import { MILESTONE_ICONS, MILESTONE_TIPOS } from "../lib/milestoneTypes";

// Ordena sessões numericamente quando possível (sessão "2" antes de "10"),
// e joga marcos sem sessão definida pro final da linha do tempo.
function ordemSessao(sessao) {
  if (!sessao) return Infinity;
  const n = Number(sessao);
  return Number.isNaN(n) ? Infinity - 1 : n;
}

export default function Timeline() {
  const { milestones, addMilestone, updateMilestone, removeMilestone } = useData();
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [tituloRapido, setTituloRapido] = useState("");
  const [sessaoRapida, setSessaoRapida] = useState("");

  const grupos = useMemo(() => {
    const bySessao = {};
    for (const m of milestones) {
      const key = m.sessao ? String(m.sessao) : "";
      (bySessao[key] ??= []).push(m);
    }
    for (const itens of Object.values(bySessao)) {
      itens.sort((a, b) => a.createdAt - b.createdAt);
    }
    return Object.entries(bySessao).sort((a, b) => ordemSessao(a[0]) - ordemSessao(b[0]));
  }, [milestones]);

  const selecionado = milestones.find((m) => m.id === selecionadoId);

  function criarRapido(e) {
    e?.preventDefault();
    if (!tituloRapido.trim()) return;
    const m = addMilestone({ titulo: tituloRapido.trim(), sessao: sessaoRapida });
    setTituloRapido("");
    setSelecionadoId(m.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl text-gold-400">Timeline da História</h2>
        <Link to="/historia" className="text-gold-400 text-sm hover:underline">Ver como lista →</Link>
      </div>

      <Card>
        <form onSubmit={criarRapido} className="flex gap-2 flex-wrap">
          <TextInput
            placeholder="Novo ponto na história..."
            value={tituloRapido}
            onChange={setTituloRapido}
            className="flex-1 min-w-[220px]"
          />
          <input
            type="text"
            placeholder="Sessão nº"
            value={sessaoRapida}
            onChange={(e) => setSessaoRapida(e.target.value)}
            className="w-28"
          />
          <Button type="submit" variant="gold">+ Adicionar</Button>
        </form>
      </Card>

      {milestones.length === 0 ? (
        <Card>
          <p className="text-parchment-300/60 text-sm">
            Nenhum ponto na história ainda. Adicione um acima pra começar a montar a linha do tempo.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="relative flex items-start gap-8 min-w-max pt-6 pb-2">
            <div className="absolute left-0 right-0 top-9 h-px bg-ink-600" />
            {grupos.map(([sessaoKey, itens]) => (
              <div key={sessaoKey || "sem-sessao"} className="relative flex flex-col items-center" style={{ minWidth: 168 }}>
                <span className="text-[10px] uppercase tracking-widest text-parchment-300/50 mb-1.5 whitespace-nowrap">
                  {sessaoKey ? `Sessão ${sessaoKey}` : "Sem sessão"}
                </span>
                <div className="w-3 h-3 rounded-full bg-gold-600 border-2 border-ink-950 z-10 shrink-0" />
                <div className="mt-4 flex flex-col gap-1.5 w-full">
                  {itens.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelecionadoId(m.id === selecionadoId ? null : m.id)}
                      className={`text-left px-2 py-1.5 rounded border text-xs flex items-center gap-1.5 transition-colors ${
                        m.id === selecionadoId
                          ? "bg-gold-600 border-gold-600 text-ink-950 font-semibold"
                          : "border-ink-600 text-parchment-100 hover:border-gold-600/60 bg-ink-900/60"
                      } ${m.concluido ? "opacity-50" : ""}`}
                    >
                      <span className="shrink-0">{MILESTONE_ICONS[m.tipo] || "📍"}</span>
                      <span className={`truncate ${m.concluido ? "line-through" : ""}`}>{m.titulo || "(sem título)"}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selecionado && (
        <Card title="Detalhes">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Field label="Título">
                <TextInput value={selecionado.titulo} onChange={(v) => updateMilestone(selecionado.id, { titulo: v })} />
              </Field>
              <Field label="Sessão">
                <TextInput value={selecionado.sessao} onChange={(v) => updateMilestone(selecionado.id, { sessao: v })} />
              </Field>
            </div>
            <Field label="Tipo">
              <div className="flex gap-1.5 flex-wrap">
                {MILESTONE_TIPOS.map((t) => (
                  <button
                    key={t}
                    onClick={() => updateMilestone(selecionado.id, { tipo: t })}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                      selecionado.tipo === t
                        ? "bg-gold-600 border-gold-600 text-ink-950 font-semibold"
                        : "border-ink-600 text-parchment-300/60 hover:text-parchment-100"
                    }`}
                  >
                    {MILESTONE_ICONS[t]} {t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Descrição / Detalhes">
              <TextArea value={selecionado.descricao} onChange={(v) => updateMilestone(selecionado.id, { descricao: v })} rows={4} />
            </Field>
            <Checkbox
              checked={selecionado.concluido}
              onChange={(v) => updateMilestone(selecionado.id, { concluido: v })}
              label="Concluído"
            />

            <RelationsPanel tipo="milestone" id={selecionado.id} />

            <div className="flex justify-between items-center pt-2 border-t border-ink-700">
              <Button variant="ghost" onClick={() => setSelecionadoId(null)}>Fechar</Button>
              <ConfirmButton
                onConfirm={() => {
                  removeMilestone(selecionado.id);
                  setSelecionadoId(null);
                }}
              >
                Remover
              </ConfirmButton>
            </div>
          </div>
        </Card>
      )}

      <p className="text-[10px] text-parchment-300/30">
        A timeline mostra os mesmos Marcos da aba História, organizados por sessão da esquerda pra direita. Clique num ponto pra ver e editar os detalhes, incluindo as Relações com NPCs, Itens, Locais e outros marcos.
      </p>
    </div>
  );
}
