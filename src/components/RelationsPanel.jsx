import { useState } from "react";
import { useData } from "../context/DataContext";
import { Button, Card, Field, TextInput } from "./ui";
import { ENTITY_TYPES, entityLabel, entityOptions, linksFor, otherSide } from "../lib/links";

// Painel reutilizável de "Relações" — mostra e permite criar vínculos entre
// a entidade atual (tipo + id) e qualquer outra da campanha (NPC, Marco,
// Item, Mapa/Local, Jogador). É a mesma base de dados usada pela timeline e
// pelo grafo de conexões.
export default function RelationsPanel({ tipo, id, title = "Relações" }) {
  const data = useData();
  const { links, addLink, removeLink } = data;
  const [aberto, setAberto] = useState(false);
  const [novoTipo, setNovoTipo] = useState(tipo);
  const [novoId, setNovoId] = useState("");
  const [rotulo, setRotulo] = useState("");

  const relacionados = linksFor(links, tipo, id);
  const opcoes = entityOptions(data, novoTipo).filter((o) => !(novoTipo === tipo && o.id === id));

  function adicionar() {
    if (!novoId) return;
    addLink({ deTipo: tipo, deId: id, paraTipo: novoTipo, paraId: novoId, rotulo: rotulo.trim() });
    setNovoId("");
    setRotulo("");
    setAberto(false);
  }

  return (
    <Card title={title}>
      {relacionados.length === 0 && !aberto && (
        <p className="text-xs text-parchment-300/50 mb-2">Nenhuma relação criada ainda.</p>
      )}

      {relacionados.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-2">
          {relacionados.map((l) => {
            const other = otherSide(l, tipo, id);
            return (
              <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">
                  {ENTITY_TYPES[other.tipo]?.icon} {entityLabel(data, other.tipo, other.id)}
                  {l.rotulo && <span className="text-parchment-300/50 text-xs"> — {l.rotulo}</span>}
                </span>
                <button
                  onClick={() => removeLink(l.id)}
                  className="text-parchment-300/40 hover:text-blood-500 text-xs shrink-0 cursor-pointer"
                  title="Remover relação"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {aberto ? (
        <div className="flex flex-col gap-2 pt-2 border-t border-ink-700">
          <Field label="Tipo">
            <select
              value={novoTipo}
              onChange={(e) => { setNovoTipo(e.target.value); setNovoId(""); }}
              className="w-full"
            >
              {Object.entries(ENTITY_TYPES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Relacionar com">
            <select value={novoId} onChange={(e) => setNovoId(e.target.value)} className="w-full">
              <option value="">Selecione...</option>
              {opcoes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Rótulo (opcional)">
            <TextInput value={rotulo} onChange={setRotulo} placeholder="Ex: aliado de, suspeita de..." />
          </Field>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button variant="gold" onClick={adicionar} disabled={!novoId}>Adicionar</Button>
          </div>
        </div>
      ) : (
        <Button className="!text-xs !px-2 !py-1" onClick={() => setAberto(true)}>+ Relacionar com...</Button>
      )}
    </Card>
  );
}
