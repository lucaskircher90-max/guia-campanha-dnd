import { NavLink, Outlet } from "react-router-dom";
import { useData } from "../context/DataContext";

const NAV_ITEMS = [
  { to: "/", label: "Painel", end: true },
  { to: "/jogadores", label: "Jogadores" },
  { to: "/combate", label: "Combate" },
  { to: "/npcs", label: "NPCs" },
  { to: "/gerador-npc", label: "Gerador de NPC" },
  { to: "/historia", label: "História" },
  { to: "/itens", label: "Itens" },
  { to: "/mapas", label: "Mapas" },
];

export default function Layout() {
  const { campaign } = useData();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-600 bg-ink-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-xl md:text-2xl text-gold-400 tracking-wide">
              ⚔ Guia da Campanha
            </h1>
            <span className="text-parchment-300/70 text-sm hidden sm:inline">
              {campaign?.nome}
            </span>
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blood-600 text-parchment-50"
                      : "text-parchment-200 hover:bg-ink-700"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-parchment-300/40 py-4">
        Guia da Campanha — dados salvos localmente no seu navegador
      </footer>
    </div>
  );
}
