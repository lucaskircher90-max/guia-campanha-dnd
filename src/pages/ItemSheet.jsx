import { useNavigate, useParams, Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Card, Checkbox, ConfirmButton, Field, TextArea, TextInput } from "../components/ui";
import { ITEM_RARITIES, ITEM_TYPES } from "../lib/dnd";

export default function ItemSheet() {
  const { id } = useParams();
  const { items, updateItem, removeItem } = useData();
  const navigate = useNavigate();

  const item = items.find((i) => i.id === id);
  if (!item) {
    return (
      <Card>
        <p>Item não encontrado.</p>
        <Link to="/itens" className="text-gold-400 text-sm hover:underline">← Voltar</Link>
      </Card>
    );
  }

  const patch = (fields) => updateItem(item.id, fields);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link to="/itens" className="text-gold-400 text-sm hover:underline">← Itens</Link>
        <ConfirmButton
          onConfirm={() => {
            removeItem(item.id);
            navigate("/itens");
          }}
        >
          Remover Item
        </ConfirmButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome" className="col-span-2">
                <TextInput value={item.nome} onChange={(v) => patch({ nome: v })} className="!text-lg font-display" />
              </Field>
              <Field label="Tipo">
                <select value={item.tipo} onChange={(e) => patch({ tipo: e.target.value })} className="w-full">
                  {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Raridade">
                <select value={item.raridade} onChange={(e) => patch({ raridade: e.target.value })} className="w-full">
                  <option value="">Item Mundano</option>
                  {ITEM_RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Custo">
                <TextInput value={item.custo} onChange={(v) => patch({ custo: v })} placeholder="15 po" />
              </Field>
              <Field label="Peso">
                <TextInput value={item.peso} onChange={(v) => patch({ peso: v })} placeholder="3 lb." />
              </Field>
              <div className="col-span-2">
                <Checkbox
                  checked={item.requerSintonizacao}
                  onChange={(v) => patch({ requerSintonizacao: v })}
                  label="Requer Sintonização"
                />
              </div>
            </div>
          </Card>

          <Card title="Propriedades">
            <TextArea value={item.propriedades} onChange={(v) => patch({ propriedades: v })} rows={2} placeholder="Dano, CA, alcance, características mecânicas..." />
          </Card>

          <Card title="Descrição">
            <TextArea value={item.descricao} onChange={(v) => patch({ descricao: v })} rows={10} placeholder="Aparência, história, efeitos mágicos..." />
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Imagem">
            <Field label="URL da Imagem">
              <TextInput value={item.imagemUrl} onChange={(v) => patch({ imagemUrl: v })} placeholder="https://..." />
            </Field>
            {item.imagemUrl && (
              <img src={item.imagemUrl} alt={item.nome} className="mt-2 max-h-64 rounded border border-ink-600 mx-auto" />
            )}
          </Card>
          {!item.homebrew && (
            <p className="text-xs text-parchment-300/40 italic">
              Item importado do compêndio SRD. Todos os campos são editáveis — sinta-se livre para adaptar ou traduzir.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
