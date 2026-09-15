import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "../lib/useLocalStorage";
import {
  newPlayerCharacter, newNpc, newMilestone, newEncounter, newItem, newMapEntry, newEncounterTemplate, newTarotCard,
  newLink,
} from "../lib/models";
import { tarotBulkReplace, tarotDelete, tarotGetAll, tarotPut } from "../lib/tarotDb";
import { sameLink } from "../lib/links";

const LEGACY_TAROT_KEY = "dnd.tarotCards";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [players, setPlayers] = useLocalStorage("dnd.players", []);
  const [npcs, setNpcs] = useLocalStorage("dnd.npcs", []);
  const [milestones, setMilestones] = useLocalStorage("dnd.milestones", []);
  const [encounter, setEncounter] = useLocalStorage("dnd.encounter", newEncounter());
  const [campaign, setCampaign] = useLocalStorage("dnd.campaign", { nome: "Minha Campanha" });
  const [items, setItems] = useLocalStorage("dnd.items", []);
  const [maps, setMaps] = useLocalStorage("dnd.maps", []);
  const [encounterTemplates, setEncounterTemplates] = useLocalStorage("dnd.encounterTemplates", []);
  const [links, setLinks] = useLocalStorage("dnd.links", []);

  // Cartas de Tarot: guardadas em IndexedDB (cota bem maior que o
  // localStorage), já que as imagens de um baralho inteiro estouram
  // facilmente os poucos MB que o localStorage permite por site.
  const [tarotCards, setTarotCardsState] = useState([]);
  const [tarotStorageError, setTarotStorageError] = useState("");

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const doIdb = await tarotGetAll();
        if (doIdb.length === 0) {
          const legado = window.localStorage.getItem(LEGACY_TAROT_KEY);
          if (legado) {
            const parsed = JSON.parse(legado);
            if (Array.isArray(parsed) && parsed.length > 0) {
              await tarotBulkReplace(parsed);
              window.localStorage.removeItem(LEGACY_TAROT_KEY);
              if (ativo) setTarotCardsState(parsed);
              return;
            }
          }
        }
        if (ativo) setTarotCardsState(doIdb);
      } catch (err) {
        console.error("Falha ao carregar cartas de tarot do IndexedDB:", err);
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  function persistTarotWrite(promise) {
    promise
      .then(() => setTarotStorageError(""))
      .catch((err) => {
        console.error("Falha ao salvar carta de tarot:", err);
        setTarotStorageError("Não foi possível salvar essa alteração no armazenamento do navegador. Tente novamente ou libere espaço.");
      });
  }

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

    // Encontros salvos (moldes)
    encounterTemplates,
    addEncounterTemplate: (overrides) => {
      const t = newEncounterTemplate(overrides);
      setEncounterTemplates((prev) => [t, ...prev]);
      return t;
    },
    removeEncounterTemplate: (id) => {
      setEncounterTemplates((prev) => prev.filter((t) => t.id !== id));
    },

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

    // Vínculos entre entidades (NPC, Marco, Item, Mapa/Local, Jogador) —
    // base da timeline e do grafo de conexões estilo Obsidian.
    links,
    addLink: (overrides) => {
      const link = newLink(overrides);
      if (!link.deId || !link.paraId) return null;
      const existente = links.find((l) => sameLink(l, link));
      if (existente) return existente;
      setLinks((prev) => [...prev, link]);
      return link;
    },
    removeLink: (id) => {
      setLinks((prev) => prev.filter((l) => l.id !== id));
    },

    // Cartas de Tarot (persistidas em IndexedDB, não localStorage)
    tarotCards,
    tarotStorageError,
    addTarotCard: (overrides) => {
      const card = newTarotCard(overrides);
      setTarotCardsState((prev) => [...prev, card]);
      persistTarotWrite(tarotPut(card));
      return card;
    },
    updateTarotCard: (id, patch) => {
      setTarotCardsState((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
        const atualizada = next.find((c) => c.id === id);
        if (atualizada) persistTarotWrite(tarotPut(atualizada));
        return next;
      });
    },
    removeTarotCard: (id) => {
      setTarotCardsState((prev) => prev.filter((c) => c.id !== id));
      persistTarotWrite(tarotDelete(id));
    },

    // Backup / transferência entre dispositivos
    exportData: () => ({
      formato: "guia-campanha-dnd",
      versao: 4,
      exportadoEm: new Date().toISOString(),
      campaign,
      players,
      npcs,
      milestones,
      encounter,
      items,
      maps,
      encounterTemplates,
      tarotCards,
      links,
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
      if (Array.isArray(data.encounterTemplates)) setEncounterTemplates(data.encounterTemplates);
      if (Array.isArray(data.tarotCards)) {
        setTarotCardsState(data.tarotCards);
        persistTarotWrite(tarotBulkReplace(data.tarotCards));
      }
      if (Array.isArray(data.links)) setLinks(data.links);
    },
  }), [
    players, npcs, milestones, encounter, campaign, items, maps, encounterTemplates, tarotCards, tarotStorageError, links,
    setPlayers, setNpcs, setMilestones, setEncounter, setCampaign, setItems, setMaps, setEncounterTemplates, setLinks,
  ]);

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData deve ser usado dentro de DataProvider");
  return ctx;
}
