import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card } from "../components/ui";
import { generateRandomNpc } from "../lib/npcGenerator";

export default function NpcGenerator() {
  const { addNpc } = useData();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(() => generateRandomNpc());
  const [historico, setHistorico] = useState([]);

  function gerar() {
    setHistorico((prev) => [current, ...prev].slice(0, 8));
    setCurrent(generateRandomNpc());
  }

  function salvarComoNpc(dados) {
    const npc = addNpc({
      nome: dados.nome,
      tipoTamanhoAlinhamento: `${dados.raca}, ${dados.ocupacao}`,
      descricao: `${dados.ocupacao}. ${dados.traco}\n\nMotivação: ${dados.motivacao}\n\nGancho de aventura: ${dados.gancho}`,
      importante: false,
    });
    navigate(`/npcs/${npc.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-gold-400">Gerador de NPCs Aleatórios</h2>
        <Button variant="gold" onClick={gerar}>🎲 Gerar Novo</Button>
      </div>

      <Card className="max-w-2xl">
        <h3 className="font-display text-xl text-parchment-50 mb-1">{current.nome}</h3>
        <p className="text-sm text-parchment-300/60 mb-3">{current.raca} · {current.ocupacao}</p>
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="Traço de Personalidade" value={current.traco} />
          <Row label="Motivação" value={current.motivacao} />
          <Row label="Gancho de Aventura" value={current.gancho} />
        </dl>
        <div className="flex gap-2 mt-4 pt-3 border-t border-ink-700">
          <Button variant="primary" onClick={() => salvarComoNpc(current)}>Salvar como NPC completo</Button>
          <Button onClick={gerar}>Descartar e Gerar Outro</Button>
        </div>
      </Card>

      {historico.length > 0 && (
        <Card title="Gerados Recentemente">
          <div className="flex flex-col gap-2">
            {historico.map((n, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-ink-700 pb-1.5">
                <div>
                  <span className="text-parchment-50">{n.nome}</span>
                  <span className="text-parchment-300/50"> — {n.raca}, {n.ocupacao}</span>
                </div>
                <Button onClick={() => salvarComoNpc(n)}>Salvar</Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-parchment-300/50">{label}</dt>
      <dd className="text-parchment-100">{value}</dd>
    </div>
  );
}
