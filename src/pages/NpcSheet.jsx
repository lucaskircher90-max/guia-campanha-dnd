import { useNavigate, useParams, Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card, Checkbox, ConfirmButton, Field, NumberInput, TextArea, TextInput } from "../components/ui";
import { ABILITIES, abilityMod, fmtMod } from "../lib/dnd";

export default function NpcSheet() {
  const { id } = useParams();
  const { npcs, updateNpc, removeNpc } = useData();
  const navigate = useNavigate();

  const npc = npcs.find((n) => n.id === id);
  if (!npc) {
    return (
      <Card>
        <p>NPC não encontrado.</p>
        <Link to="/npcs" className="text-gold-400 text-sm hover:underline">← Voltar</Link>
      </Card>
    );
  }

  const patch = (fields) => updateNpc(npc.id, fields);
  const patchAtributos = (fields) => updateNpc(npc.id, { atributos: { ...npc.atributos, ...fields } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link to="/npcs" className="text-gold-400 text-sm hover:underline">← NPCs</Link>
        <ConfirmButton
          onConfirm={() => {
            removeNpc(npc.id);
            navigate("/npcs");
          }}
        >
          Remover NPC
        </ConfirmButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna de edição de metadados/imagem */}
        <div className="flex flex-col gap-4">
          <Card title="Identificação">
            <div className="flex flex-col gap-2">
              <Field label="Nome"><TextInput value={npc.nome} onChange={(v) => patch({ nome: v })} className="!text-lg font-display" /></Field>
              <Field label="Papel na História"><TextInput value={npc.papel} onChange={(v) => patch({ papel: v })} placeholder="Ex: mentor, vilão, contato na cidade..." /></Field>
              <Checkbox checked={npc.importante} onChange={(v) => patch({ importante: v })} label="NPC importante (aparece no painel)" />
            </div>
          </Card>
          <Card title="Imagem">
            <Field label="URL da Imagem">
              <TextInput value={npc.imagemUrl} onChange={(v) => patch({ imagemUrl: v })} placeholder="https://..." />
            </Field>
            {npc.imagemUrl && (
              <img src={npc.imagemUrl} alt={npc.nome} className="mt-2 max-h-64 rounded border border-ink-600 mx-auto" />
            )}
          </Card>
          <Card title="Descrição / Papel na Campanha">
            <TextArea value={npc.descricao} onChange={(v) => patch({ descricao: v })} rows={5} placeholder="Aparência, personalidade, onde encontrar..." />
          </Card>
          <Card title="Notas do Mestre (privado)">
            <TextArea value={npc.notasMestre} onChange={(v) => patch({ notasMestre: v })} rows={5} placeholder="Segredos, motivações ocultas, planos..." />
          </Card>
        </div>

        {/* Stat block estilo Manual dos Monstros */}
        <div className="lg:col-span-2">
          <div className="card-parchment p-5 font-body">
            <TextInput
              value={npc.nome}
              onChange={(v) => patch({ nome: v })}
              className="!text-2xl !font-display !font-bold !bg-transparent !border-none !p-0 text-blood-700"
            />
            <TextInput
              value={npc.tipoTamanhoAlinhamento}
              onChange={(v) => patch({ tipoTamanhoAlinhamento: v })}
              placeholder="Humanoide médio, qualquer alinhamento"
              className="!italic !bg-transparent !border-none !p-0 text-sm"
            />
            <hr className="my-2 border-gold-600" />

            <StatLine label="Classe de Armadura">
              <NumberInput value={npc.ca} onChange={(v) => patch({ ca: v })} className="!w-16 inline-block" />
              <TextInput value={npc.caObs} onChange={(v) => patch({ caObs: v })} placeholder="(armadura de couro)" className="!w-40 inline-block ml-1" />
            </StatLine>
            <StatLine label="Pontos de Vida">
              <NumberInput value={npc.pvMedio} onChange={(v) => patch({ pvMedio: v })} className="!w-16 inline-block" />
              <TextInput value={npc.pvDados} onChange={(v) => patch({ pvDados: v })} placeholder="(2d8+2)" className="!w-28 inline-block ml-1" />
            </StatLine>
            <StatLine label="Deslocamento">
              <TextInput value={npc.deslocamento} onChange={(v) => patch({ deslocamento: v })} className="!w-32 inline-block" />
            </StatLine>

            <hr className="my-2 border-gold-600" />

            <div className="grid grid-cols-6 gap-1 text-center text-xs mb-2">
              {ABILITIES.map((a) => (
                <div key={a.key}>
                  <div className="font-semibold uppercase">{a.key}</div>
                  <input
                    type="number"
                    value={npc.atributos[a.key]}
                    onChange={(e) => patchAtributos({ [a.key]: Number(e.target.value) })}
                    className="!w-full !text-center !p-0.5"
                  />
                  <div>{fmtMod(abilityMod(npc.atributos[a.key]))}</div>
                </div>
              ))}
            </div>

            <hr className="my-2 border-gold-600" />

            <StatLine label="Resistências">
              <TextInput value={npc.salvaguardas} onChange={(v) => patch({ salvaguardas: v })} placeholder="Des +4, Sab +3" />
            </StatLine>
            <StatLine label="Perícias">
              <TextInput value={npc.pericias} onChange={(v) => patch({ pericias: v })} placeholder="Furtividade +5, Persuasão +3" />
            </StatLine>
            <StatLine label="Resistência a Dano">
              <TextInput value={npc.resistenciasDano} onChange={(v) => patch({ resistenciasDano: v })} />
            </StatLine>
            <StatLine label="Imunidade a Dano">
              <TextInput value={npc.imunidadesDano} onChange={(v) => patch({ imunidadesDano: v })} />
            </StatLine>
            <StatLine label="Vulnerabilidade a Dano">
              <TextInput value={npc.vulnerabilidadesDano} onChange={(v) => patch({ vulnerabilidadesDano: v })} />
            </StatLine>
            <StatLine label="Imunidade a Condição">
              <TextInput value={npc.imunidadesCondicao} onChange={(v) => patch({ imunidadesCondicao: v })} />
            </StatLine>
            <StatLine label="Sentidos">
              <TextInput value={npc.sentidos} onChange={(v) => patch({ sentidos: v })} placeholder="Percepção passiva 12" />
            </StatLine>
            <StatLine label="Idiomas">
              <TextInput value={npc.idiomas} onChange={(v) => patch({ idiomas: v })} />
            </StatLine>
            <StatLine label="Grau de Desafio">
              <TextInput value={npc.nd} onChange={(v) => patch({ nd: v })} className="!w-16 inline-block" />
              <span className="mx-1 text-xs">PE:</span>
              <TextInput value={npc.pe} onChange={(v) => patch({ pe: v })} className="!w-20 inline-block" />
            </StatLine>

            <hr className="my-2 border-gold-600" />

            <BlockList
              label="Traços"
              items={npc.tracos}
              onChange={(next) => patch({ tracos: next })}
            />
            <BlockList
              label="Ações"
              items={npc.acoes}
              onChange={(next) => patch({ acoes: next })}
            />
            <BlockList
              label="Ações Lendárias"
              items={npc.acoesLendarias}
              onChange={(next) => patch({ acoesLendarias: next })}
            />
            <BlockList
              label="Reações"
              items={npc.reacoes}
              onChange={(next) => patch({ reacoes: next })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatLine({ label, children }) {
  return (
    <div className="text-sm mb-1">
      <span className="font-semibold">{label}: </span>
      {children}
    </div>
  );
}

function BlockList({ label, items, onChange }) {
  const list = items || [];
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-blood-700 border-b border-gold-600 mb-1">{label}</h3>
        <Button onClick={() => onChange([...list, { nome: "", descricao: "" }])}>+</Button>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-ink-700/50 italic">Nenhum item.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((item, i) => (
            <div key={i} className="text-sm flex flex-col gap-1 border-b border-parchment-300 pb-1.5">
              <div className="flex gap-1.5 items-center">
                <TextInput
                  value={item.nome}
                  onChange={(v) => {
                    const next = [...list]; next[i] = { ...item, nome: v }; onChange(next);
                  }}
                  placeholder="Nome"
                  className="!font-bold !italic flex-1"
                />
                <Button variant="danger" onClick={() => onChange(list.filter((_, idx) => idx !== i))}>✕</Button>
              </div>
              <TextArea
                value={item.descricao}
                onChange={(v) => {
                  const next = [...list]; next[i] = { ...item, descricao: v }; onChange(next);
                }}
                rows={2}
                placeholder="Descrição / efeito"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
