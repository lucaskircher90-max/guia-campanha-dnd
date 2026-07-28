import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useData } from "../context/DataContext";
import { Button, Card, ConfirmButton, TextInput } from "../components/ui";

export default function NpcsList() {
  const { npcs, addNpc, removeNpc } = useData();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  function handleAdd() {
    const npc = addNpc();
    navigate(`/npcs/${npc.id}`);
  }

  const filtrados = npcs.filter((n) =>
    `${n.nome} ${n.papel} ${n.tipoTamanhoAlinhamento}`.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl text-gold-400">NPCs</h2>
        <div className="flex gap-2">
          <Link to="/gerador-npc"><Button>🎲 Gerador Rápido</Button></Link>
          <Button variant="gold" onClick={handleAdd}>+ Novo NPC</Button>
        </div>
      </div>

      <TextInput placeholder="Buscar por nome, papel ou tipo..." value={busca} onChange={setBusca} className="max-w-sm" />

      {filtrados.length === 0 ? (
        <Card>
          <p className="text-parchment-300/60 text-sm">
            {npcs.length === 0 ? "Nenhum NPC cadastrado ainda." : "Nenhum NPC corresponde à busca."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((npc) => (
            <div key={npc.id} className="card p-4 flex flex-col gap-2 hover:border-gold-500 transition-colors">
              <Link to={`/npcs/${npc.id}`} className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg text-parchment-50">{npc.nome}</h3>
                  {npc.importante && <span className="text-xs text-gold-400" title="NPC importante">★</span>}
                </div>
                <p className="text-xs text-parchment-300/60 mb-2">{npc.tipoTamanhoAlinhamento || "Tipo?"}</p>
                {npc.papel && <p className="text-xs text-parchment-300/50 italic mb-1">{npc.papel}</p>}
                <div className="flex gap-3 text-xs text-parchment-300/70">
                  <span>CA {npc.ca}</span>
                  <span>PV {npc.pvMedio}</span>
                  {npc.nd && <span>ND {npc.nd}</span>}
                </div>
              </Link>
              <div className="flex justify-end pt-2 border-t border-ink-700">
                <ConfirmButton onConfirm={() => removeNpc(npc.id)}>Remover</ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
