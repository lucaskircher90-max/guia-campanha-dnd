import { useEffect, useMemo, useState } from "react";
import { Card, TextInput } from "../components/ui";

const NIVEL_LABELS = {
  0: "Truque",
  1: "1º Nível",
  2: "2º Nível",
  3: "3º Nível",
  4: "4º Nível",
  5: "5º Nível",
  6: "6º Nível",
  7: "7º Nível",
  8: "8º Nível",
  9: "9º Nível",
};

const NIVEIS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const ESCOLAS = ["Abjuração", "Convocação", "Adivinhação", "Encantamento", "Evocação", "Ilusão", "Necromancia", "Transmutação"];
const CLASSES = ["Bardo", "Clérigo", "Druida", "Feiticeiro", "Bruxo", "Mago", "Paladino", "Patrulheiro"];

export default function SpellsList() {
  const [spells, setSpells] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState(null);
  const [escola, setEscola] = useState(null);
  const [classe, setClasse] = useState(null);
  const [soRitual, setSoRitual] = useState(false);
  const [soConcentracao, setSoConcentracao] = useState(false);
  const [selecionada, setSelecionada] = useState(null);

  useEffect(() => {
    import("../data/spells.json")
      .then((mod) => setSpells(mod.default))
      .finally(() => setCarregando(false));
  }, []);

  const resultados = useMemo(() => {
    if (!spells) return [];
    const q = busca.trim().toLowerCase();
    return spells.filter((s) => {
      if (q && !s.nome.toLowerCase().includes(q)) return false;
      if (nivel !== null && s.nivel !== nivel) return false;
      if (escola && s.escola !== escola) return false;
      if (classe && !s.classes.split(", ").includes(classe)) return false;
      if (soRitual && !s.ritual) return false;
      if (soConcentracao && !s.concentracao) return false;
      return true;
    });
  }, [spells, busca, nivel, escola, classe, soRitual, soConcentracao]);

  const spellSelecionada = selecionada ? spells?.find((s) => s.index === selecionada) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl text-gold-400">📖 Magias</h2>
        <span className="text-xs text-parchment-300/50">
          {carregando ? "Carregando..." : `${spells?.length ?? 0} magias (SRD 5.1)`}
        </span>
      </div>

      <Card>
        <TextInput
          autoFocus
          placeholder="Buscar magia por nome..."
          value={busca}
          onChange={setBusca}
          className="max-w-sm mb-3"
        />

        <div className="flex flex-col gap-2">
          <FilterRow label="Nível">
            <Chip active={nivel === null} onClick={() => setNivel(null)}>Todos</Chip>
            {NIVEIS.map((n) => (
              <Chip key={n} active={nivel === n} onClick={() => setNivel(nivel === n ? null : n)}>
                {n === 0 ? "Truque" : n}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="Escola">
            <Chip active={escola === null} onClick={() => setEscola(null)}>Todas</Chip>
            {ESCOLAS.map((e) => (
              <Chip key={e} active={escola === e} onClick={() => setEscola(escola === e ? null : e)}>{e}</Chip>
            ))}
          </FilterRow>
          <FilterRow label="Classe">
            <Chip active={classe === null} onClick={() => setClasse(null)}>Todas</Chip>
            {CLASSES.map((c) => (
              <Chip key={c} active={classe === c} onClick={() => setClasse(classe === c ? null : c)}>{c}</Chip>
            ))}
          </FilterRow>
          <FilterRow label="Outros">
            <Chip active={soRitual} onClick={() => setSoRitual((v) => !v)}>Ritual</Chip>
            <Chip active={soConcentracao} onClick={() => setSoConcentracao((v) => !v)}>Concentração</Chip>
          </FilterRow>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <Card title={`Resultados (${resultados.length})`} className="max-h-[70vh] overflow-y-auto">
            {carregando ? (
              <p className="text-xs text-parchment-300/40 py-2">Carregando compêndio de magias...</p>
            ) : resultados.length === 0 ? (
              <p className="text-xs text-parchment-300/40 py-2">Nenhuma magia encontrada com esses filtros.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {resultados.map((s) => (
                  <button
                    key={s.index}
                    onClick={() => setSelecionada(s.index)}
                    className={`text-left px-2 py-1.5 rounded transition-colors ${
                      selecionada === s.index ? "bg-ink-700 border border-gold-500" : "hover:bg-ink-700 border border-transparent"
                    }`}
                  >
                    <span className="text-sm text-parchment-100">{s.nome}</span>
                    <span className="block text-[10px] text-parchment-300/40">
                      {NIVEL_LABELS[s.nivel]} · {s.escola}{s.concentracao ? " · Conc." : ""}{s.ritual ? " · Ritual" : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3">
          {spellSelecionada ? (
            <SpellDetail spell={spellSelecionada} />
          ) : (
            <Card>
              <p className="text-parchment-300/50 text-sm">Selecione uma magia na lista para ver a descrição completa.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterRow({ label, children }) {
  return (
    <div className="flex items-start gap-2 flex-wrap">
      <span className="text-xs uppercase tracking-wide text-parchment-300/50 pt-1 w-16 shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
        active ? "bg-gold-600 border-gold-600 text-ink-950 font-semibold" : "border-ink-600 text-parchment-300/60 hover:text-parchment-100"
      }`}
    >
      {children}
    </button>
  );
}

function SpellDetail({ spell: s }) {
  const porNivel = s.dano?.porNivel;
  return (
    <div className="card-parchment p-5 font-body">
      <h3 className="text-2xl font-display font-bold text-blood-700">{s.nome}</h3>
      <p className="italic text-sm mb-2">
        {NIVEL_LABELS[s.nivel]}{s.nivel !== 0 ? "" : ""} · {s.escola}
        {s.ritual ? " (ritual)" : ""}
      </p>
      <hr className="my-2 border-gold-600" />

      <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
        <p><span className="font-semibold">Tempo de Conjuração: </span>{s.tempoConjuracao}</p>
        <p><span className="font-semibold">Alcance: </span>{s.alcance}</p>
        <p><span className="font-semibold">Componentes: </span>{s.componentes}</p>
        <p><span className="font-semibold">Duração: </span>{s.duracao}{s.concentracao ? " (concentração)" : ""}</p>
      </div>
      {s.material && (
        <p className="text-sm mb-2"><span className="font-semibold">Material: </span>{s.material}</p>
      )}
      <p className="text-sm mb-3"><span className="font-semibold">Classes: </span>{s.classes}</p>

      {(s.salvaguarda || s.dano || s.areaEfeito) && (
        <div className="text-sm flex flex-wrap gap-x-4 gap-y-1 mb-3 pb-3 border-b border-parchment-300">
          {s.salvaguarda && (
            <span><span className="font-semibold">Resistência: </span>{s.salvaguarda.atributo} ({s.salvaguarda.sucesso === "half" ? "metade do dano" : "nega o efeito"})</span>
          )}
          {s.dano && <span><span className="font-semibold">Dano: </span>{s.dano.tipo}{porNivel ? ` (${porNivel[String(s.nivel)] || Object.values(porNivel)[0]} base)` : ""}</span>}
          {s.areaEfeito && <span><span className="font-semibold">Área: </span>{s.areaEfeito}</span>}
        </div>
      )}

      <div className="text-sm whitespace-pre-wrap leading-relaxed">{s.descricao}</div>

      {s.nivelSuperior && (
        <div className="mt-3 pt-3 border-t border-parchment-300">
          <p className="font-display font-bold text-blood-700 mb-1">Em Níveis Superiores</p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{s.nivelSuperior}</p>
        </div>
      )}

      {porNivel && Object.keys(porNivel).length > 1 && (
        <div className="mt-3 pt-3 border-t border-parchment-300">
          <p className="font-display font-bold text-blood-700 mb-1">Dano por Nível de Espaço</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(porNivel).map(([lvl, dmg]) => (
              <span key={lvl} className="px-1.5 py-0.5 rounded border border-parchment-300">{lvl}º: {dmg}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
