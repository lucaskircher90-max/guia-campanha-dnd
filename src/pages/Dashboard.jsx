import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Button, Card, Field, TextInput } from "../components/ui";
import { useLocalStorage } from "../lib/useLocalStorage";
import { BACKUP_FILENAME, downloadBackup, findBackupFile, loadGis, requestAccessToken, uploadBackup } from "../lib/googleDrive";

export default function Dashboard() {
  const { campaign, setCampaign, players, npcs, milestones, encounter } = useData();

  const npcsImportantes = npcs.filter((n) => n.importante);
  const proximosMarcos = milestones.filter((m) => !m.concluido).slice(0, 5);
  const emCombate = encounter?.combatentes?.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-parchment-300/60 text-xs uppercase tracking-widest mb-1">Campanha</p>
          <div className="group relative inline-flex items-center gap-2">
            <TextInput
              value={campaign?.nome}
              onChange={(v) => setCampaign({ ...campaign, nome: v })}
              title="Clique para editar o nome da campanha"
              className="!text-2xl font-display !bg-transparent !border-none !border-b !border-dashed !border-transparent group-hover:!border-parchment-300/30 focus:!border-gold-500 !rounded-none !p-0 text-gold-400 transition-colors"
            />
            <span className="text-sm text-parchment-300/30 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
          </div>
        </div>
        {emCombate && (
          <Link to="/combate" className="animate-pulse">
            <span className="px-3 py-1.5 rounded bg-blood-600 text-parchment-50 text-sm font-semibold">
              ⚔ Combate em andamento — {encounter.combatentes.length} combatentes
            </span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard to="/jogadores" label="Jogadores" value={players.length} icon="🧙" />
        <StatCard to="/npcs" label="NPCs" value={npcs.length} icon="🎭" />
        <StatCard to="/historia" label="Marcos" value={milestones.length} icon="📜" />
        <StatCard to="/combate" label="Combate" value={encounter?.combatentes?.length ?? 0} icon="⚔" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Próximos Marcos da História">
          {proximosMarcos.length === 0 ? (
            <EmptyHint to="/historia" text="Nenhum marco pendente. Adicione um na aba História." />
          ) : (
            <ul className="flex flex-col gap-2">
              {proximosMarcos.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm border-b border-ink-700 pb-1.5">
                  <span>{m.titulo}</span>
                  <span className="text-parchment-300/50 text-xs">{m.sessao ? `Sessão ${m.sessao}` : m.tipo}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/historia" className="text-gold-400 text-xs mt-3 inline-block hover:underline">
            Ver todos os marcos →
          </Link>
        </Card>

        <Card title="NPCs Importantes">
          {npcsImportantes.length === 0 ? (
            <EmptyHint to="/npcs" text="Nenhum NPC importante cadastrado ainda." />
          ) : (
            <ul className="flex flex-col gap-2">
              {npcsImportantes.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <Link to={`/npcs/${n.id}`} className="flex items-center justify-between text-sm border-b border-ink-700 pb-1.5 hover:text-gold-400">
                    <span>{n.nome}</span>
                    <span className="text-parchment-300/50 text-xs">{n.papel || n.tipoTamanhoAlinhamento}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/npcs" className="text-gold-400 text-xs mt-3 inline-block hover:underline">
            Ver todos os NPCs →
          </Link>
        </Card>
      </div>

      <BackupCard />
    </div>
  );
}

function BackupCard() {
  const { exportData, importData, campaign } = useData();
  const fileInputRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [pendingOrigem, setPendingOrigem] = useState("arquivo");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function exportar() {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const slug = (campaign?.nome || "campanha").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const dataStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guia-campanha-${slug}-${dataStr}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function selecionarArquivo() {
    setErro("");
    setSucesso("");
    fileInputRef.current?.click();
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object" || (!data.players && !data.npcs && !data.milestones)) {
          throw new Error("Formato não reconhecido.");
        }
        setPendingOrigem("arquivo");
        setPendingImport(data);
      } catch {
        setErro("Não foi possível ler este arquivo. Verifique se é um backup exportado por esta ferramenta.");
      }
    };
    reader.readAsText(file);
  }

  function confirmarImportacao() {
    importData(pendingImport);
    setPendingImport(null);
    setSucesso("Dados importados com sucesso.");
  }

  return (
    <Card title="Backup da Campanha">
      <p className="text-xs text-parchment-300/60 mb-3">
        Os dados ficam salvos apenas neste navegador. Para usar em outro computador, exporte um arquivo aqui e importe-o lá — ou configure a sincronização com o Google Drive abaixo.
      </p>

      {!pendingImport ? (
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="gold" onClick={exportar}>⬇ Exportar Dados (.json)</Button>
          <Button onClick={selecionarArquivo}>⬆ Importar Dados</Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={onFileChange} />
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-parchment-100">
            {pendingOrigem === "drive" ? "Carregar os dados do Drive vai" : "Importar este arquivo vai"}{" "}
            <span className="text-blood-500 font-semibold">substituir todos os dados atuais</span> neste navegador:
          </p>
          <ul className="text-xs text-parchment-300/70 list-disc list-inside">
            <li>{pendingImport.players?.length ?? 0} jogador(es)</li>
            <li>{pendingImport.npcs?.length ?? 0} NPC(s)</li>
            <li>{pendingImport.milestones?.length ?? 0} marco(s) de história</li>
          </ul>
          <div className="flex gap-2 mt-1">
            <Button variant="primary" onClick={confirmarImportacao}>Confirmar Importação</Button>
            <Button variant="ghost" onClick={() => setPendingImport(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      {erro && <p className="text-xs text-blood-500 mt-2">{erro}</p>}
      {sucesso && <p className="text-xs text-emerald-500 mt-2">{sucesso}</p>}

      <GoogleDriveSync
        exportData={exportData}
        onCarregado={(data) => {
          setErro("");
          setSucesso("");
          setPendingOrigem("drive");
          setPendingImport(data);
        }}
      />
    </Card>
  );
}

function GoogleDriveSync({ exportData, onCarregado }) {
  const [clientId, setClientId] = useLocalStorage("dnd.gdrive.clientId", "");
  const [fileId, setFileId] = useLocalStorage("dnd.gdrive.fileId", "");
  const [lastSync, setLastSync] = useLocalStorage("dnd.gdrive.lastSync", "");
  const [configAberta, setConfigAberta] = useState(!clientId);
  const [token, setToken] = useState("");
  const [conectando, setConectando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [erro, setErro] = useState("");

  const conectado = !!token;

  // Pré-carrega a lib de login do Google assim que há um Client ID, para que o
  // clique em "Conectar" chame requestAccessToken() sem nenhum delay de rede
  // no meio — senão o Chrome pode bloquear o popup por não ver mais o clique
  // como a origem direta da chamada.
  useEffect(() => {
    if (clientId) loadGis().catch(() => {});
  }, [clientId]);

  async function conectar() {
    setErro("");
    setConectando(true);
    try {
      const t = await requestAccessToken(clientId);
      setToken(t);
      if (!fileId) {
        const existente = await findBackupFile(t);
        if (existente) setFileId(existente.id);
      }
    } catch (err) {
      setErro(err.message || "Não foi possível conectar ao Google.");
    } finally {
      setConectando(false);
    }
  }

  async function salvarNoDrive() {
    setErro("");
    setSincronizando(true);
    try {
      const json = JSON.stringify(exportData(), null, 2);
      const id = await uploadBackup(token, fileId, json);
      setFileId(id);
      setLastSync(new Date().toISOString());
    } catch (err) {
      setErro(err.message || "Falha ao salvar no Google Drive.");
    } finally {
      setSincronizando(false);
    }
  }

  async function carregarDoDrive() {
    setErro("");
    setSincronizando(true);
    try {
      let id = fileId;
      if (!id) {
        const existente = await findBackupFile(token);
        if (!existente) throw new Error(`Nenhum backup encontrado no Drive ainda (arquivo "${BACKUP_FILENAME}"). Use "Salvar no Drive" primeiro.`);
        id = existente.id;
        setFileId(id);
      }
      const data = await downloadBackup(token, id);
      onCarregado(data);
      setLastSync(new Date().toISOString());
    } catch (err) {
      setErro(err.message || "Falha ao carregar do Google Drive.");
    } finally {
      setSincronizando(false);
    }
  }

  return (
    <div className="mt-4 pt-3 border-t border-ink-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display text-gold-400">☁ Sincronização com Google Drive</h3>
        <button onClick={() => setConfigAberta((v) => !v)} className="text-xs text-parchment-300/50 hover:text-gold-400">
          {configAberta ? "ocultar configuração" : "⚙ configurar"}
        </button>
      </div>

      {configAberta && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-[11px] text-parchment-300/50 leading-relaxed">
            Para sincronizar sem servidor, o app usa login direto com sua conta Google (escopo restrito ao próprio arquivo de backup, sem acesso ao resto do seu Drive). Isso exige um "Client ID" OAuth criado por você, de graça, no Google Cloud Console:
          </p>
          <ol className="text-[11px] text-parchment-300/50 list-decimal list-inside leading-relaxed">
            <li>Acesse console.cloud.google.com e crie um projeto.</li>
            <li>Em "APIs e Serviços" → "Biblioteca", ative a <b>Google Drive API</b>.</li>
            <li>Em "Tela de consentimento OAuth", escolha "Externo", preencha nome/e-mail e adicione seu próprio e-mail como usuário de teste (não precisa publicar).</li>
            <li>Em "Credenciais" → "Criar credenciais" → "ID do cliente OAuth", tipo "Aplicativo da Web".</li>
            <li>Em "Origens JavaScript autorizadas", adicione a URL deste site (ex: <code>https://lucaskircher90-max.github.io</code>).</li>
            <li>Copie o Client ID gerado (termina em <code>.apps.googleusercontent.com</code>) e cole abaixo.</li>
          </ol>
          <Field label="Google OAuth Client ID">
            <TextInput value={clientId} onChange={setClientId} placeholder="algo.apps.googleusercontent.com" />
          </Field>
          <p className="text-[11px] text-parchment-300/40">
            Precisa ser configurado uma vez em cada navegador/computador (é uma informação pública, não secreta).
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-2">
        {!conectado ? (
          <Button onClick={conectar} disabled={!clientId || conectando}>
            {conectando ? "Conectando..." : "🔌 Conectar ao Google Drive"}
          </Button>
        ) : (
          <>
            <Button variant="gold" onClick={salvarNoDrive} disabled={sincronizando}>
              {sincronizando ? "Enviando..." : "☁ Salvar no Drive"}
            </Button>
            <Button onClick={carregarDoDrive} disabled={sincronizando}>
              {sincronizando ? "Carregando..." : "⬇ Carregar do Drive"}
            </Button>
            <Button variant="ghost" onClick={() => setToken("")}>Desconectar</Button>
          </>
        )}
        {lastSync && <span className="text-[11px] text-parchment-300/40">Última sincronização: {new Date(lastSync).toLocaleString("pt-BR")}</span>}
      </div>

      {erro && <p className="text-xs text-blood-500 mt-2">{erro}</p>}
    </div>
  );
}

function StatCard({ to, label, value, icon }) {
  return (
    <Link to={to} className="card p-4 flex items-center gap-3 hover:border-gold-500 transition-colors">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-2xl font-display text-parchment-50 leading-none">{value}</p>
        <p className="text-xs text-parchment-300/60 uppercase tracking-wide">{label}</p>
      </div>
    </Link>
  );
}

function EmptyHint({ to, text }) {
  return (
    <Link to={to} className="text-sm text-parchment-300/50 hover:text-gold-400 block">
      {text}
    </Link>
  );
}
