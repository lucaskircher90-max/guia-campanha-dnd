import { useEffect, useRef, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage indisponível (modo privado, cota excedida, etc.) — ignora
    }
  }, [key, value]);

  return [value, setValue];
}
