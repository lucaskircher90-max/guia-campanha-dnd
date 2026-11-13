import { useEffect, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { registrar, marcarSujo, consumirRemoto } from "./nuvem";

// Igual ao useLocalStorage, mas avisa o módulo da nuvem quando o valor muda
// (para enviar) e aceita valores vindos da nuvem (sem reenviá-los).
export function useSyncedStorage(chave, inicial) {
  const [valor, setValor] = useLocalStorage(`dnd.${chave}`, inicial);
  const ref = useRef(valor);
  ref.current = valor;
  const anterior = useRef(valor);

  useEffect(() => {
    registrar(chave, { get: () => ref.current, set: setValor, inicial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  useEffect(() => {
    // só reage a mudanças reais (o React em modo dev roda os efeitos duas vezes na montagem)
    if (valor === anterior.current) return;
    anterior.current = valor;
    if (consumirRemoto(chave)) return;
    marcarSujo(chave);
  }, [chave, valor]);

  return [valor, setValor];
}
