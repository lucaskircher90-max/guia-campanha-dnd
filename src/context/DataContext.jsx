import { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "../lib/useLocalStorage";
import { newPlayerCharacter, newNpc, newMilestone, newEncounter } from "../lib/models";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [players, setPlayers] = useLocalStorage("dnd.players", []);
  const [npcs, setNpcs] = useLocalStorage("dnd.npcs", []);
  const [milestones, setMilestones] = useLocalStorage("dnd.milestones", []);
  const [encounter, setEncounter] = useLocalStorage("dnd.encounter", newEncounter());
  const [campaign, setCampaign] = useLocalStorage("dnd.campaign", { nome: "Minha Campanha" });

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

    // Backup / transferência entre dispositivos
    exportData: () => ({
      formato: "guia-campanha-dnd",
      versao: 1,
      exportadoEm: new Date().toISOString(),
      campaign,
      players,
      npcs,
      milestones,
      encounter,
    }),
    importData: (data) => {
      if (!data || typeof data !== "object") throw new Error("Arquivo inválido.");
      if (Array.isArray(data.players)) setPlayers(data.players);
      if (Array.isArray(data.npcs)) setNpcs(data.npcs);
      if (Array.isArray(data.milestones)) setMilestones(data.milestones);
      if (data.encounter && typeof data.encounter === "object") setEncounter(data.encounter);
      if (data.campaign && typeof data.campaign === "object") setCampaign(data.campaign);
    },
  }), [players, npcs, milestones, encounter, campaign, setPlayers, setNpcs, setMilestones, setEncounter, setCampaign]);

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve ser usado dentro de DataProvider");
  return ctx;
}
