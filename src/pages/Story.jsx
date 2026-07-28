import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { Button, Card, Checkbox, Field, TextArea, TextInput } from "../components/ui";

const TIPOS = ["Marco", "Revelação", "Combate", "NPC", "Local", "Item"];

export default function Story() {
  const { milestones, addMilestone, updateMilestone, removeMilestone } = useData();
  const [tituloRapido, setTituloRapido] = useState("");
  const [tipoRapido, setTipoRapido] = useState("Marco");
  const [sessaoRapida, setSessaoRapida] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [filtroSessao, setFiltroSessao] = useState("");

  function criarRapido(e) {
    e?.preventDefault();
    if (!tituloRapido.trim()) return;
    const m = addMilestone({ titulo: tituloRapido.trim(), tipo: tipoRapido, sessao: sessaoRapida });
    setTituloRapido("");
    setExpandido(m.id);
  }

  const grupos = useMemo(() => {
    const filtrados = filtroSessao
      ? milestones.filter((m) => String(m.sessao) === String(filtroSessao))
      : milestones;
    const bySessao = {};
    for (const m of filtrados) {
      const key = m.sessao ? `Sessão ${m.sessao}` : "Sem sessão definida";
      (bySessao[key] ??= []).push(m);
    }
    return Object.entries(bySessao).sort((a, b) => b[1][0].createdAt - a[1][0].createdAt);
  }, [milestones, filtroSessao]);

  const sessoesExistentes = useMemo(
    () => [...new Set(milestones.map((m) => m.sessao).filter(Boolean))].sort((a, b) => b - a),
    [milestones]
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-2xl text-gold-400">História da Campanha</h2>

      <Card>
        <form onSubmit={criarRapido} className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <TextInput
              autoFocus
              placeholder="Digite um marco e aperte Enter para salvar rapidamente..."
              value={tituloRapido}
              onChange={setTituloRapido}
              className="flex-1 min-w-[240px]"
            />
            <input
              type="text"
              placeholder="Sessão nº"
              value={sessaoRapida}
              onChange={(e) => setSessaoRapida(e.target.value)}
              className="w-28"
            />
            <Button type="submit" variant="gold">+ Adicionar</Button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {TIPOS.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTipoRapido(t)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  tipoRapido === t
                    ? "bg-gold-600 border-gold-600 text-ink-950 font-semibold"
                    : "border-ink-600 text-parchment-300/60 hover:text-parchment-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {sessoesExistentes.length > 0 && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-parchment-300/60">Filtrar por sessão:</span>
          <button
            onClick={() => setFiltroSessao("")}
            className={`px-2 py-0.5 rounded-full text-xs border ${!filtroSessao ? "bg-ink-700 border-gold-500" : "border-ink-600 text-parchment-300/60"}`}
          >
            Todas
          </button>
          {sessoesExistentes.map((s) => (
            <button
              key={s}
              onClick={() => setFiltroSessao(String(s))}
              className={`px-2 py-0.5 rounded-full text-xs border ${String(filtroSessao) === String(s) ? "bg-ink-700 border-gold-500" : "border-ink-600 text-parchment-300/60"}`}
            >
              Sessão {s}
            </button>
          ))}
        </div>
      )}

      {milestones.length === 0 ? (
        <Card>
          <p className="text-parchment-300/60 text-sm">
            Nenhum marco registrado ainda. Use o campo acima para começar — leva menos de 5 segundos.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map(([sessao, itens]) => (
            <div key={sessao}>
              <h3 className="font-display text-gold-400/80 text-sm uppercase tracking-widest mb-2">{sessao}</h3>
              <div className="flex flex-col gap-2">
                {itens.map((m) => (
                  <MilestoneRow
                    key={m.id}
                    milestone={m}
                    expanded={expandido === m.id}
                    onToggleExpand={() => setExpandido(expandido === m.id ? null : m.id)}
                    onUpdate={(patch) => updateMilestone(m.id, patch)}
                    onRemove={() => removeMilestone(m.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MilestoneRow({ milestone, expanded, onToggleExpand, onUpdate, onRemove }) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2">
        <Checkbox checked={milestone.concluido} onChange={(v) => onUpdate({ concluido: v })} />
        <button onClick={onToggleExpand} className="flex-1 text-left flex items-center gap-2 min-w-0">
          <span className={`truncate ${milestone.concluido ? "line-through text-parchment-300/40" : "text-parchment-100"}`}>
            {milestone.titulo}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-ink-600 text-parchment-300/50 shrink-0">
            {milestone.tipo}
          </span>
        </button>
        <Button variant="danger" onClick={onRemove}>✕</Button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-ink-700 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Título">
              <TextInput value={milestone.titulo} onChange={(v) => onUpdate({ titulo: v })} />
            </Field>
            <Field label="Sessão">
              <TextInput value={milestone.sessao} onChange={(v) => onUpdate({ sessao: v })} />
            </Field>
          </div>
          <Field label="Tipo">
            <div className="flex gap-1.5 flex-wrap">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdate({ tipo: t })}
                  className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                    milestone.tipo === t
                      ? "bg-gold-600 border-gold-600 text-ink-950 font-semibold"
                      : "border-ink-600 text-parchment-300/60 hover:text-parchment-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Descrição / Detalhes">
            <TextArea value={milestone.descricao} onChange={(v) => onUpdate({ descricao: v })} rows={4} />
          </Field>
        </div>
      )}
    </div>
  );
}
