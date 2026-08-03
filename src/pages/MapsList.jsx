import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card, ConfirmButton, Field, TextArea, TextInput } from "../components/ui";
import { compressImageFile, estimateDataUrlKb } from "../lib/imageUtils";

export default function MapsList() {
  const { maps, addMap, updateMap, removeMap } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [expandido, setExpandido] = useState(null);

  function abrirSeletor() {
    setErro("");
    fileInputRef.current?.click();
  }

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setEnviando(true);
    setErro("");
    try {
      const dataUrl = await compressImageFile(file);
      const nome = file.name.replace(/\.[^.]+$/, "");
      const mapa = addMap({ nome: nome || "Novo Mapa", imagemDataUrl: dataUrl });
      setExpandido(mapa.id);
    } catch (err) {
      setErro(err.message || "Falha ao processar a imagem.");
    } finally {
      setEnviando(false);
    }
  }

  async function trocarImagem(mapId, e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      // troca de imagem invalida a névoa desenhada anteriormente
      updateMap(mapId, { imagemDataUrl: dataUrl, fogDataUrl: "" });
    } catch (err) {
      setErro(err.message || "Falha ao processar a imagem.");
    }
  }

  const totalKb = maps.reduce((sum, m) => sum + estimateDataUrlKb(m.imagemDataUrl) + estimateDataUrlKb(m.fogDataUrl), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl text-gold-400">Mapas</h2>
        <Button variant="gold" onClick={abrirSeletor} disabled={enviando}>
          {enviando ? "Processando..." : "+ Enviar Mapa"}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </div>

      <p className="text-xs text-parchment-300/50">
        As imagens ficam salvas no navegador (comprimidas automaticamente) — sem servidor, sem limite de contas, mas com espaço limitado.
        {totalKb > 0 && ` Uso atual: ~${(totalKb / 1024).toFixed(1)} MB em mapas.`}
      </p>
      {erro && <p className="text-xs text-blood-500">{erro}</p>}

      {maps.length === 0 ? (
        <Card>
          <p className="text-parchment-300/60 text-sm">Nenhum mapa enviado ainda. Clique em "Enviar Mapa" para adicionar a primeira imagem.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {maps.map((m) => (
            <div key={m.id} className="card overflow-hidden flex flex-col">
              <button
                onClick={() => navigate(`/mapas/${m.id}`)}
                className="block aspect-video bg-ink-900 overflow-hidden relative"
                title="Abrir visualizador (zoom e névoa de guerra)"
              >
                {m.imagemDataUrl ? (
                  <img src={m.imagemDataUrl} alt={m.nome} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                ) : (
                  <span className="flex items-center justify-center h-full text-xs text-parchment-300/30">Sem imagem</span>
                )}
                {m.fogDataUrl && (
                  <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-ink-950/80 text-gold-400 border border-gold-600">
                    névoa configurada
                  </span>
                )}
              </button>
              <div className="p-3 flex flex-col gap-2">
                <button onClick={() => setExpandido(expandido === m.id ? null : m.id)} className="text-left">
                  <span className="font-display text-parchment-50">{m.nome}</span>
                  {m.local && <span className="block text-xs text-parchment-300/50">{m.local}</span>}
                </button>

                {expandido === m.id && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-ink-700">
                    <Field label="Nome">
                      <TextInput value={m.nome} onChange={(v) => updateMap(m.id, { nome: v })} />
                    </Field>
                    <Field label="Local / Cena">
                      <TextInput value={m.local} onChange={(v) => updateMap(m.id, { local: v })} placeholder="Ex: Curtume de Sangue, Daggerford" />
                    </Field>
                    <Field label="Notas do Mestre">
                      <TextArea value={m.notas} onChange={(v) => updateMap(m.id, { notas: v })} rows={3} />
                    </Field>
                    <label className="text-xs text-gold-400 hover:underline cursor-pointer w-fit">
                      Trocar imagem
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => trocarImagem(m.id, e)} />
                    </label>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-ink-700">
                  <Button className="!text-xs !px-2 !py-1" variant="gold" onClick={() => navigate(`/mapas/${m.id}`)}>
                    🔍 Abrir Visualizador
                  </Button>
                  <ConfirmButton onConfirm={() => removeMap(m.id)}>Remover</ConfirmButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
