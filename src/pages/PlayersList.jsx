import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card, ConfirmButton } from "../components/ui";
import { abilityMod, fmtMod } from "../lib/dnd";
import { parsePdfCharacterSheet } from "../lib/pdfImport";

export default function PlayersList() {
  const { players, addPlayer, removePlayer } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [importando, setImportando] = useState(false);
  const [erroImportacao, setErroImportacao] = useState("");

  function handleAdd() {
    const pc = addPlayer();
    navigate(`/jogadores/${pc.id}`);
  }

  function abrirSeletorPdf() {
    setErroImportacao("");
    fileInputRef.current?.click();
  }

  async function onPdfSelecionado(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportando(true);
    setErroImportacao("");
    try {
      const buffer = await file.arrayBuffer();
      const dados = await parsePdfCharacterSheet(buffer);
      const pc = addPlayer(dados);
      navigate(`/jogadores/${pc.id}`);
    } catch (err) {
      setErroImportacao(err.message || "Não foi possível importar este PDF.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl text-gold-400">Fichas de Jogadores</h2>
        <div className="flex gap-2">
          <Button onClick={abrirSeletorPdf} disabled={importando}>
            {importando ? "Importando..." : "📄 Importar de PDF"}
          </Button>
          <Button variant="gold" onClick={handleAdd}>+ Novo Personagem</Button>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={onPdfSelecionado} />
        </div>
      </div>

      {erroImportacao && (
        <Card className="border-blood-600">
          <p className="text-sm text-blood-500">{erroImportacao}</p>
          <p className="text-xs text-parchment-300/50 mt-1">
            A importação funciona com a ficha oficial preenchível de D&D 5E (PDF com campos de formulário). Fichas escaneadas, fotografadas ou de outros sites não são suportadas — cadastre manualmente nesse caso.
          </p>
        </Card>
      )}

      {players.length === 0 ? (
        <Card>
          <p className="text-parchment-300/60 text-sm">
            Nenhum personagem cadastrado. Crie a primeira ficha para começar, ou importe um PDF preenchido.
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
