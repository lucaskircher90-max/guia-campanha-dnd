import { Fragment, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card, Checkbox, ConfirmButton, Field, NumberInput, TextArea, TextInput } from "../components/ui";
import { ABILITIES, SKILLS, abilityMod, fmtMod, proficiencyBonusForLevel } from "../lib/dnd";

const TABS = ["Ficha Principal", "Aparência & História", "Conjuração", "Notas do Mestre"];

export default function PlayerSheet() {
  const { id } = useParams();
  const { players, updatePlayer, removePlayer } = useData();
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);

  const pc = players.find((p) => p.id === id);
  if (!pc) {
    return (
      <Card>
        <p>Personagem não encontrado.</p>
        <Link to="/jogadores" className="text-gold-400 text-sm hover:underline">← Voltar</Link>
      </Card>
    );
  }

  const patch = (fields) => updatePlayer(pc.id, fields);
  const patchNested = (key, fields) => updatePlayer(pc.id, { [key]: { ...pc[key], ...fields } });

  const pb = proficiencyBonusForLevel(pc.nivel);
  const iniciativa = abilityMod(pc.atributos.des) + (Number(pc.iniciativaExtra) || 0);
  const percepcaoBonus = skillBonus(pc, "percepcao", pb);
  const passivaPercepcao = 10 + percepcaoBonus + (Number(pc.percepcaoPassivaExtra) || 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link to="/jogadores" className="text-gold-400 text-sm hover:underline">← Jogadores</Link>
        <ConfirmButton
          onConfirm={() => {
            removePlayer(pc.id);
            navigate("/jogadores");
          }}
        >
          Remover Ficha
        </ConfirmButton>
      </div>

      {/* Cabeçalho */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Nome do Personagem" className="col-span-2">
            <TextInput value={pc.nome} onChange={(v) => patch({ nome: v })} className="!text-lg font-display" />
          </Field>
          <Field label="Nome do Jogador">
            <TextInput value={pc.jogador} onChange={(v) => patch({ jogador: v })} />
          </Field>
          <Field label="Pontos de Experiência">
            <NumberInput value={pc.xp} onChange={(v) => patch({ xp: v })} />
          </Field>
          <Field label="Classe">
            <TextInput value={pc.classe} onChange={(v) => patch({ classe: v })} />
          </Field>
          <Field label="Nível">
            <NumberInput value={pc.nivel} onChange={(v) => patch({ nivel: v })} min={1} />
          </Field>
          <Field label="Antecedente">
            <TextInput value={pc.antecedente} onChange={(v) => patch({ antecedente: v })} />
          </Field>
          <Field label="Raça">
            <TextInput value={pc.raca} onChange={(v) => patch({ raca: v })} />
          </Field>
          <Field label="Tendência" className="col-span-2 md:col-span-1">
            <TextInput value={pc.tendencia} onChange={(v) => patch({ tendencia: v })} />
          </Field>
          <Field label="Bônus de Proficiência">
            <div className="px-2 py-1 text-center font-semibold">{fmtMod(pb)}</div>
          </Field>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-600 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t ? "border-gold-500 text-gold-400" : "border-transparent text-parchment-300/60 hover:text-parchment-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Ficha Principal" && (
        <MainTab pc={pc} pb={pb} patch={patch} patchNested={patchNested} updatePlayer={updatePlayer}
          iniciativa={iniciativa} passivaPercepcao={passivaPercepcao} />
      )}
      {tab === "Aparência & História" && <AppearanceTab pc={pc} patch={patch} />}
      {tab === "Conjuração" && <SpellsTab pc={pc} patchNested={patchNested} updatePlayer={updatePlayer} />}
      {tab === "Notas do Mestre" && (
        <Card title="Notas do Mestre (privado)">
          <TextArea value={pc.notasMestre} onChange={(v) => patch({ notasMestre: v })} rows={10}
            placeholder="Ganchos de história, segredos, relações com NPCs, etc." />
        </Card>
      )}
    </div>
  );
}

function skillBonus(pc, skillKey, pb) {
  const skill = SKILLS.find((s) => s.key === skillKey);
  const state = pc.pericias?.[skillKey] || {};
  let bonus = abilityMod(pc.atributos[skill.ability]);
  if (state.proficient) bonus += pb;
  if (state.expertise) bonus += pb;
  return bonus;
}

function MainTab({ pc, pb, patch, patchNested, updatePlayer, iniciativa, passivaPercepcao }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Coluna 1: Atributos + Salvaguardas */}
      <div className="flex flex-col gap-4">
        <Card>
          <div className="grid grid-cols-3 gap-2">
            {ABILITIES.map((a) => (
              <div key={a.key} className="card-parchment flex flex-col items-center py-2 px-1">
                <span className="text-[10px] uppercase tracking-wide font-semibold">{a.label}</span>
                <span className="font-display text-xl leading-tight">
                  {fmtMod(abilityMod(pc.atributos[a.key]))}
                </span>
                <input
                  type="number"
                  value={pc.atributos[a.key]}
                  onChange={(e) =>
                    patchNested("atributos", { [a.key]: Number(e.target.value) })
                  }
                  className="w-12 text-center !p-0.5 mt-1 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Checkbox
              checked={pc.inspiracao}
              onChange={(v) => patch({ inspiracao: v })}
              label="Inspiração"
            />
          </div>
        </Card>

        <Card title="Testes de Resistência">
          <div className="flex flex-col gap-1">
            {ABILITIES.map((a) => {
              const proficient = pc.salvaguardas?.[a.key];
              const bonus = abilityMod(pc.atributos[a.key]) + (proficient ? pb : 0);
              return (
                <div key={a.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={proficient}
                    onChange={(v) => patchNested("salvaguardas", { [a.key]: v })}
                  />
                  <span className="w-8 text-right font-mono">{fmtMod(bonus)}</span>
                  <span>{a.label}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Perícias">
          <div className="flex flex-col gap-1">
            {SKILLS.map((s) => {
              const state = pc.pericias?.[s.key] || {};
              const bonus = skillBonus(pc, s.key, pb);
              return (
                <div key={s.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={state.proficient}
                    onChange={(v) =>
                      patchNested("pericias", { [s.key]: { ...state, proficient: v, expertise: v ? state.expertise : false } })
                    }
                  />
                  <span className="w-8 text-right font-mono">{fmtMod(bonus)}</span>
                  <span className="flex-1">{s.label} <span className="text-parchment-300/40">({s.ability})</span></span>
                  <label className="text-[10px] text-parchment-300/50 flex items-center gap-1" title="Perícia (dobra o bônus de proficiência)">
                    <input
                      type="checkbox"
                      disabled={!state.proficient}
                      checked={!!state.expertise}
                      onChange={(e) =>
                        patchNested("pericias", { [s.key]: { ...state, expertise: e.target.checked } })
                      }
                      className="w-3 h-3"
                    />
                    Especialista
                  </label>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-ink-700 flex items-center justify-between text-sm">
            <span>Sabedoria Passiva (Percepção)</span>
            <span className="font-display text-gold-400 text-lg">{passivaPercepcao}</span>
          </div>
        </Card>
      </div>

      {/* Coluna 2: Combate */}
      <div className="flex flex-col gap-4">
        <Card>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Classe de Armadura">
              <NumberInput value={pc.ca} onChange={(v) => patch({ ca: v })} className="text-center text-lg" />
            </Field>
            <Field label="Iniciativa">
              <div className="px-2 py-1 text-center text-lg font-display">{fmtMod(iniciativa)}</div>
            </Field>
            <Field label="Deslocamento">
              <TextInput value={pc.deslocamento} onChange={(v) => patch({ deslocamento: v })} className="text-center" />
            </Field>
          </div>
          <Field label="Ajuste de Iniciativa (extra)" className="mt-2">
            <NumberInput value={pc.iniciativaExtra} onChange={(v) => patch({ iniciativaExtra: v })} />
          </Field>
        </Card>

        <Card title="Pontos de Vida">
          <div className="grid grid-cols-3 gap-2">
            <Field label="PV Máximo">
              <NumberInput value={pc.pvMax} onChange={(v) => patch({ pvMax: v })} />
            </Field>
            <Field label="PV Atual">
              <NumberInput value={pc.pvAtual} onChange={(v) => patch({ pvAtual: v })} />
            </Field>
            <Field label="PV Temporário">
              <NumberInput value={pc.pvTemp} onChange={(v) => patch({ pvTemp: v })} />
            </Field>
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => patch({ pvAtual: Math.max(0, (pc.pvAtual || 0) - 1) })}>-1 PV</Button>
            <Button onClick={() => patch({ pvAtual: Math.min(pc.pvMax, (pc.pvAtual || 0) + 1) })}>+1 PV</Button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Field label="Dados de Vida (total)">
              <TextInput value={pc.dadosDeVidaTotal} onChange={(v) => patch({ dadosDeVidaTotal: v })} />
            </Field>
            <Field label="Dados de Vida Gastos">
              <NumberInput value={pc.dadosDeVidaGastos} onChange={(v) => patch({ dadosDeVidaGastos: v })} />
            </Field>
          </div>
          <div className="mt-3">
            <span className="text-xs uppercase tracking-wide text-parchment-300/70 block mb-1">Testes Contra a Morte</span>
            <div className="flex gap-4">
              <DeathDots label="Sucessos" count={pc.mortSucessos} onChange={(v) => patch({ mortSucessos: v })} />
              <DeathDots label="Fracassos" count={pc.mortFracassos} onChange={(v) => patch({ mortFracassos: v })} />
            </div>
          </div>
        </Card>

        <AttacksCard pc={pc} updatePlayer={updatePlayer} />

        <Card title="Moedas">
          <div className="grid grid-cols-5 gap-1">
            {["pc", "pp", "pe", "po", "pl"].map((moeda) => (
              <Field key={moeda} label={moeda.toUpperCase()}>
                <NumberInput
                  value={pc.moedas?.[moeda]}
                  onChange={(v) => patchNested("moedas", { [moeda]: v })}
                  className="text-center"
                />
              </Field>
            ))}
          </div>
        </Card>
      </div>

      {/* Coluna 3: Personalidade + textos */}
      <div className="flex flex-col gap-4">
        <Card title="Personalidade">
          <div className="flex flex-col gap-2">
            <Field label="Traços de Personalidade">
              <TextArea value={pc.tracos} onChange={(v) => patch({ tracos: v })} rows={2} />
            </Field>
            <Field label="Ideais">
              <TextArea value={pc.ideais} onChange={(v) => patch({ ideais: v })} rows={2} />
            </Field>
            <Field label="Ligações">
              <TextArea value={pc.ligacoes} onChange={(v) => patch({ ligacoes: v })} rows={2} />
            </Field>
            <Field label="Defeitos">
              <TextArea value={pc.defeitos} onChange={(v) => patch({ defeitos: v })} rows={2} />
            </Field>
          </div>
        </Card>

        <Card title="Idiomas e Outras Proficiências">
          <TextArea value={pc.idiomasProficiencias} onChange={(v) => patch({ idiomasProficiencias: v })} rows={3} />
        </Card>

        <Card title="Equipamento">
          <TextArea value={pc.equipamento} onChange={(v) => patch({ equipamento: v })} rows={4} />
        </Card>

        <Card title="Características e Habilidades">
          <TextArea value={pc.caracteristicasHabilidades} onChange={(v) => patch({ caracteristicasHabilidades: v })} rows={4} />
        </Card>
      </div>
    </div>
  );
}

function DeathDots({ label, count, onChange }) {
  return (
    <div>
      <span className="text-[10px] text-parchment-300/50 block">{label}</span>
      <div className="flex gap-1.5 mt-1">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            onClick={() => onChange(count === n ? n - 1 : n)}
            className={`w-4 h-4 rounded-full border ${
              n <= (count || 0) ? "bg-blood-600 border-blood-500" : "border-ink-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function AttacksCard({ pc, updatePlayer }) {
  const ataques = pc.ataques || [];
  const setAtaques = (next) => updatePlayer(pc.id, { ataques: next });

  return (
    <Card
      title="Ataques e Magias"
      actions={
        <Button onClick={() => setAtaques([...ataques, { nome: "", bonus: "", dano: "" }])}>+ Adicionar</Button>
      }
    >
      {ataques.length === 0 ? (
        <p className="text-xs text-parchment-300/50">Nenhum ataque cadastrado.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {ataques.map((atk, i) => (
            <div key={i} className="grid grid-cols-[1fr_4rem_1fr_auto] gap-1.5 items-center">
              <TextInput placeholder="Nome" value={atk.nome} onChange={(v) => {
                const next = [...ataques]; next[i] = { ...atk, nome: v }; setAtaques(next);
              }} />
              <TextInput placeholder="Bônus" value={atk.bonus} onChange={(v) => {
                const next = [...ataques]; next[i] = { ...atk, bonus: v }; setAtaques(next);
              }} />
              <TextInput placeholder="Dano/Tipo" value={atk.dano} onChange={(v) => {
                const next = [...ataques]; next[i] = { ...atk, dano: v }; setAtaques(next);
              }} />
              <Button variant="danger" onClick={() => setAtaques(ataques.filter((_, idx) => idx !== i))}>✕</Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AppearanceTab({ pc, patch }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="flex flex-col gap-4">
        <Card title="Características Físicas">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Idade"><TextInput value={pc.idade} onChange={(v) => patch({ idade: v })} /></Field>
            <Field label="Altura"><TextInput value={pc.altura} onChange={(v) => patch({ altura: v })} /></Field>
            <Field label="Peso"><TextInput value={pc.peso} onChange={(v) => patch({ peso: v })} /></Field>
            <Field label="Olhos"><TextInput value={pc.olhos} onChange={(v) => patch({ olhos: v })} /></Field>
            <Field label="Pele"><TextInput value={pc.pele} onChange={(v) => patch({ pele: v })} /></Field>
            <Field label="Cabelos"><TextInput value={pc.cabelos} onChange={(v) => patch({ cabelos: v })} /></Field>
          </div>
        </Card>
        <Card title="Imagem do Personagem">
          <Field label="URL da Imagem">
            <TextInput value={pc.imagemUrl} onChange={(v) => patch({ imagemUrl: v })} placeholder="https://..." />
          </Field>
          {pc.imagemUrl && (
            <img src={pc.imagemUrl} alt={pc.nome} className="mt-2 max-h-64 rounded border border-ink-600 mx-auto" />
          )}
        </Card>
        <Card title="Aparência do Personagem">
          <TextArea value={pc.aparenciaDescricao} onChange={(v) => patch({ aparenciaDescricao: v })} rows={4} />
        </Card>
      </div>
      <div className="flex flex-col gap-4">
        <Card title="Aliados e Organizações">
          <TextArea value={pc.aliadosOrganizacoes} onChange={(v) => patch({ aliadosOrganizacoes: v })} rows={3} />
        </Card>
        <Card title="História do Personagem">
          <TextArea value={pc.historiaPersonagem} onChange={(v) => patch({ historiaPersonagem: v })} rows={8} />
        </Card>
        <Card title="Tesouro">
          <TextArea value={pc.tesouro} onChange={(v) => patch({ tesouro: v })} rows={3} />
        </Card>
      </div>
    </div>
  );
}

function SpellsTab({ pc, patchNested, updatePlayer }) {
  const conj = pc.conjuracao;
  const setConj = (fields) => patchNested("conjuracao", fields);

  const setTruques = (next) => setConj({ truques: next });
  const setEspacos = (nivel, fields) => {
    const next = conj.espacos.map((e) => (e.nivel === nivel ? { ...e, ...fields } : e));
    setConj({ espacos: next });
  };
  const setMagias = (next) => setConj({ magias: next });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card title="Conjuração">
        <div className="flex flex-col gap-2">
          <Field label="Classe Conjuradora">
            <TextInput value={conj.classeConjuradora} onChange={(v) => setConj({ classeConjuradora: v })} />
          </Field>
          <Field label="Habilidade Chave">
            <TextInput value={conj.habilidadeChave} onChange={(v) => setConj({ habilidadeChave: v })} />
          </Field>
          <Field label="CD para Resistência de Magia">
            <TextInput value={conj.cd} onChange={(v) => setConj({ cd: v })} />
          </Field>
          <Field label="Bônus de Ataque de Magia">
            <TextInput value={conj.bonusAtaque} onChange={(v) => setConj({ bonusAtaque: v })} />
          </Field>
        </div>
      </Card>

      <Card
        title="Truques"
        actions={<Button onClick={() => setTruques([...(conj.truques || []), ""])}>+ Truque</Button>}
      >
        <div className="flex flex-col gap-1.5">
          {(conj.truques || []).map((t, i) => (
            <div key={i} className="flex gap-1.5">
              <TextInput value={t} onChange={(v) => {
                const next = [...conj.truques]; next[i] = v; setTruques(next);
              }} />
              <Button variant="danger" onClick={() => setTruques(conj.truques.filter((_, idx) => idx !== i))}>✕</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Espaços de Magia">
        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs items-center">
          <span className="font-semibold">Nível</span>
          <span className="font-semibold">Total</span>
          <span className="font-semibold">Usados</span>
          {conj.espacos.map((e) => (
            <Fragment key={e.nivel}>
              <span>{e.nivel}</span>
              <NumberInput value={e.total} onChange={(v) => setEspacos(e.nivel, { total: v })} />
              <NumberInput value={e.usados} onChange={(v) => setEspacos(e.nivel, { usados: v })} />
            </Fragment>
          ))}
        </div>
      </Card>

      <Card
        title="Magias Conhecidas / Preparadas"
        className="lg:col-span-3"
        actions={
          <Button onClick={() => setMagias([...(conj.magias || []), { nivel: 0, nome: "", preparada: false }])}>
            + Magia
          </Button>
        }
      >
        {(conj.magias || []).length === 0 ? (
          <p className="text-xs text-parchment-300/50">Nenhuma magia cadastrada.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {conj.magias.map((m, i) => (
              <div key={i} className="grid grid-cols-[3rem_1fr_auto_auto] gap-1.5 items-center">
                <NumberInput value={m.nivel} onChange={(v) => {
                  const next = [...conj.magias]; next[i] = { ...m, nivel: v }; setMagias(next);
                }} />
                <TextInput placeholder="Nome da magia" value={m.nome} onChange={(v) => {
                  const next = [...conj.magias]; next[i] = { ...m, nome: v }; setMagias(next);
                }} />
                <Checkbox checked={m.preparada} onChange={(v) => {
                  const next = [...conj.magias]; next[i] = { ...m, preparada: v }; setMagias(next);
                }} label="Preparada" />
                <Button variant="danger" onClick={() => setMagias(conj.magias.filter((_, idx) => idx !== i))}>✕</Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
