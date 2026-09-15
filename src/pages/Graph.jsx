import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useData } from "../context/DataContext";
import { Card, Checkbox } from "../components/ui";
import { useLocalStorage } from "../lib/useLocalStorage";
import { ENTITY_TYPES, ENTITY_ROUTES, nodeKey } from "../lib/links";

const TIPOS_ORDEM = Object.keys(ENTITY_TYPES);
const COL_WIDTH = 220;
const ROW_HEIGHT = 64;

function layoutNodes(entidadesPorTipo, positions) {
  const nodes = [];
  TIPOS_ORDEM.forEach((tipo, colIdx) => {
    const cfg = ENTITY_TYPES[tipo];
    (entidadesPorTipo[tipo] || []).forEach((ent, rowIdx) => {
      const key = nodeKey(tipo, ent.id);
      nodes.push({
        id: key,
        position: positions[key] || { x: colIdx * COL_WIDTH, y: rowIdx * ROW_HEIGHT },
        data: { label: `${cfg.icon} ${ent.nome || ent.titulo || "Sem nome"}` },
        style: {
          background: cfg.color,
          color: "#faf3e4",
          border: "1px solid rgba(0,0,0,0.35)",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 12,
          minWidth: 150,
        },
      });
    });
  });
  return nodes;
}

export default function Graph() {
  const data = useData();
  const { links, addLink, removeLink } = data;
  const navigate = useNavigate();
  const [mostrarTudo, setMostrarTudo] = useLocalStorage("dnd.graphMostrarTudo", false);
  const [positions, setPositions] = useLocalStorage("dnd.graphPositions", {});

  const conectados = useMemo(() => {
    const set = new Set();
    for (const l of links) {
      set.add(nodeKey(l.deTipo, l.deId));
      set.add(nodeKey(l.paraTipo, l.paraId));
    }
    return set;
  }, [links]);

  const entidadesPorTipo = useMemo(() => {
    const out = {};
    for (const tipo of TIPOS_ORDEM) {
      const lista = data[ENTITY_TYPES[tipo].listKey] || [];
      out[tipo] = mostrarTudo ? lista : lista.filter((e) => conectados.has(nodeKey(tipo, e.id)));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.npcs, data.milestones, data.items, data.maps, data.players, mostrarTudo, conectados]);

  const nodeIdSet = useMemo(() => {
    const s = new Set();
    for (const [tipo, lista] of Object.entries(entidadesPorTipo)) {
      for (const e of lista) s.add(nodeKey(tipo, e.id));
    }
    return s;
  }, [entidadesPorTipo]);

  const edgesData = useMemo(
    () =>
      links
        .map((l) => ({
          id: l.id,
          source: nodeKey(l.deTipo, l.deId),
          target: nodeKey(l.paraTipo, l.paraId),
          label: l.rotulo || undefined,
          style: { stroke: "#a67f2e" },
          labelStyle: { fill: "#f2e6c9", fontSize: 10 },
          labelBgStyle: { fill: "#16100c", fillOpacity: 0.85 },
        }))
        .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target)),
    [links, nodeIdSet]
  );

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    setNodes(layoutNodes(entidadesPorTipo, positions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entidadesPorTipo, positions]);

  useEffect(() => {
    setEdges(edgesData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgesData]);

  // Bloqueia a exclusão de nós pelo teclado (não faz sentido "apagar" um NPC
  // ou Marco a partir do grafo) mas mantém arrastar/selecionar funcionando.
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes.filter((c) => c.type !== "remove"), nds)),
    [setNodes]
  );

  const onNodeDragStop = useCallback(
    (_e, node) => setPositions((prev) => ({ ...prev, [node.id]: node.position })),
    [setPositions]
  );

  const onConnect = useCallback(
    (params) => {
      const [deTipo, deId] = params.source.split("__");
      const [paraTipo, paraId] = params.target.split("__");
      addLink({ deTipo, deId, paraTipo, paraId });
    },
    [addLink]
  );

  const onEdgesDelete = useCallback(
    (removidas) => removidas.forEach((e) => removeLink(e.id)),
    [removeLink]
  );

  const onNodeClick = useCallback(
    (_e, node) => {
      const [tipo, id] = node.id.split("__");
      const rota = ENTITY_ROUTES[tipo];
      if (rota) navigate(rota(id));
    },
    [navigate]
  );

  const semNos = nodes.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl text-gold-400">Grafo de Conexões</h2>
        <Checkbox checked={mostrarTudo} onChange={setMostrarTudo} label="Mostrar todas as entidades" />
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs text-parchment-300/60">
        {TIPOS_ORDEM.map((tipo) => (
          <span key={tipo} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: ENTITY_TYPES[tipo].color }} />
            {ENTITY_TYPES[tipo].icon} {ENTITY_TYPES[tipo].label}
          </span>
        ))}
      </div>

      <div className="card overflow-hidden" style={{ height: "calc(100vh - 260px)" }}>
        {semNos ? (
          <div className="w-full h-full flex items-center justify-center text-center px-6">
            <p className="text-parchment-300/50 text-sm max-w-sm">
              {mostrarTudo
                ? "Nenhuma entidade cadastrada ainda (NPCs, Marcos, Itens, Mapas ou Jogadores)."
                : "Nenhuma relação criada ainda. Use \"Relacionar com...\" nas fichas de NPC ou nos Marcos da Timeline, ou marque \"Mostrar todas as entidades\" pra arrastar e conectar nós direto aqui."}
            </p>
          </div>
        ) : (
          <ReactFlow
            colorMode="dark"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable style={{ background: "#16100c" }} />
          </ReactFlow>
        )}
      </div>

      <Card>
        <p className="text-xs text-parchment-300/50 leading-relaxed">
          Arraste de um nó pra outro pra criar uma relação nova (o mesmo vínculo usado nas fichas e na Timeline).
          Clique num nó de NPC, Item, Mapa ou Jogador pra abrir a ficha dele. Selecione uma linha e aperte
          Delete/Backspace pra remover aquela relação. As posições dos nós ficam salvas neste navegador.
        </p>
      </Card>
    </div>
  );
}
