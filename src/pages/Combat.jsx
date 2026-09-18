import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card, ConfirmButton, Field, NumberInput, TextInput } from "../components/ui";
import { newCombatant, newEncounterTemplateCombatant } from "../lib/models";
import { ABILITIES, SKILLS, abilityMod, fmtMod, CONDITIONS, CR_TABLE, calcularDificuldadeEncontro } from "../lib/dnd";

export default function Combat() {
  const {
    encounter, setEncounter, players, npcs, addNpc,
    encounterTemplates, addEncounterTemplate, removeEncounterTemplate,
  } = useData();
  const [pickerAberto, setPickerAberto] = useState(false);
  const [bestiarioAberto, setBestiarioAberto] = useState(false);
  const [bestiarioBusca, setBestiarioBusca] = useState("");
  const [bestiarioFonte, setBestiarioFonte] = useState("todos");
  const [bestiarioPreview, setBestiarioPreview] = useState(null);
  const [bestiario, setBestiario] = useState(null);
  const [bestiarioCarregando, setBestiarioCarregando] = useState(false);
  const [salvos, setSalvos] = useState({});
  const [calcAberta, setCalcAberta] = useState(false);
  const [salvarFormAberto, setSalvarFormAberto] = useState(false);
  const [salvarNome, setSalvarNome] = useState("");
  const [salvarDescricao, setSalvarDescricao] = useState("");
  const [templatesAberto, setTemplatesAberto] = useState(false);

  const combatentesOrdenados = [...encounter.combatentes].sort((a, b) => b.iniciativa - a.iniciativa);

  const bestiarioResultados = useMemo(() => {
    if (!bestiario) return [];
    const q = bestiarioBusca.trim().toLowerCase();
    const daFonte = bestiario.filter((m) =>
      bestiarioFonte === "todos" ? true : bestiarioFonte === "rc" ? m.fonte === "Rastro Carmim" : m.fonte !== "Rastro Carmim"
    );
    const filtrado = q ? daFonte.filter((m) => m.nome.toLowerCase().includes(q)) : daFonte;
    return filtrado.slice(0, 60);
  }, [bestiario, bestiarioBusca, bestiarioFonte]);

  const totalRastroCarmim = bestiario ? bestiario.filter((m) => m.fonte === "Rastro Carmim").length : 0;

  function updateCombatant(id, patch) {
    setEncounter((prev) => ({
      ...prev,
      combatentes: prev.combatentes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function removeCombatant(id) {
    setEncounter((prev) => ({ ...prev, combatentes: prev.combatentes.filter((c) => c.id !== id) }));
  }

  function addCombatant(c) {
    setEncounter((prev) => ({ ...prev, combatentes: [...prev.combatentes, c] }));
  }

  function addFromPlayer(pc) {
    addCombatant(
      newCombatant({
        nome: pc.nome,
        tipo: "pj",
        ca: pc.ca,
        pvMax: pc.pvMax,
        pvAtual: pc.pvAtual,
        iniciativa: rollD20() + abilityMod(pc.atributos.des) + (Number(pc.iniciativaExtra) || 0),
        sourceId: pc.id,
      })
    );
    setPickerAberto(false);
  }

  function addFromNpc(npc) {
    addCombatant(
      newCombatant({
        nome: npc.nome,
        tipo: "npc",
        ca: npc.ca,
        pvMax: npc.pvMedio,
        pvAtual: npc.pvMedio,
        iniciativa: rollD20() + abilityMod(npc.atributos?.des ?? 10),
        sourceId: npc.id,
      })
    );
    setPickerAberto(false);
  }

  function addAvulso() {
    addCombatant(newCombatant({ nome: "Novo Combatente", iniciativa: rollD20() }));
    setPickerAberto(false);
  }

  // Bestiário do Rastro Carmim vem primeiro na lista, depois o SRD 5.1.
  function carregarBestiario() {
    if (bestiario || bestiarioCarregando) return;
    setBestiarioCarregando(true);
    Promise.all([import("../data/rastroCarmim.json"), import("../data/monsters.json")])
      .then(([rc, srd]) => setBestiario([...rc.default, ...srd.default]))
      .finally(() => setBestiarioCarregando(false));
  }

  function abrirBestiario() {
    setPickerAberto(false);
    setBestiarioAberto((v) => !v);
    carregarBestiario();
  }

  function addFromMonster(m) {
    addCombatant(
      newCombatant({
        nome: m.nome,
        tipo: "npc",
        ca: m.ca,
        pvMax: m.pvMedio,
        pvAtual: m.pvMedio,
        iniciativa: rollD20() + abilityMod(m.atributos?.des ?? 10),
        notas: `ND ${m.nd}`,
        statBlock: m,
      })
    );
  }

  function salvarMonstroComoNpc(m) {
    addNpc({
      ...m,
      descricao: m.fonte === "Rastro Carmim" ? m.descricao || "" : "Importado do bestiário SRD.",
      importante: false,
    });
    setSalvos((prev) => ({ ...prev, [m.index]: true }));
  }

  function proximoTurno() {
    setEncounter((prev) => {
      const total = prev.combatentes.length;
      if (total === 0) return prev;
      const next = prev.turnoAtual + 1;
      if (next >= total) {
        return { ...prev, turnoAtual: 0, rodada: prev.rodada + 1 };
      }
      return { ...prev, turnoAtual: next };
    });
  }

  function resetarEncontro() {
    setEncounter({ id: encounter.id, nome: "Encontro", rodada: 1, turnoAtual: 0, combatentes: [] });
  }

  function rolarTodasIniciativas() {
    setEncounter((prev) => ({
      ...prev,
      combatentes: prev.combatentes.map((c) => {
        const source = c.tipo === "pj" ? players.find((p) => p.id === c.sourceId) : npcs.find((n) => n.id === c.sourceId);
        const dex = source?.atributos?.des ?? c.statBlock?.atributos?.des ?? 10;
        return { ...c, iniciativa: rollD20() + abilityMod(dex) };
      }),
    }));
  }

  function salvarEncontroAtual() {
    const combatentesMolde = encounter.combatentes.map((c) => {
      const source = c.tipo === "pj" ? players.find((p) => p.id === c.sourceId) : npcs.find((n) => n.id === c.sourceId);
      const dex = source?.atributos?.des ?? c.statBlock?.atributos?.des ?? 10;
      return newEncounterTemplateCombatant({
        nome: c.nome,
        tipo: c.tipo,
        ca: c.ca,
        pvMax: c.pvMax,
        iniciativaMod: abilityMod(dex),
        notas: c.notas,
        sourceId: c.sourceId,
        statBlock: c.statBlock || null,
      });
    });
    addEncounterTemplate({
      nome: salvarNome.trim() || "Encontro sem nome",
      descricao: salvarDescricao.trim(),
      combatentes: combatentesMolde,
    });
    setSalvarNome("");
    setSalvarDescricao("");
    setSalvarFormAberto(false);
  }

  async function carregarTemplate(template) {
    // Encontros salvos antes desta correção não guardaram a ficha: recupera pelo
    // nome (ignorando sufixos como "2" ou "#3") no bestiário, quando não há NPC vinculado.
    const precisaBestiario = template.combatentes.some(
      (tc) => tc.tipo === "npc" && !tc.statBlock && !npcs.some((n) => n.id === tc.sourceId)
    );
    let porNome = null;
    if (precisaBestiario) {
      const [rc, srd] = await Promise.all([import("../data/rastroCarmim.json"), import("../data/monsters.json")]);
      porNome = new Map();
      for (const m of [...srd.default, ...rc.default]) porNome.set(m.nome.toLowerCase(), m);
    }
    const achar = (nome) => {
      if (!porNome) return null;
      const base = nome.trim().toLowerCase();
      return porNome.get(base) || porNome.get(base.replace(/\s*[#(]?\d+\)?$/, "")) || null;
    };

    const novos = template.combatentes.map((tc) => {
      const semNpc = tc.tipo === "npc" && !npcs.some((n) => n.id === tc.sourceId);
      return newCombatant({
        nome: tc.nome,
        tipo: tc.tipo,
        ca: tc.ca,
        pvMax: tc.pvMax,
        pvAtual: tc.pvMax,
        iniciativa: rollD20() + (Number(tc.iniciativaMod) || 0),
        notas: tc.notas,
        sourceId: tc.sourceId,
        statBlock: tc.statBlock || (semNpc ? achar(tc.nome) : null),
      });
    });
    setEncounter({ id: encounter.id, nome: template.nome, rodada: 1, turnoAtual: 0, combatentes: novos });
    setTemplatesAberto(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-2xl text-gold-400">Combate</h2>
          <span className="text-sm text-parchment-300/60">Rodada {encounter.rodada}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={rolarTodasIniciativas}>🎲 Rolar Iniciativas</Button>
          <Button onClick={proximoTurno} variant="primary">Próximo Turno ⏭</Button>
          <Button
            onClick={() => {
              setTemplatesAberto(false);
              setSalvarFormAberto((v) => !v);
            }}
            disabled={encounter.combatentes.length === 0}
          >
            💾 Salvar Encontro
          </Button>
          <ConfirmButton onConfirm={resetarEncontro} confirmLabel="Confirmar fim">Encerrar Combate</ConfirmButton>
        </div>
      </div>

      {salvarFormAberto && (
        <Card title="Salvar Encontro Atual">
          <p className="text-xs text-parchment-300/50 mb-2">
            Salva os combatentes de agora (nome, CA, PV máximo) como um molde reutilizável — sem iniciativa nem PV atual, prontos pra rolar do zero quando o combate acontecer de verdade.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Nome do Encontro">
              <TextInput autoFocus value={salvarNome} onChange={setSalvarNome} placeholder="Ex: Emboscada Zhentarim" />
            </Field>
            <Field label="Descrição (opcional)">
              <TextInput value={salvarDescricao} onChange={setSalvarDescricao} placeholder="Onde/quando esse encontro acontece" />
            </Field>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="gold" onClick={salvarEncontroAtual}>Salvar</Button>
            <Button onClick={() => setSalvarFormAberto(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <Button
            variant="gold"
            onClick={() => {
              setBestiarioAberto(false);
              setPickerAberto((v) => !v);
            }}
          >
            + Adicionar Combatente
          </Button>
          {pickerAberto && (
            <div className="absolute z-10 mt-2 card p-3 w-72 max-h-80 overflow-y-auto">
              <p className="text-xs uppercase tracking-wide text-parchment-300/50 mb-1">Jogadores</p>
              {players.length === 0 && <p className="text-xs text-parchment-300/40 mb-2">Nenhum jogador cadastrado.</p>}
              {players.map((pc) => (
                <button key={pc.id} onClick={() => addFromPlayer(pc)} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-ink-700">
                  {pc.nome}
                </button>
              ))}
              <p className="text-xs uppercase tracking-wide text-parchment-300/50 mt-2 mb-1">NPCs</p>
              {npcs.length === 0 && <p className="text-xs text-parchment-300/40 mb-2">Nenhum NPC cadastrado.</p>}
              {npcs.map((npc) => (
                <button key={npc.id} onClick={() => addFromNpc(npc)} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-ink-700">
                  {npc.nome}
                </button>
              ))}
              <div className="mt-2 pt-2 border-t border-ink-700">
                <Button className="w-full" onClick={addAvulso}>+ Combatente Avulso</Button>
              </div>
            </div>
          )}
        </div>

        <Button
          variant={calcAberta ? "primary" : "default"}
          onClick={() => {
            setCalcAberta((v) => !v);
            carregarBestiario();
          }}
        >
          🧮 Calculadora de Dificuldade
        </Button>

        <div className="relative">
          <Button onClick={abrirBestiario}>🐉 Bestiário</Button>
          {bestiarioAberto && (
            <div className="absolute z-10 mt-2 card p-3 w-[28rem] max-w-[90vw]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wide text-parchment-300/50">
                  {bestiario ? `${bestiario.length} criaturas (${totalRastroCarmim} Rastro Carmim + SRD 5.1)` : "Carregando..."}
                </p>
                <button onClick={() => setBestiarioAberto(false)} className="text-parchment-300/50 hover:text-parchment-100 text-sm">✕</button>
              </div>
              <div className="flex gap-1.5 mb-2">
                {[
                  { key: "todos", label: "Todos" },
                  { key: "rc", label: "Rastro Carmim" },
                  { key: "srd", label: "SRD 5.1" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setBestiarioFonte(f.key)}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                      bestiarioFonte === f.key
                        ? "bg-gold-600 border-gold-600 text-ink-950 font-semibold"
                        : "border-ink-600 text-parchment-300/60 hover:text-parchment-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <TextInput
                autoFocus
                placeholder="Buscar criatura por nome..."
                value={bestiarioBusca}
                onChange={setBestiarioBusca}
              />
              <div className="mt-2 max-h-80 overflow-y-auto flex flex-col gap-0.5">
                {bestiarioCarregando && <p className="text-xs text-parchment-300/40 py-2">Carregando bestiário...</p>}
                {!bestiarioCarregando && bestiarioResultados.length === 0 && bestiario && (
                  <p className="text-xs text-parchment-300/40 py-2">Nenhuma criatura encontrada.</p>
                )}
                {bestiarioResultados.map((m) => (
                  <div key={m.index} className="rounded hover:bg-ink-700/60">
                    <div className="flex items-center justify-between gap-1.5 px-1.5 py-1 group">
                      <button onClick={() => addFromMonster(m)} className="flex-1 text-left min-w-0" title="Adicionar ao combate">
                        <span className="text-sm text-parchment-100">
                          {m.fonte === "Rastro Carmim" && <span className="text-gold-400 mr-1">◆</span>}
                          {m.nome}
                        </span>
                        <span className="block text-[10px] text-parchment-300/40 truncate">
                          ND {m.nd} · CA {m.ca} · PV {m.pvMedio} · {m.fonte === "Rastro Carmim" ? `${m.grupo} — ${m.local}` : m.tipoTamanhoAlinhamento}
                        </span>
                      </button>
                      <button
                        title="Ver a ficha completa antes de adicionar"
                        onClick={() => setBestiarioPreview((cur) => (cur === m.index ? null : m.index))}
                        className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded border transition-colors ${
                          bestiarioPreview === m.index
                            ? "border-gold-500 text-gold-400"
                            : "border-ink-600 text-parchment-300/50 hover:text-gold-400 hover:border-gold-500"
                        }`}
                      >
                        {bestiarioPreview === m.index ? "Fechar" : "Ver"}
                      </button>
                      <button
                        title="Salvar ficha completa na aba de NPCs"
                        onClick={() => salvarMonstroComoNpc(m)}
                        className="text-[10px] shrink-0 px-1.5 py-0.5 rounded border border-ink-600 text-parchment-300/50 hover:text-gold-400 hover:border-gold-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {salvos[m.index] ? "Salvo ✓" : "+ NPC"}
                      </button>
                    </div>
                    {bestiarioPreview === m.index && (
                      <div className="px-2 pb-2 pt-1 border-t border-ink-700">
                        <StatBlockDetail data={m} />
                        <Button variant="gold" className="mt-2 !text-xs !px-2 !py-1" onClick={() => addFromMonster(m)}>
                          + Adicionar ao combate
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-parchment-300/30 mt-2 pt-2 border-t border-ink-700">
                ◆ = criaturas do Rastro Carmim (em português). SRD 5.1 em inglês. Clique no nome para adicionar direto ao combate, ou em “Ver” para conferir a ficha antes.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            onClick={() => {
              setPickerAberto(false);
              setBestiarioAberto(false);
              setTemplatesAberto((v) => !v);
            }}
          >
            📂 Encontros Salvos {encounterTemplates.length > 0 ? `(${encounterTemplates.length})` : ""}
          </Button>
          {templatesAberto && (
            <div className="absolute z-10 mt-2 card p-3 w-96 max-w-[90vw] max-h-96 overflow-y-auto">
              {encounterTemplates.length === 0 ? (
                <p className="text-xs text-parchment-300/40 py-2">
                  Nenhum encontro salvo ainda. Monte os combatentes abaixo e use "💾 Salvar Encontro" para guardar um molde.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {encounterTemplates.map((t) => (
                    <div key={t.id} className="border border-ink-700 rounded p-2">
                      <p className="text-sm font-display text-parchment-50">{t.nome}</p>
                      {t.descricao && <p className="text-xs text-parchment-300/50 italic">{t.descricao}</p>}
                      <p className="text-[10px] text-parchment-300/40 mt-0.5">
                        {t.combatentes.length} combatente{t.combatentes.length === 1 ? "" : "s"}: {t.combatentes.map((c) => c.nome).join(", ")}
                      </p>
                      <div className="flex gap-1.5 mt-2">
                        {encounter.combatentes.length > 0 ? (
                          <ConfirmButton onConfirm={() => carregarTemplate(t)} confirmLabel="Substituir combate atual">
                            Carregar
                          </ConfirmButton>
                        ) : (
                          <Button className="!text-xs !px-2 !py-1" variant="gold" onClick={() => carregarTemplate(t)}>
                            Carregar
                          </Button>
                        )}
                        <ConfirmButton onConfirm={() => removeEncounterTemplate(t.id)} confirmLabel="Confirmar">
                          Remover
                        </ConfirmButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {calcAberta && (
        <DifficultyCalculator
          players={players}
          npcs={npcs}
          bestiario={bestiario}
          bestiarioCarregando={bestiarioCarregando}
        />
      )}

      {combatentesOrdenados.length === 0 ? (
        <Card>
          <p className="text-parchment-300/60 text-sm">Nenhum combatente. Adicione jogadores, NPCs ou combatentes avulsos para começar o combate.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {combatentesOrdenados.map((c, i) => (
            <CombatantRow
              key={c.id}
              combatant={c}
              isCurrent={i === encounter.turnoAtual}
              onUpdate={(patch) => updateCombatant(c.id, patch)}
              onRemove={() => removeCombatant(c.id)}
              players={players}
              npcs={npcs}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function rollD20() {
  return 1 + Math.floor(Math.random() * 20);
}

let calcRowSeq = 0;
function nextRowId() {
  calcRowSeq += 1;
  return `row-${calcRowSeq}`;
}

function xpForCr(cr) {
  const found = CR_TABLE.find((r) => r.cr === String(cr ?? "").trim());
  return found ? found.xp : 0;
}

// Aproximação comum entre mestres: CR inteiro ~ nível de personagem equivalente
// para fins de limiar de XP. Frações de CR (1/8, 1/4, 1/2) contam como nível 1.
function nivelEquivalenteFromCr(cr) {
  const s = String(cr ?? "").trim();
  if (!s || s.includes("/")) return 1;
  const n = Number(s);
  return Number.isFinite(n) ? Math.min(20, Math.max(1, Math.round(n))) : 1;
}

const DIFICULDADE_STYLE = {
  Trivial: "text-parchment-300/60 border-ink-600",
  "Fácil": "text-emerald-400 border-emerald-600",
  "Médio": "text-gold-400 border-gold-600",
  "Difícil": "text-orange-400 border-orange-600",
  Mortal: "text-blood-500 border-blood-500",
};

function DifficultyCalculator({ players, npcs, bestiario, bestiarioCarregando }) {
  const [party, setParty] = useState([{ id: nextRowId(), nivel: 1, quantidade: 4 }]);
  const [aliados, setAliados] = useState([]);
  const [buscaAliado, setBuscaAliado] = useState("");
  const [inimigos, setInimigos] = useState([]);
  const [busca, setBusca] = useState("");

  const personagensParaCalculo = useMemo(
    () => [
      ...party.map((r) => ({ nivel: r.nivel, quantidade: r.quantidade })),
      ...aliados.map((r) => ({ nivel: r.nivelEquivalente, quantidade: r.quantidade })),
    ],
    [party, aliados]
  );

  const resultado = useMemo(
    () => calcularDificuldadeEncontro(personagensParaCalculo, inimigos),
    [personagensParaCalculo, inimigos]
  );

  function importarJogadores() {
    if (players.length === 0) return;
    const porNivel = {};
    for (const pc of players) {
      const nivel = Math.min(20, Math.max(1, Number(pc.nivel) || 1));
      porNivel[nivel] = (porNivel[nivel] || 0) + 1;
    }
    setParty(
      Object.entries(porNivel)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([nivel, quantidade]) => ({ id: nextRowId(), nivel: Number(nivel), quantidade }))
    );
  }

  function addPartyRow() {
    setParty((prev) => [...prev, { id: nextRowId(), nivel: 1, quantidade: 1 }]);
  }
  function updatePartyRow(id, patch) {
    setParty((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removePartyRow(id) {
    setParty((prev) => prev.filter((r) => r.id !== id));
  }

  function addAliadoRow(overrides = {}) {
    setAliados((prev) => [...prev, { id: nextRowId(), nome: "", nivelEquivalente: 1, quantidade: 1, ...overrides }]);
  }
  function updateAliadoRow(id, patch) {
    setAliados((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeAliadoRow(id) {
    setAliados((prev) => prev.filter((r) => r.id !== id));
  }
  function addAliadoFromNpc(npc) {
    addAliadoRow({ nome: npc.nome, nivelEquivalente: nivelEquivalenteFromCr(npc.nd) });
    setBuscaAliado("");
  }
  function addAliadoFromMonster(m) {
    addAliadoRow({ nome: m.nome, nivelEquivalente: nivelEquivalenteFromCr(m.nd) });
    setBuscaAliado("");
  }

  const buscaAliadoResultados = useMemo(() => {
    const q = buscaAliado.trim().toLowerCase();
    if (!q) return { npcs: [], monstros: [] };
    return {
      npcs: npcs.filter((n) => n.nome.toLowerCase().includes(q)).slice(0, 8),
      monstros: (bestiario || []).filter((m) => m.nome.toLowerCase().includes(q)).slice(0, 8),
    };
  }, [buscaAliado, npcs, bestiario]);

  function addEnemyRow(overrides = {}) {
    setInimigos((prev) => [...prev, { id: nextRowId(), nome: "", xp: 0, quantidade: 1, ...overrides }]);
  }
  function updateEnemyRow(id, patch) {
    setInimigos((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeEnemyRow(id) {
    setInimigos((prev) => prev.filter((r) => r.id !== id));
  }

  function addEnemyFromNpc(npc) {
    addEnemyRow({ nome: npc.nome, xp: Number(npc.pe) || xpForCr(npc.nd) });
    setBusca("");
  }
  function addEnemyFromMonster(m) {
    addEnemyRow({ nome: m.nome, xp: Number(m.pe) || xpForCr(m.nd) });
    setBusca("");
  }

  const buscaResultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return { npcs: [], monstros: [] };
    return {
      npcs: npcs.filter((n) => n.nome.toLowerCase().includes(q)).slice(0, 8),
      monstros: (bestiario || []).filter((m) => m.nome.toLowerCase().includes(q)).slice(0, 8),
    };
  }, [busca, npcs, bestiario]);

  const chipClass = DIFICULDADE_STYLE[resultado.dificuldade] || DIFICULDADE_STYLE.Trivial;

  return (
    <Card title="Calculadora de Dificuldade do Encontro">
      <p className="text-xs text-parchment-300/50 mb-3">
        Baseado nas tabelas oficiais do Manual do Mestre (limiares de XP por nível e multiplicador por quantidade de inimigos).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grupo */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-display text-gold-400">Grupo de Jogadores</h3>
            <Button className="!text-xs !px-2 !py-1" onClick={importarJogadores} disabled={players.length === 0}>
              Importar Jogadores
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {party.map((row) => (
              <div key={row.id} className="flex items-center gap-1.5">
                <Field label="Nível" className="w-20">
                  <NumberInput
                    value={row.nivel}
                    onChange={(v) => updatePartyRow(row.id, { nivel: Math.min(20, Math.max(1, v || 1)) })}
                    className="text-center"
                  />
                </Field>
                <Field label="Qtd. Personagens" className="flex-1">
                  <NumberInput
                    value={row.quantidade}
                    onChange={(v) => updatePartyRow(row.id, { quantidade: Math.max(0, v || 0) })}
                    className="text-center"
                  />
                </Field>
                <Button variant="danger" className="!mt-4" onClick={() => removePartyRow(row.id)}>✕</Button>
              </div>
            ))}
          </div>
          <Button className="mt-2 w-full" onClick={addPartyRow}>+ Adicionar Nível</Button>

          <div className="mt-4 pt-3 border-t border-ink-700">
            <h3 className="text-sm font-display text-gold-400 mb-2">NPCs Aliados (opcional)</h3>
            <div className="relative mb-2">
              <TextInput
                placeholder="Buscar NPC ou monstro para adicionar como aliado..."
                value={buscaAliado}
                onChange={setBuscaAliado}
              />
              {buscaAliado.trim() && (
                <div className="absolute z-10 mt-1 card p-2 w-full max-h-56 overflow-y-auto">
                  {bestiarioCarregando && <p className="text-xs text-parchment-300/40 py-1">Carregando bestiário...</p>}
                  {buscaAliadoResultados.npcs.length === 0 && buscaAliadoResultados.monstros.length === 0 && !bestiarioCarregando && (
                    <p className="text-xs text-parchment-300/40 py-1">Nenhum resultado.</p>
                  )}
                  {buscaAliadoResultados.npcs.map((n) => (
                    <button key={n.id} onClick={() => addAliadoFromNpc(n)} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-ink-700">
                      {n.nome} <span className="text-[10px] text-parchment-300/40">NPC{n.nd ? ` · ND ${n.nd}` : ""}</span>
                    </button>
                  ))}
                  {buscaAliadoResultados.monstros.map((m) => (
                    <button key={m.index} onClick={() => addAliadoFromMonster(m)} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-ink-700">
                      {m.nome} <span className="text-[10px] text-parchment-300/40">ND {m.nd}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {aliados.map((row) => (
                <div key={row.id} className="flex items-center gap-1.5">
                  <Field label="Nome" className="flex-1">
                    <TextInput value={row.nome} onChange={(v) => updateAliadoRow(row.id, { nome: v })} />
                  </Field>
                  <Field label="Nível Equiv." className="w-20">
                    <NumberInput
                      value={row.nivelEquivalente}
                      onChange={(v) => updateAliadoRow(row.id, { nivelEquivalente: Math.min(20, Math.max(1, v || 1)) })}
                      className="text-center"
                    />
                  </Field>
                  <Field label="Qtd." className="w-16">
                    <NumberInput value={row.quantidade} onChange={(v) => updateAliadoRow(row.id, { quantidade: Math.max(0, v || 0) })} className="text-center" />
                  </Field>
                  <Button variant="danger" className="!mt-4" onClick={() => removeAliadoRow(row.id)}>✕</Button>
                </div>
              ))}
              {aliados.length === 0 && <p className="text-xs text-parchment-300/40">Nenhum aliado adicionado.</p>}
            </div>
            <Button className="mt-2 w-full" onClick={() => addAliadoRow()}>+ Adicionar Aliado Manual</Button>
            <p className="text-[10px] text-parchment-300/30 mt-2">
              Aliados entram no cálculo como "personagens extras": somam ao limiar de XP do grupo e ao tamanho do grupo (que ajusta o multiplicador). O nível equivalente é sugerido a partir do ND do NPC/monstro — ajuste livremente.
            </p>
          </div>
        </div>

        {/* Inimigos */}
        <div>
          <h3 className="text-sm font-display text-gold-400 mb-2">Inimigos</h3>
          <div className="relative mb-2">
            <TextInput
              placeholder="Buscar NPC ou monstro do bestiário para adicionar..."
              value={busca}
              onChange={setBusca}
            />
            {busca.trim() && (
              <div className="absolute z-10 mt-1 card p-2 w-full max-h-56 overflow-y-auto">
                {bestiarioCarregando && <p className="text-xs text-parchment-300/40 py-1">Carregando bestiário...</p>}
                {buscaResultados.npcs.length === 0 && buscaResultados.monstros.length === 0 && !bestiarioCarregando && (
                  <p className="text-xs text-parchment-300/40 py-1">Nenhum resultado.</p>
                )}
                {buscaResultados.npcs.map((n) => (
                  <button key={n.id} onClick={() => addEnemyFromNpc(n)} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-ink-700">
                    {n.nome} <span className="text-[10px] text-parchment-300/40">NPC{n.nd ? ` · ND ${n.nd}` : ""}</span>
                  </button>
                ))}
                {buscaResultados.monstros.map((m) => (
                  <button key={m.index} onClick={() => addEnemyFromMonster(m)} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-ink-700">
                    {m.nome} <span className="text-[10px] text-parchment-300/40">ND {m.nd}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {inimigos.map((row) => (
              <div key={row.id} className="flex items-center gap-1.5">
                <Field label="Nome" className="flex-1">
                  <TextInput value={row.nome} onChange={(v) => updateEnemyRow(row.id, { nome: v })} />
                </Field>
                <Field label="XP" className="w-20">
                  <NumberInput value={row.xp} onChange={(v) => updateEnemyRow(row.id, { xp: Math.max(0, v || 0) })} className="text-center" />
                </Field>
                <Field label="Qtd." className="w-16">
                  <NumberInput value={row.quantidade} onChange={(v) => updateEnemyRow(row.id, { quantidade: Math.max(0, v || 0) })} className="text-center" />
                </Field>
                <Button variant="danger" className="!mt-4" onClick={() => removeEnemyRow(row.id)}>✕</Button>
              </div>
            ))}
            {inimigos.length === 0 && <p className="text-xs text-parchment-300/40">Nenhum inimigo adicionado ainda.</p>}
          </div>
          <Button className="mt-2 w-full" onClick={() => addEnemyRow()}>+ Adicionar Inimigo Manual</Button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-ink-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className={`px-4 py-2 rounded border text-center ${chipClass}`}>
            <div className="text-[10px] uppercase tracking-wide opacity-70">Dificuldade</div>
            <div className="font-display text-xl">{resultado.dificuldade}</div>
          </div>
          <div className="text-xs text-parchment-300/60 flex flex-col gap-0.5">
            <span>XP dos inimigos: <b className="text-parchment-100">{resultado.xpTotalInimigos}</b> ({resultado.totalInimigos} inimigo{resultado.totalInimigos === 1 ? "" : "s"})</span>
            <span>Multiplicador (qtd. de inimigos × tamanho do grupo): <b className="text-parchment-100">×{resultado.multiplicador}</b></span>
            <span>XP ajustado do encontro: <b className="text-parchment-100">{resultado.xpAjustado}</b> — comparado ao grupo de {resultado.totalPersonagens} {resultado.totalPersonagens === 1 ? "personagem" : "personagens"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {["facil", "medio", "dificil", "mortal"].map((key) => {
            const labels = { facil: "Fácil", medio: "Médio", dificil: "Difícil", mortal: "Mortal" };
            const ativo =
              (key === "facil" && resultado.dificuldade === "Fácil") ||
              (key === "medio" && resultado.dificuldade === "Médio") ||
              (key === "dificil" && resultado.dificuldade === "Difícil") ||
              (key === "mortal" && resultado.dificuldade === "Mortal");
            return (
              <span
                key={key}
                className={`text-[10px] px-2 py-1 rounded-full border ${ativo ? "bg-ink-700 border-gold-500 text-gold-400" : "border-ink-600 text-parchment-300/40"}`}
              >
                {labels[key]}: {resultado.totais[key]} XP
              </span>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function CombatantRow({ combatant: c, isCurrent, onUpdate, onRemove, players, npcs }) {
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const pvPercent = c.pvMax > 0 ? Math.max(0, Math.min(100, (c.pvAtual / c.pvMax) * 100)) : 0;
  const pvColor = pvPercent > 50 ? "bg-emerald-600" : pvPercent > 25 ? "bg-gold-600" : "bg-blood-600";

  const player = c.tipo === "pj" && c.sourceId ? players.find((p) => p.id === c.sourceId) : null;
  const npc = c.tipo === "npc" && c.sourceId ? npcs.find((n) => n.id === c.sourceId) : null;
  const temFicha = !!(player || npc || c.statBlock);

  return (
    <div className={`card p-3 ${isCurrent ? "border-gold-500 ring-1 ring-gold-500" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-16">
          <Field label="Ini.">
            <NumberInput value={c.iniciativa} onChange={(v) => onUpdate({ iniciativa: v })} className="text-center" />
          </Field>
        </div>

        <div className="flex-1 min-w-[140px]">
          <TextInput value={c.nome} onChange={(v) => onUpdate({ nome: v })} className="!text-base font-display" />
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${c.tipo === "pj" ? "border-arcane-400 text-arcane-400" : "border-blood-500 text-blood-500"}`}>
            {c.tipo === "pj" ? "Jogador" : "NPC/Inimigo"}
          </span>
        </div>

        <div className="w-16">
          <Field label="CA">
            <NumberInput value={c.ca} onChange={(v) => onUpdate({ ca: v })} className="text-center" />
          </Field>
        </div>

        <div className="w-40">
          <Field label={`PV ${c.pvAtual}/${c.pvMax}`}>
            <div className="h-2 rounded-full bg-ink-900 overflow-hidden mb-1">
              <div className={`h-full ${pvColor}`} style={{ width: `${pvPercent}%` }} />
            </div>
            <div className="flex gap-1 items-center">
              <Button className="!px-2 !py-0.5" onClick={() => onUpdate({ pvAtual: Math.max(0, c.pvAtual - 1) })}>-1</Button>
              <Button className="!px-2 !py-0.5" onClick={() => onUpdate({ pvAtual: Math.max(0, c.pvAtual - 5) })}>-5</Button>
              <NumberInput value={c.pvAtual} onChange={(v) => onUpdate({ pvAtual: v })} className="!w-14 text-center" />
              <Button className="!px-2 !py-0.5" onClick={() => onUpdate({ pvAtual: Math.min(c.pvMax, c.pvAtual + 1) })}>+1</Button>
            </div>
          </Field>
        </div>

        <Button
          variant={detalhesAberto ? "primary" : "default"}
          title={temFicha ? "Ver ficha / stat block" : "Nenhuma ficha vinculada a este combatente"}
          onClick={() => setDetalhesAberto((v) => !v)}
        >
          {detalhesAberto ? "▲ Ficha" : "▼ Ficha"}
        </Button>
        <Button variant="danger" onClick={onRemove}>✕</Button>
      </div>

      <div className="mt-2 pt-2 border-t border-ink-700 flex flex-wrap items-center gap-1.5">
        {CONDITIONS.map((cond) => {
          const ativo = c.condicoes?.includes(cond);
          return (
            <button
              key={cond}
              onClick={() =>
                onUpdate({
                  condicoes: ativo ? c.condicoes.filter((x) => x !== cond) : [...(c.condicoes || []), cond],
                })
              }
              className={`px-1.5 py-0.5 rounded-full text-[10px] border transition-colors ${
                ativo ? "bg-blood-600 border-blood-500 text-parchment-50" : "border-ink-600 text-parchment-300/50 hover:text-parchment-100"
              }`}
            >
              {cond}
            </button>
          );
        })}
      </div>

      {detalhesAberto && (
        <div className="mt-2 pt-2 border-t border-ink-700">
          {player && <PlayerDetail player={player} />}
          {npc && <StatBlockDetail data={npc} sheetLink={`/npcs/${npc.id}`} />}
          {!player && !npc && c.statBlock && <StatBlockDetail data={c.statBlock} />}
          {!temFicha && (
            <p className="text-xs text-parchment-300/40">
              Combatente avulso, sem ficha de jogador/NPC vinculada — apenas os campos acima estão disponíveis.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerDetail({ player: p }) {
  const proficientSkills = SKILLS.filter((s) => p.pericias?.[s.key]?.proficient);
  const ataques = p.ataques || [];
  return (
    <div className="text-sm flex flex-col gap-2">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <span className="text-xs text-parchment-300/50">
          {[p.raca, p.classe, p.nivel ? `Nível ${p.nivel}` : ""].filter(Boolean).join(" · ")}
        </span>
        <Link to={`/jogadores/${p.id}`} className="text-xs text-gold-400 hover:underline">Abrir ficha completa →</Link>
      </div>

      <div className="grid grid-cols-6 gap-1 text-center text-xs">
        {ABILITIES.map((a) => (
          <div key={a.key} className="rounded border border-ink-700 py-1">
            <div className="uppercase text-parchment-300/50">{a.key}</div>
            <div className="text-parchment-100">{p.atributos?.[a.key] ?? 10}</div>
            <div className="text-gold-400">{fmtMod(abilityMod(p.atributos?.[a.key] ?? 10))}</div>
          </div>
        ))}
      </div>

      {ataques.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-parchment-300/50 mb-1">Ataques</p>
          <div className="flex flex-col gap-0.5">
            {ataques.map((atk, i) => (
              <p key={i} className="text-xs text-parchment-200">
                <b>{atk.nome || "Ataque"}</b> {atk.bonus && `· ${atk.bonus} para acertar`} {atk.dano && `· ${atk.dano}`}
              </p>
            ))}
          </div>
        </div>
      )}

      {proficientSkills.length > 0 && (
        <p className="text-xs text-parchment-300/60">
          <span className="text-parchment-300/50">Perícias: </span>
          {proficientSkills.map((s) => s.label).join(", ")}
        </p>
      )}

      {p.conjuracao?.classeConjuradora && (
        <p className="text-xs text-parchment-300/60">
          <span className="text-parchment-300/50">Conjuração ({p.conjuracao.classeConjuradora}): </span>
          CD {p.conjuracao.cd || "—"} · Ataque {p.conjuracao.bonusAtaque || "—"}
        </p>
      )}

      {p.caracteristicasHabilidades && (
        <div>
          <p className="text-xs uppercase tracking-wide text-parchment-300/50 mb-0.5">Características / Habilidades</p>
          <p className="text-xs text-parchment-200 whitespace-pre-wrap">{p.caracteristicasHabilidades}</p>
        </div>
      )}
    </div>
  );
}

function StatBlockDetail({ data: n, sheetLink }) {
  return (
    <div className="text-sm flex flex-col gap-2">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <span className="text-xs text-parchment-300/50">
          {n.tipoTamanhoAlinhamento}{n.deslocamento ? ` · Desl. ${n.deslocamento}` : ""}{n.nd ? ` · ND ${n.nd}` : ""}
        </span>
        {sheetLink && <Link to={sheetLink} className="text-xs text-gold-400 hover:underline">Abrir ficha completa →</Link>}
      </div>

      <div className="grid grid-cols-6 gap-1 text-center text-xs">
        {ABILITIES.map((a) => (
          <div key={a.key} className="rounded border border-ink-700 py-1">
            <div className="uppercase text-parchment-300/50">{a.key}</div>
            <div className="text-parchment-100">{n.atributos?.[a.key] ?? 10}</div>
            <div className="text-gold-400">{fmtMod(abilityMod(n.atributos?.[a.key] ?? 10))}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-parchment-300/60 flex flex-col gap-0.5">
        {n.salvaguardas && <p><span className="text-parchment-300/50">Resistências: </span>{n.salvaguardas}</p>}
        {n.pericias && <p><span className="text-parchment-300/50">Perícias: </span>{n.pericias}</p>}
        {n.resistenciasDano && <p><span className="text-parchment-300/50">Resistência a Dano: </span>{n.resistenciasDano}</p>}
        {n.imunidadesDano && <p><span className="text-parchment-300/50">Imunidade a Dano: </span>{n.imunidadesDano}</p>}
        {n.vulnerabilidadesDano && <p><span className="text-parchment-300/50">Vulnerabilidade a Dano: </span>{n.vulnerabilidadesDano}</p>}
        {n.imunidadesCondicao && <p><span className="text-parchment-300/50">Imunidade a Condição: </span>{n.imunidadesCondicao}</p>}
        {n.sentidos && <p><span className="text-parchment-300/50">Sentidos: </span>{n.sentidos}</p>}
        {n.idiomas && <p><span className="text-parchment-300/50">Idiomas: </span>{n.idiomas}</p>}
      </div>

      <StatBlockList label="Traços" items={n.tracos} />
      <StatBlockList label="Ações" items={n.acoes} />
      <StatBlockList label="Ações Lendárias" items={n.acoesLendarias} />
      <StatBlockList label="Reações" items={n.reacoes} />

      {(n.local || n.baseadoEm) && (
        <p className="text-[11px] text-parchment-300/50">
          {n.local && <span>📍 {n.grupo ? `${n.grupo} — ` : ""}{n.local}</span>}
          {n.local && n.baseadoEm && " · "}
          {n.baseadoEm && (
            <span>{/^(Ficha|Criatura|Reaproveita)/.test(n.baseadoEm) ? n.baseadoEm : `baseado em ${n.baseadoEm}`}</span>
          )}
        </p>
      )}
      {n.descricao && <p className="text-xs text-parchment-200 italic">{n.descricao}</p>}
      {n.notasMestre && (
        <div className="rounded border border-ink-700 bg-ink-900/60 p-2">
          <p className="text-[10px] uppercase tracking-wide text-parchment-300/50 mb-0.5">Notas do Mestre</p>
          <p className="text-xs text-parchment-200 whitespace-pre-wrap">{n.notasMestre}</p>
        </div>
      )}
    </div>
  );
}

function StatBlockList({ label, items }) {
  const list = items || [];
  if (list.length === 0) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-parchment-300/50 mb-1">{label}</p>
      <div className="flex flex-col gap-1">
        {list.map((item, i) => (
          <p key={i} className="text-xs text-parchment-200">
            <b className="italic">{item.nome}.</b> {item.descricao}
          </p>
        ))}
      </div>
    </div>
  );
}
