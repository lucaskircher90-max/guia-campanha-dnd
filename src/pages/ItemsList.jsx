import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card, ConfirmButton, TextInput } from "../components/ui";

export default function ItemsList() {
  const { items, addItem, removeItem } = useData();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const [compendioAberto, setCompendioAberto] = useState(false);
  const [compendioBusca, setCompendioBusca] = useState("");
  const [compendio, setCompendio] = useState(null);
  const [compendioCarregando, setCompendioCarregando] = useState(false);
  const [importados, setImportados] = useState({});

  function handleAdd() {
    const item = addItem();
    navigate(`/itens/${item.id}`);
  }

  function abrirCompendio() {
    setCompendioAberto((v) => !v);
    if (!compendio && !compendioCarregando) {
      setCompendioCarregando(true);
      import("../data/items.json")
        .then((mod) => setCompendio(mod.default))
        .finally(() => setCompendioCarregando(false));
    }
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
