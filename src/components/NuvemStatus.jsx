import { useEffect, useState, useSyncExternalStore } from "react";
import { assinar, definirPin, estadoAtual, sincronizar } from "../lib/nuvem";
import { Button } from "./ui";

function hora(d) {
  return d ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
}

// Indicador discreto de sincronização + campo de PIN (digitado uma vez por aparelho).
export default function NuvemStatus() {
  const s = useSyncExternalStore(assinar, estadoAtual);
  const [aberto, setAberto] = useState(false);
  const [pin, setPin] = useState("");

  // pede o PIN sozinho quando há algo para enviar e ainda não há PIN neste aparelho
  useEffect(() => {
    if (s.fase === "sem-pin" || s.fase === "pin-errado") setAberto(true);
  }, [s.fase]);

  const rotulo =
    {
      inicio: "☁ Conectando…",
      sincronizando: "☁ Sincronizando…",
      ok: `☁ Salvo na nuvem ${hora(s.ultima)}`,
      leitura: "☁ Só leitura (sem PIN)",
      "sem-pin": "☁ Falta o PIN para salvar",
      "pin-errado": "☁ PIN incorreto",
      erro: "☁ Sem conexão (salvo neste aparelho)",
      "nao-configurada": "☁ Nuvem não configurada",
    }[s.fase] || "☁";

  const cor =
    s.fase === "ok"
      ? "text-emerald-400"
      : s.fase === "sincronizando" || s.fase === "inicio"
        ? "text-parchment-300/70"
        : "text-gold-400";

  async function salvarPin(e) {
    e.preventDefault();
    if (!pin.trim()) return;
    await definirPin(pin);
    setPin("");
    setAberto(false);
  }

  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setAberto((v) => !v)} className={`text-xs cursor-pointer ${cor} hover:underline`}>
        {rotulo}
        {s.pendentes > 0 && s.fase !== "ok" ? ` · ${s.pendentes} pendente(s)` : ""}
      </button>
      {aberto && (
        <div className="absolute right-0 bottom-full mb-2 w-72 card p-3 text-left text-xs shadow-xl z-30">
          <div className="mb-2 text-parchment-200">
            {s.mensagem ||
              "Os dados são salvos na nuvem sozinhos. Para gravar neste aparelho, digite o PIN de edição (só uma vez)."}
          </div>
          <form onSubmit={salvarPin} className="flex gap-2">
            <input
              type="password"
              placeholder="PIN de edição"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="flex-1 min-w-0"
              autoComplete="off"
            />
            <Button type="submit" variant="gold">
              OK
            </Button>
          </form>
          <div className="flex justify-between mt-2">
            <button type="button" className="text-gold-400 hover:underline cursor-pointer" onClick={() => sincronizar()}>
              Sincronizar agora
            </button>
            <button
              type="button"
              className="text-parchment-300/70 hover:underline cursor-pointer"
              onClick={() => setAberto(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
