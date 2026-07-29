import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "../lib/useLocalStorage";
import { newPlayerCharacter, newNpc, newMilestone, newEncounter, newItem, newMapEntry } from "../lib/models";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [players, setPlayers] = useLocalStorage("dnd.players", []);
  const [npcs, setNpcs] = useLocalStorage("dnd.npcs", []);
  const [milestones, setMilestones] = useLocalStorage("dnd.milestones", []);
  const [encounter, setEncounter] = useLocalStorage("dnd.encounter", newEncounter());
  const [campaign, setCampaign] = useLocalStorage("dnd.campaign", { nome: "Minha Campanha" });
  const [items, setItems] = useLocalStorage("dnd.items", []);
  const [maps, setMaps] = useLocalStorage("dnd.maps", []);

  const api = useMemo(() => ({
    // Campanha
    campaign,
    setCampaign,

    // Jogadores
    players,
    addPlayer: (overrides) => {
      const pc = newPlayerCharacter(overrides);
      setPlayers((prev) => [...prev, pc]);
      return pc;
    },
    updatePlayer: (id, patch) => {
      setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    replacePlayer: (id, next) => {
      setPlayers((prev) => prev.map((p) => (p.id === id ? next : p)));
    },
    removePlayer: (id) => {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    },

    // NPCs
    npcs,
    addNpc: (overrides) => {
      const npc = newNpc(overrides);
      setNpcs((prev) => [...prev, npc]);
      return npc;
    },
    updateNpc: (id, patch) => {
      setNpcs((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    },
    replaceNpc: (id, next) => {
      setNpcs((prev) => prev.map((n) => (n.id === id ? next : n)));
    },
    removeNpc: (id) => {
      setNpcs((prev) => prev.filter((n) => n.id !== id));
    },

    // Marcos da história
    milestones,
    addMilestone: (overrides) => {
      const m = newMilestone(overrides);
      setMilestones((prev) => [m, ...prev]);
      return m;
    },
    updateMilestone: (id, patch) => {
      setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    },
    removeMilestone: (id) => {
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    },

    // Combate
    encounter,
    setEncounter,

    // Itens
    items,
    addItem: (overrides) => {
      const item = newItem(overrides);
      setItems((prev) => [...prev, item]);
      return item;
    },
    updateItem: (id, patch) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    },
    removeItem: (id) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    },

    // Mapas
    maps,
    addMap: (overrides) => {
      const map = newMapEntry(overrides);
      setMaps((prev) => [map, ...prev]);
      return map;
    },
    updateMap: (id, patch) => {
      setMaps((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    },
    removeMap: (id) => {
      setMaps((prev) => prev.filter((m) => m.id !== id));
    },

    // Backup / transferência entre dispositivos
    exportData: () => ({
      formato: "guia-campanha-dnd",
      versao: 2,
      exportadoEm: new Date().toISOString(),
      campaign,
      players,
      npcs,
      milestones,
      encounter,
      items,
      maps,
    }),
    importData: (data) => {
      if (!data || typeof data !== "object") throw new Error("Arquivo inválido.");
      if (Array.isArray(data.players)) setPlayers(data.players);
      if (Array.isArray(data.npcs)) setNpcs(data.npcs);
      if (Array.isArray(data.milestones)) setMilestones(data.milestones);
      if (data.encounter && typeof data.encounter === "object") setEncounter(data.encounter);
      if (data.campaign && typeof data.campaign === "object") setCampaign(data.campaign);
      if (Array.isArray(data.items)) setItems(data.items);
      if (Array.isArray(data.maps)) setMaps(data.maps);
    },
  }), [
    players, npcs, milestones, encounter, campaign, items, maps,
    setPlayers, setNpcs, setMilestones, setEncounter, setCampaign, setItems, setMaps,
  ]);

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve ser usado dentro de DataProvider");
  return ctx;
}
