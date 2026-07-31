import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card, ConfirmButton, TextInput } from "../components/ui";
import { LOOT_TIERS, rollLoot } from "../lib/lootTables";

export default function ItemsList() {
  const { items, addItem, removeItem, players, updatePlayer } = useData();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const [compendioAberto, setCompendioAberto] = useState(false);
  const [compendioBusca, setCompendioBusca] = useState("");
  const [compendio, setCompendio] = useState(null);
  const [compendioCarregando, setCompendioCarregando] = useState(false);
  const [importados, setImportados] = useState({});

  const [lootAberto, setLootAberto] = useState(false);

  function garantirCompendioCarregado() {
    if (!compendio && !compendioCarregando) {
      setCompendioCarregando(true);
      import("../data/items.json")
        .then((mod) => setCompendio(mod.default))
        .finally(() => setCompendioCarregando(false));
    }
  }

  function handleAdd() {
    const item = addItem();
    navigate(`/itens/${item.id}`);
  }

  function abrirCompendio() {
    setLootAberto(false);
    setCompendioAberto((v) => !v);
    garantirCompendioCarregado();
  }

  function abrirLoot() {
    setCompendioAberto(false);
    setLootAberto((v) => !v);
    garantirCompendioCarregado();
  }

  function importar(entry) {
    const { index, ...rest } = entry;
    addItem({ ...rest, homebrew: false });
    setImportados((prev) => ({ ...prev, [index]: true }));
  }

  const compendioResultados = useMemo(() => {
    if (!compendio) return [];
    const q = compendioBusca.trim().toLowerCase();
    const filtrado = q ? compendio.filter((i) => i.nome.toLowerCase().includes(q)) : compendio;
    return filtrado.slice(0, 60);
  }, [compendio, compendioBusca]);

  const filtrados = items.filter((i) =>
    `${i.nome} ${i.tipo} ${i.raridade}`.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl text-gold-400">Itens</h2>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={abrirLoot}>🎲 Gerador de Loot</Button>
          <div className="relative">
            <Button onClick={abrirCompendio}>📖 Compêndio (SRD)</Button>
            {compendioAberto && (
              <div className="absolute right-0 z-10 mt-2 card p-3 w-96 max-w-[90vw]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-wide text-parchment-300/50">
                    {compendio ? `${compendio.length} itens (SRD 5.1)` : "Carregando..."}
                  </p>
                  <button onClick={() => setCompendioAberto(false)} className="text-parchment-300/50 hover:text-parchment-100 text-sm">✕</button>
                </div>
                <TextInput
                  autoFocus
                  placeholder="Buscar item por nome..."
                  value={compendioBusca}
                  onChange={setCompendioBusca}
                />
                <div className="mt-2 max-h-72 overflow-y-auto flex flex-col gap-0.5">
                  {compendioCarregando && <p className="text-xs text-parchment-300/40 py-2">Carregando compêndio...</p>}
                  {!compendioCarregando && compendioResultados.length === 0 && compendio && (
                    <p className="text-xs text-parchment-300/40 py-2">Nenhum item encontrado.</p>
                  )}
                  {compendioResultados.map((entry) => (
                    <div key={entry.index} className="flex items-center justify-between gap-1.5 px-1.5 py-1 rounded hover:bg-ink-700">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-parchment-100">{entry.nome}</span>
                        <span className="block text-[10px] text-parchment-300/40 truncate">
                          {entry.tipo}{entry.raridade ? ` · ${entry.raridade}` : ""}{entry.requerSintonizacao ? " · Sintonização" : ""}
                        </span>
                      </div>
                      <Button
                        className="shrink-0 !px-2 !py-1 !text-xs"
                        onClick={() => importar(entry)}
                      >
                        {importados[entry.index] ? "Importado ✓" : "+ Importar"}
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-parchment-300/30 mt-2 pt-2 border-t border-ink-700">
                  Dados abertos do SRD 5.1 (em inglês). Itens importados ficam editáveis na sua lista.
                </p>
              </div>
            )}
          </div>
          <Button variant="gold" onClick={handleAdd}>+ Novo Item Homebrew</Button>
        </div>
      </div>

      {lootAberto && (
        <LootRoller
          players={players}
          updatePlayer={updatePlayer}
          compendio={compendio}
          compendioCarregando={compendioCarregando}
          homebrewItems={items}
        />
      )}

      <TextInput placeholder="Buscar por nome, tipo ou raridade..." value={busca} onChange={setBusca} className="max-w-sm" />

      {filtrados.length === 0 ? (
        <Card>
          <p className="text-parchment-300/60 text-sm">
            {items.length === 0 ? "Nenhum item cadastrado ainda." : "Nenhum item corresponde à busca."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((item) => (
            <div key={item.id} className="card p-4 flex flex-col gap-2 hover:border-gold-500 transition-colors">
              <Link to={`/itens/${item.id}`} className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-parchment-50">{item.nome}</h3>
                  {item.homebrew && <span className="text-xs text-gold-400" title="Item homebrew">✦</span>}
                </div>
                <p className="text-xs text-parchment-300/60 mb-2">
                  {item.tipo}{item.raridade ? ` · ${item.raridade}` : ""}
                </p>
                {item.requerSintonizacao && (
                  <p className="text-xs text-arcane-400 italic">Requer sintonização</p>
                )}
              </Link>
              <div className="flex justify-end pt-2 border-t border-ink-700">
                <ConfirmButton onConfirm={() => removeItem(item.id)}>Remover</ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LootRoller({ players, updatePlayer, compendio, compendioCarregando, homebrewItems }) {
  const [tier, setTier] = useState("t1");
  const [modo, setModo] = useState("individual");
  const [resultado, setResultado] = useState(null);
  const [jogadorId, setJogadorId] = useState("");
  const [msg, setMsg] = useState("");

  const itemPool = useMemo(() => [...(compendio || []), ...homebrewItems], [compendio, homebrewItems]);

  function rolar() {
    setMsg("");
    setResultado(rollLoot({ tierKey: tier, modo, itemPool }));
  }

  function adicionarAoInventario() {
    const pc = players.find((p) => p.id === jogadorId);
    if (!pc || !resultado) return;

    const moedas = { ...pc.moedas };
    for (const k of ["pc", "pp", "pe", "po", "pl"]) {
      moedas[k] = (Number(moedas[k]) || 0) + (Number(resultado.moedas[k]) || 0);
    }

    const tierLabel = LOOT_TIERS.find((t) => t.key === resultado.tierKey)?.label;
    const linhas = [`— Loot (${tierLabel}, ${resultado.modo === "hoard" ? "Tesouro" : "Individual"}) —`];
    if (resultado.gemas.length) {
      linhas.push(`Gemas/objetos de valor: ${resultado.gemas.map((g) => `${g.nome} (${g.valor} po)`).join(", ")}`);
    }
    if (resultado.itens.length) {
      linhas.push(`Itens mágicos: ${resultado.itens.map((i) => `${i.nome} (${i.raridade})`).join(", ")}`);
    }
    const tesouro = [pc.tesouro, linhas.join("\n")].filter(Boolean).join("\n\n");

    updatePlayer(pc.id, { moedas, tesouro });
    setMsg(`Adicionado ao inventário de ${pc.nome}.`);
  }

  const moedaLabels = { pc: "PC", pp: "PP", pe: "PE", po: "PO", pl: "PL" };

  return (
    <Card title="Gerador de Loot">
      <p className="text-xs text-parchment-300/50 mb-3">
        Tabelas próprias (não são as do Manual do Mestre), seguindo a mesma escala por Nível de Desafio. Itens mágicos vêm do seu compêndio SRD e dos itens homebrew já cadastrados.
      </p>

      <div className="flex flex-wrap gap-4 mb-3">
        <div>
          <span className="text-xs uppercase tracking-wide text-parchment-300/50 block mb-1.5">Nível de Desafio</span>
          <div className="flex gap-1.5 flex-wrap">
            {LOOT_TIERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTier(t.key)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  tier === t.key ? "bg-gold-600 border-gold-600 text-ink-950 font-semibold" : "border-ink-600 text-parchment-300/60 hover:text-parchment-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wide text-parchment-300/50 block mb-1.5">Tipo de Rolagem</span>
          <div className="flex gap-1.5">
            {[
              { key: "individual", label: "Individual" },
              { key: "hoard", label: "Tesouro (Hoard)" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setModo(m.key)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  modo === m.key ? "bg-gold-600 border-gold-600 text-ink-950 font-semibold" : "border-ink-600 text-parchment-300/60 hover:text-parchment-100"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button variant="gold" onClick={rolar}>🎲 Rolar Loot</Button>
      {compendioCarregando && <span className="text-xs text-parchment-300/40 ml-2">Carregando compêndio de itens...</span>}

      {resultado && (
        <div className="mt-4 pt-4 border-t border-ink-700 flex flex-col gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-parchment-300/50 mb-1">Moedas</p>
            <div className="flex gap-3 flex-wrap text-sm">
              {Object.entries(resultado.moedas).filter(([, v]) => v > 0).length === 0 ? (
                <span className="text-parchment-300/40 text-xs">Nenhuma moeda.</span>
              ) : (
                Object.entries(resultado.moedas).filter(([, v]) => v > 0).map(([k, v]) => (
                  <span key={k} className="text-parchment-100"><b>{v}</b> {moedaLabels[k]}</span>
                ))
              )}
            </div>
          </div>

          {resultado.gemas.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-parchment-300/50 mb-1">Gemas / Objetos de Valor</p>
              <ul className="text-sm text-parchment-100 list-disc list-inside">
                {resultado.gemas.map((g, i) => (
                  <li key={i}>{g.nome} <span className="text-parchment-300/50">({g.valor} po)</span></li>
                ))}
              </ul>
            </div>
          )}

          {resultado.itens.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-parchment-300/50 mb-1">Itens Mágicos</p>
              <ul className="text-sm text-parchment-100 list-disc list-inside">
                {resultado.itens.map((it, i) => (
                  <li key={i}>{it.nome} <span className="text-parchment-300/50">({it.raridade})</span></li>
                ))}
              </ul>
            </div>
          )}

          {resultado.modo === "hoard" && resultado.gemas.length === 0 && resultado.itens.length === 0 && (
            <p className="text-xs text-parchment-300/40 italic">Só moedas dessa vez — a sorte não trouxe gemas nem itens mágicos.</p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink-700">
            <select value={jogadorId} onChange={(e) => setJogadorId(e.target.value)} className="text-sm">
              <option value="">Selecione um jogador...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            <Button variant="primary" onClick={adicionarAoInventario} disabled={!jogadorId}>
              + Adicionar ao Inventário
            </Button>
            {msg && <span className="text-xs text-emerald-400">{msg}</span>}
          </div>
        </div>
      )}
    </Card>
  );
}
