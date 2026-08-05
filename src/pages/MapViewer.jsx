import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card } from "../components/ui";

const MAX_WORLD_DIM = 1600;
const ZOOM_MIN = 0.15;
const ZOOM_MAX = 6;
const CLICK_THRESHOLD = 6; // px de movimento pra diferenciar clique de arraste

const TOOLS = [
  { key: "mover", label: "✋ Mover" },
  { key: "revelar", label: "🔦 Revelar (pincel)" },
  { key: "ocultar", label: "🌑 Ocultar (pincel)" },
  { key: "retangulo", label: "▭ Retângulo" },
  { key: "circulo", label: "⬤ Círculo" },
  { key: "remover-forma", label: "🗑️ Remover Forma" },
];

function hitTestShape(shapes, pt, { anyState = false } = {}) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (!anyState && !s.oculto) continue;
    if (s.type === "rect") {
      if (pt.x >= s.x && pt.x <= s.x + s.w && pt.y >= s.y && pt.y <= s.y + s.h) return s;
    } else {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      const rx = s.w / 2 || 1, ry = s.h / 2 || 1;
      const nx = (pt.x - cx) / rx, ny = (pt.y - cy) / ry;
      if (nx * nx + ny * ny <= 1) return s;
    }
  }
  return null;
}

export default function MapViewer() {
  const { id } = useParams();
  const { maps, updateMap } = useData();
  const map = maps.find((m) => m.id === id);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fogCanvasRef = useRef(null);
  const mapImgRef = useRef(null);
  const worldRef = useRef({ w: 0, h: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const dragStartRef = useRef(null);
  const movedRef = useRef(false);
  const draftRef = useRef(null);
  const shapesRef = useRef([]);
  const toolRef = useRef("mover");
  const brushRef = useRef(80);
  const modoJogadoresRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [, forceRender] = useState(0);
  const [tool, setTool] = useState("mover");
  const [brushSize, setBrushSize] = useState(80);
  const [modoJogadores, setModoJogadores] = useState(false);
  const [shapes, setShapes] = useState([]);

  toolRef.current = tool;
  brushRef.current = brushSize;
  modoJogadoresRef.current = modoJogadores;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = mapImgRef.current;
    const fog = fogCanvasRef.current;
    if (!canvas || !img || !fog) return;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0d0b10";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);
    ctx.drawImage(img, 0, 0, worldRef.current.w, worldRef.current.h);

    ctx.globalAlpha = modoJogadoresRef.current ? 1 : 0.55;
    ctx.drawImage(fog, 0, 0);

    ctx.fillStyle = "#000";
    for (const s of shapesRef.current) {
      if (!s.oculto) continue;
      if (s.type === "rect") {
        ctx.fillRect(s.x, s.y, s.w, s.h);
      } else {
        ctx.beginPath();
        ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Contorno sutil nas formas já reveladas, só no Modo Mestre — pra dar pra achar
    // e apagar com "Remover Forma" mesmo depois de reveladas.
    if (!modoJogadoresRef.current) {
      ctx.strokeStyle = "rgba(201, 162, 75, 0.5)";
      ctx.setLineDash([6 / zoomRef.current, 4 / zoomRef.current]);
      ctx.lineWidth = 1.5 / zoomRef.current;
      for (const s of shapesRef.current) {
        if (s.oculto) continue;
        if (s.type === "rect") {
          ctx.strokeRect(s.x, s.y, s.w, s.h);
        } else {
          ctx.beginPath();
          ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    if (!modoJogadoresRef.current && draftRef.current) {
      const d = draftRef.current;
      const x = Math.min(d.x0, d.x1), y = Math.min(d.y0, d.y1);
      const w = Math.abs(d.x1 - d.x0), h = Math.abs(d.y1 - d.y0);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#c9a24b";
      if (d.type === "retangulo") ctx.fillRect(x, y, w, h);
      else { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#c9a24b";
      ctx.lineWidth = 2 / zoomRef.current;
      if (d.type === "retangulo") ctx.strokeRect(x, y, w, h);
      else { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.stroke(); }
    }

    ctx.restore();
  }, []);

  const fitToContainer = useCallback(() => {
    const canvas = canvasRef.current;
    const { w, h } = worldRef.current;
    if (!canvas || !w || !h) return;
    const z = Math.min(canvas.width / w, canvas.height / h) * 0.95;
    zoomRef.current = z;
    panRef.current = { x: (canvas.width - w * z) / 2, y: (canvas.height - h * z) / 2 };
    draw();
    forceRender((n) => n + 1);
  }, [draw]);

  // Redimensiona o canvas para preencher o contêiner
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw, ready]);

  // Carrega a imagem do mapa e a névoa salva (ou cria névoa nova, tudo oculto)
  useEffect(() => {
    setReady(false);
    if (!map?.imagemDataUrl) return;
    let cancelled = false;

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      mapImgRef.current = img;
      const scale = Math.min(1, MAX_WORLD_DIM / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      worldRef.current = { w, h };

      const fogCanvas = document.createElement("canvas");
      fogCanvas.width = w;
      fogCanvas.height = h;
      fogCanvasRef.current = fogCanvas;
      const fctx = fogCanvas.getContext("2d");

      const finish = () => {
        if (cancelled) return;
        setReady(true);
        requestAnimationFrame(fitToContainer);
      };

      if (map.fogDataUrl) {
        const fogImg = new Image();
        fogImg.onload = () => {
          fctx.drawImage(fogImg, 0, 0, w, h);
          finish();
        };
        fogImg.onerror = () => {
          fctx.fillStyle = "#000";
          fctx.fillRect(0, 0, w, h);
          finish();
        };
        fogImg.src = map.fogDataUrl;
      } else {
        // Mapa novo: começa totalmente visível (fog em branco/transparente).
        // Quem oculta é o mestre, adicionando formas ou usando o pincel Ocultar.
        finish();
      }
    };
    img.src = map.imagemDataUrl;
    return () => { cancelled = true; };
  }, [map?.id, map?.imagemDataUrl, fitToContainer]);

  // Carrega as formas salvas para este mapa
  useEffect(() => {
    const loaded = map?.fogShapes || [];
    setShapes(loaded);
    shapesRef.current = loaded;
    draftRef.current = null;
  }, [map?.id]);

  function persistFog() {
    if (!map || !fogCanvasRef.current) return;
    updateMap(map.id, { fogDataUrl: fogCanvasRef.current.toDataURL("image/png") });
  }

  function persistShapes(next) {
    shapesRef.current = next;
    setShapes(next);
    if (map) updateMap(map.id, { fogShapes: next });
    draw();
  }

  function toWorld(clientX, clientY) {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return { x: (sx - panRef.current.x) / zoomRef.current, y: (sy - panRef.current.y) / zoomRef.current };
  }

  function paintAt(pt) {
    const fctx = fogCanvasRef.current.getContext("2d");
    fctx.globalCompositeOperation = toolRef.current === "revelar" ? "destination-out" : "source-over";
    fctx.fillStyle = "#000";
    fctx.beginPath();
    fctx.arc(pt.x, pt.y, brushRef.current, 0, Math.PI * 2);
    fctx.fill();
  }

  function onPointerDown(e) {
    if (!ready) return;
    canvasRef.current.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;

    if (modoJogadoresRef.current) {
      lastPointRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const t = toolRef.current;
    if (t === "mover") {
      lastPointRef.current = { x: e.clientX, y: e.clientY };
    } else if (t === "revelar" || t === "ocultar") {
      paintAt(toWorld(e.clientX, e.clientY));
      draw();
    } else if (t === "retangulo" || t === "circulo") {
      const wp = toWorld(e.clientX, e.clientY);
      draftRef.current = { type: t, x0: wp.x, y0: wp.y, x1: wp.x, y1: wp.y };
      draw();
    }
  }

  function onPointerMove(e) {
    if (!drawingRef.current) return;
    const dxTotal = e.clientX - dragStartRef.current.x;
    const dyTotal = e.clientY - dragStartRef.current.y;
    if (Math.abs(dxTotal) > CLICK_THRESHOLD || Math.abs(dyTotal) > CLICK_THRESHOLD) movedRef.current = true;

    if (modoJogadoresRef.current) {
      const last = lastPointRef.current;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      lastPointRef.current = { x: e.clientX, y: e.clientY };
      panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy };
      draw();
      return;
    }

    const t = toolRef.current;
    if (t === "mover") {
      const last = lastPointRef.current;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      lastPointRef.current = { x: e.clientX, y: e.clientY };
      panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy };
      draw();
    } else if (t === "revelar" || t === "ocultar") {
      paintAt(toWorld(e.clientX, e.clientY));
      draw();
    } else if ((t === "retangulo" || t === "circulo") && draftRef.current) {
      const wp = toWorld(e.clientX, e.clientY);
      draftRef.current.x1 = wp.x;
      draftRef.current.y1 = wp.y;
      draw();
    }
  }

  function onPointerUp(e) {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if (modoJogadoresRef.current) {
      if (!movedRef.current) {
        const wp = toWorld(e.clientX, e.clientY);
        const hit = hitTestShape(shapesRef.current, wp);
        if (hit) persistShapes(shapesRef.current.map((s) => (s.id === hit.id ? { ...s, oculto: false } : s)));
      }
      return;
    }

    const t = toolRef.current;
    if (t === "revelar" || t === "ocultar") {
      persistFog();
    } else if ((t === "retangulo" || t === "circulo") && draftRef.current) {
      const d = draftRef.current;
      const x = Math.min(d.x0, d.x1), y = Math.min(d.y0, d.y1);
      const w = Math.abs(d.x1 - d.x0), h = Math.abs(d.y1 - d.y0);
      draftRef.current = null;
      if (w > 8 && h > 8) {
        const nova = { id: crypto.randomUUID(), type: d.type, x, y, w, h, oculto: true };
        persistShapes([...shapesRef.current, nova]);
      } else {
        draw();
      }
    } else if (t === "remover-forma" && !movedRef.current) {
      const wp = toWorld(e.clientX, e.clientY);
      const hit = hitTestShape(shapesRef.current, wp, { anyState: true });
      if (hit) persistShapes(shapesRef.current.filter((s) => s.id !== hit.id));
    }
  }

  // Zoom com a roda do mouse (listener manual p/ poder usar preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const worldX = (sx - panRef.current.x) / zoomRef.current;
      const worldY = (sy - panRef.current.y) / zoomRef.current;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current * factor));
      panRef.current = { x: sx - worldX * newZoom, y: sy - worldY * newZoom };
      zoomRef.current = newZoom;
      draw();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [draw, ready]);

  function zoomBy(factor) {
    const canvas = canvasRef.current;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const worldX = (cx - panRef.current.x) / zoomRef.current;
    const worldY = (cy - panRef.current.y) / zoomRef.current;
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomRef.current * factor));
    panRef.current = { x: cx - worldX * newZoom, y: cy - worldY * newZoom };
    zoomRef.current = newZoom;
    draw();
  }

  function revelarTudo() {
    const fog = fogCanvasRef.current;
    fog.getContext("2d").clearRect(0, 0, fog.width, fog.height);
    persistFog();
    persistShapes(shapesRef.current.map((s) => ({ ...s, oculto: false })));
  }

  function ocultarTudo() {
    const fog = fogCanvasRef.current;
    const fctx = fog.getContext("2d");
    fctx.globalCompositeOperation = "source-over";
    fctx.fillStyle = "#000";
    fctx.fillRect(0, 0, fog.width, fog.height);
    persistFog();
    persistShapes(shapesRef.current.map((s) => ({ ...s, oculto: true })));
  }

  useEffect(() => { draw(); }, [modoJogadores, draw]);

  if (!map) {
    return (
      <Card>
        <p>Mapa não encontrado.</p>
        <Link to="/mapas" className="text-gold-400 text-sm hover:underline">← Voltar</Link>
      </Card>
    );
  }

  const formasOcultas = shapes.filter((s) => s.oculto).length;

  return (
    <div className="flex flex-col gap-3" style={{ height: "calc(100vh - 140px)" }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to="/mapas" className="text-gold-400 text-sm hover:underline">← Mapas</Link>
          <h2 className="font-display text-xl text-parchment-50">{map.nome}</h2>
        </div>
        <Button
          variant={modoJogadores ? "primary" : "gold"}
          onClick={() => setModoJogadores((v) => !v)}
        >
          {modoJogadores ? "🖌️ Voltar ao Modo Mestre" : "🎬 Modo Jogadores"}
        </Button>
      </div>

      {!modoJogadores && (
        <div className="flex flex-wrap items-center gap-3 card p-2.5">
          <div className="flex gap-1.5 flex-wrap">
            {TOOLS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTool(t.key)}
                className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                  tool === t.key ? "bg-gold-600 border-gold-600 text-ink-950 font-semibold" : "border-ink-600 text-parchment-300/60 hover:text-parchment-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {(tool === "revelar" || tool === "ocultar") && (
            <label className="flex items-center gap-2 text-xs text-parchment-300/60">
              Pincel
              <input
                type="range"
                min={20}
                max={400}
                step={10}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-28"
              />
            </label>
          )}

          <div className="flex gap-1.5">
            <Button className="!px-2 !py-1 !text-xs" onClick={() => zoomBy(1.25)}>Zoom +</Button>
            <Button className="!px-2 !py-1 !text-xs" onClick={() => zoomBy(1 / 1.25)}>Zoom −</Button>
            <Button className="!px-2 !py-1 !text-xs" onClick={fitToContainer}>Ajustar</Button>
          </div>

          <div className="flex gap-1.5 ml-auto">
            <Button className="!px-2 !py-1 !text-xs" onClick={revelarTudo}>Revelar Tudo</Button>
            <Button className="!px-2 !py-1 !text-xs" onClick={ocultarTudo}>Ocultar Tudo</Button>
          </div>
        </div>
      )}

      <div ref={containerRef} className="flex-1 min-h-0 relative rounded border border-ink-600 overflow-hidden" style={{ touchAction: "none" }}>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-parchment-300/40 text-sm">
            Carregando mapa...
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{
            cursor: modoJogadores
              ? "pointer"
              : tool === "mover" ? "grab" : tool === "remover-forma" ? "pointer" : "crosshair",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        {modoJogadores && formasOcultas + (map.fogDataUrl ? 1 : 0) > 0 && (
          <span className="absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded-full bg-ink-950/70 text-parchment-300/60 border border-ink-600">
            Clique numa área oculta para revelar
          </span>
        )}
      </div>

      {!modoJogadores && (
        <p className="text-[10px] text-parchment-300/30">
          Mapas novos começam totalmente visíveis. Retângulo/Círculo desenham formas opacas com clique-e-arraste pra cobrir salas antes da sessão — no Modo Jogadores, clique numa forma pra revelar aquela área (fica guardada, dá pra reocultar com "Ocultar Tudo"). O pincel Revelar/Ocultar continua disponível para ajustes finos. Tudo fica salvo junto com o mapa.
        </p>
      )}
    </div>
  );
}
