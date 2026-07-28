import { Link, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card, ConfirmButton } from "../components/ui";
import { abilityMod, fmtMod } from "../lib/dnd";

export default function PlayersList() {
  const { players, addPlayer, removePlayer } = useData();
  const navigate = useNavigate();

  function handleAdd() {
    const pc = addPlayer();
    navigate(`/jogadores/${pc.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-gold-400">Fichas de Jogadores</h2>
        <Button variant="gold" onClick={handleAdd}>+ Novo Personagem</Button>
      </div>

      {players.length === 0 ? (
        <Card>
          <p className="text-parchment-300/60 text-sm">
            Nenhum personagem cadastrado. Crie a primeira ficha para começar.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((pc) => (
            <div key={pc.id} className="card p-4 flex flex-col gap-2 hover:border-gold-500 transition-colors">
              <Link to={`/jogadores/${pc.id}`} className="flex-1">
                <h3 className="font-display text-lg text-parchment-50">{pc.nome}</h3>
                <p className="text-xs text-parchment-300/60 mb-2">
                  {pc.classe || "Classe?"} {pc.nivel ? `Nv. ${pc.nivel}` : ""} · {pc.raca || "Raça?"}
                </p>
                <div className="flex gap-3 text-xs text-parchment-300/70">
                  <span>CA {pc.ca}</span>
                  <span>PV {pc.pvAtual}/{pc.pvMax}</span>
                  <span>Ini {fmtMod(abilityMod(pc.atributos?.des) + (pc.iniciativaExtra || 0))}</span>
                </div>
                {pc.jogador && (
                  <p className="text-xs text-parchment-300/40 mt-1">Jogador: {pc.jogador}</p>
                )}
              </Link>
              <div className="flex justify-end pt-2 border-t border-ink-700">
                <ConfirmButton onConfirm={() => removePlayer(pc.id)}>Remover</ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
