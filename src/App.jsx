import { HashRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import PlayersList from "./pages/PlayersList";
import PlayerSheet from "./pages/PlayerSheet";
import NpcsList from "./pages/NpcsList";
import NpcSheet from "./pages/NpcSheet";
import NpcGenerator from "./pages/NpcGenerator";
import Story from "./pages/Story";
import Timeline from "./pages/Timeline";
import Graph from "./pages/Graph";
import Combat from "./pages/Combat";
import ItemsList from "./pages/ItemsList";
import ItemSheet from "./pages/ItemSheet";
import MapsList from "./pages/MapsList";
import MapViewer from "./pages/MapViewer";
import Tarot from "./pages/Tarot";
import SpellsList from "./pages/SpellsList";

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jogadores" element={<PlayersList />} />
            <Route path="/jogadores/:id" element={<PlayerSheet />} />
            <Route path="/npcs" element={<NpcsList />} />
            <Route path="/npcs/:id" element={<NpcSheet />} />
            <Route path="/gerador-npc" element={<NpcGenerator />} />
            <Route path="/historia" element={<Story />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/grafo" element={<Graph />} />
            <Route path="/combate" element={<Combat />} />
            <Route path="/itens" element={<ItemsList />} />
            <Route path="/itens/:id" element={<ItemSheet />} />
            <Route path="/mapas" element={<MapsList />} />
            <Route path="/mapas/:id" element={<MapViewer />} />
            <Route path="/tarot" element={<Tarot />} />
            <Route path="/magias" element={<SpellsList />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
}
