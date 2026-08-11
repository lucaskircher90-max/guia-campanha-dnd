import { useRef, useState } from "react";
import { useData } from "../context/DataContext";
import { Button, Card, ConfirmButton, TextArea, TextInput } from "../components/ui";
import { compressImageFile, estimateDataUrlKb } from "../lib/imageUtils";
import TarotCardBack from "../components/TarotCardBack";

const POSICOES = [
  "Situação Atual",
  "Desafio ou Obstáculo",
  "Base / Origem",
  "Caminho a Seguir",
  "Resultado Provável",
];

let uidSeq = 0;
function nextUid() {
  uidSeq += 1;
  return `tc-${uidSeq}`;
}

function embaralhar(lista) {
  const arr = [...lista];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Tarot() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-2xl text-gold-400">🔮 Tarot</h2>
      <ReadingTable />
      <DeckManager />
    </div>
  );
}

function FlipCard({ revelada, imagemUrl, nome, onClick, disabled, className = "" }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`tarot-flip-scene ${className}`}>
      <div className={`tarot-flip-card ${revelada ? "is-flipped" : ""}`}>
        <div className="tarot-flip-face tarot-flip-face-front">
          <TarotCardBack className="w-full h-full drop-shadow" />
        </div>
        <div className="tarot-flip-face tarot-flip-face-back bg-ink-900 border border-gold-600 flex items-center justify-center">
          {imagemUrl ? (
            <img src={imagemUrl} alt={nome} className="w-full h-full object-contain" />
          ) : (
            <span className="text-[10px] text-parchment-300/40 p-1 text-center">{nome}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function ReadingTable() {
  const { tarotCards } = useData();
  const [modoJogadores, setModoJogadores] = useState(false);
  const [mesa, setMesa] = useState([]);
  const [escolhidas, setEscolhidas] = useState([]);
  const [erro, setErro] = useState("");

  function novaLeitura() {
    const validas = tarotCards.filter((c) => c.imagemUrl);
    if (validas.length < 5) {
      setErro("É preciso pelo menos 5 cartas com imagem cadastradas no baralho abaixo para iniciar uma leitura.");
      return;
    }
    setErro("");
    const embaralhadas = embaralhar(validas);
    setMesa(embaralhadas.map((card) => ({ uid: nextUid(), card, revelada: false, rot: (Math.random() * 14 - 7).toFixed(1) })));
    setEscolhidas([]);
  }

  function escolherCarta(item) {
    if (item.revelada || escolhidas.length >= 5) return;
    setMesa((prev) => prev.map((m) => (m.uid === item.uid ? { ...m, revelada: true } : m)));
    setEscolhidas((prev) => [...prev, item.card]);
  }

  const leituraCompleta = escolhidas.length >= 5;

  return (
    <Card title="🔮 Mesa de Leitura">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
        <p className="text-xs text-parchment-300/60 max-w-xl">
          As cartas ficam viradas para baixo. Clique em qualquer uma para tirá-la — ela vira e ocupa a próxima posição da
          tiragem, revelando só aquela carta. Em Modo Jogadores, o nome de cada posição fica oculto; ative o Modo Mestre
          para consultá-lo durante a interpretação.
        </p>
        <Button variant={modoJogadores ? "primary" : "gold"} onClick={() => setModoJogadores((v) => !v)}>
          {modoJogadores ? "🖌️ Voltar ao Modo Mestre" : "🎬 Modo Jogadores"}
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-4">
        {POSICOES.map((pos, i) => {
          const card = escolhidas[i];
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-full aspect-[2/3]">
                {card ? (
                  <FlipCard revelada imagemUrl={card.imagemUrl} nome={card.nome} disabled className="w-full h-full" />
                ) : (
                  <div className="w-full h-full rounded border border-dashed border-ink-600 flex items-center justify-center text-parchment-300/30 text-xs">
                    {i + 1}
                  </div>
                )}
              </div>
              {card && <span className="text-[11px] text-parchment-100 text-center font-display leading-tight">{card.nome}</span>}
              {!modoJogadores && card && (
                <span className="text-[9px] text-gold-400/80 text-center uppercase tracking-wide leading-tight">{pos}</span>
              )}
              {card?.significado && (
                <p className="text-[9px] text-parchment-300/40 text-center leading-snug">{card.significado}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <span className="text-xs text-parchment-300/50">
          {mesa.length === 0
            ? "Nenhuma leitura em andamento."
            : leituraCompleta
            ? "Leitura completa — as 5 posições foram preenchidas."
            : `${escolhidas.length}/5 cartas escolhidas — clique numa carta virada para revelá-la.`}
        </span>
        {escolhidas.length > 0 ? (
          <ConfirmButton onConfirm={novaLeitura} confirmLabel="Confirmar nova leitura">
            🔀 Nova Leitura
          </ConfirmButton>
        ) : (
          <Button variant="gold" onClick={novaLeitura}>
            🔀 {mesa.length > 0 ? "Embaralhar Novamente" : "Embaralhar e Iniciar Leitura"}
          </Button>
        )}
      </div>
      {erro && <p className="text-xs text-blood-500 mb-2">{erro}</p>}

      {mesa.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 p-3 rounded bg-ink-900/50 border border-ink-700 min-h-[7rem]">
          {mesa.filter((m) => !m.revelada).length === 0 && (
            <p className="text-xs text-parchment-300/30 self-center">Todas as cartas da mesa foram tiradas.</p>
          )}
          {mesa
            .filter((m) => !m.revelada)
            .map((item) => (
              <div key={item.uid} style={{ transform: `rotate(${item.rot}deg)` }} className="w-20 sm:w-24 aspect-[2/3]">
                <FlipCard revelada={false} onClick={() => escolherCarta(item)} disabled={leituraCompleta} className="w-full h-full" />
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}

function DeckManager() {
  const { tarotCards, addTarotCard, updateTarotCard, removeTarotCard, tarotStorageError } = useData();
  const fileInputRef = useRef(null);
  const [aberto, setAberto] = useState(tarotCards.length === 0);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function onFilesChange(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setEnviando(true);
    setErro("");
    try {
      for (const file of files) {
        const dataUrl = await compressImageFile(file, { maxDim: 900, quality: 0.75 });
        const nome = file.name.replace(/\.[^.]+$/, "");
        addTarotCard({ nome: nome || "Nova Carta", imagemUrl: dataUrl });
      }
    } catch (err) {
      setErro(err.message || "Falha ao processar uma das imagens.");
    } finally {
      setEnviando(false);
    }
  }

  const totalKb = tarotCards.reduce((sum, c) => sum + estimateDataUrlKb(c.imagemUrl), 0);

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-lg text-gold-400">
          🃏 Baralho ({tarotCards.length} carta{tarotCards.length === 1 ? "" : "s"})
        </h2>
        <Button onClick={() => setAberto((v) => !v)}>{aberto ? "ocultar" : "⚙ gerenciar baralho"}</Button>
      </div>

      {aberto && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="gold" onClick={() => fileInputRef.current?.click()} disabled={enviando}>
              {enviando ? "Processando..." : "+ Enviar Cartas (arte da frente)"}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesChange} />
            {totalKb > 0 && <span className="text-[11px] text-parchment-300/40">~{(totalKb / 1024).toFixed(1)} MB no baralho</span>}
          </div>
          <p className="text-[11px] text-parchment-300/40">
            Você pode selecionar várias imagens de uma vez. O verso exibido na mesa é sempre o mesmo desenho genérico — só a
            frente é sua arte.
          </p>
          {erro && <p className="text-xs text-blood-500">{erro}</p>}
          {tarotStorageError && <p className="text-xs text-blood-500">⚠ {tarotStorageError}</p>}

          {tarotCards.length === 0 ? (
            <p className="text-xs text-parchment-300/40">Nenhuma carta cadastrada ainda. Envie as artes das frentes das suas cartas de tarot.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {tarotCards.map((c) => (
                <div key={c.id} className="flex gap-2 p-2 rounded border border-ink-700">
                  <img src={c.imagemUrl} alt={c.nome} className="w-14 aspect-[2/3] object-contain bg-ink-900 rounded border border-ink-600 shrink-0" />
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <TextInput value={c.nome} onChange={(v) => updateTarotCard(c.id, { nome: v })} className="!text-sm" />
                    <TextArea
                      value={c.significado}
                      onChange={(v) => updateTarotCard(c.id, { significado: v })}
                      rows={2}
                      placeholder="Significado (só aparece no Modo Mestre)"
                      className="!text-xs"
                    />
                    <ConfirmButton onConfirm={() => removeTarotCard(c.id)} className="self-start" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
