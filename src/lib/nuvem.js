// Salvamento na nuvem (Supabase), sem login por e-mail.
//
// - LER é aberto: qualquer aparelho que abrir o site carrega os dados sozinho.
// - GRAVAR exige um PIN de edição, digitado uma única vez por aparelho
//   (fica guardado no navegador). Sem PIN o site funciona em modo leitura.
// - Cada coleção (jogadores, NPCs, marcos...) é uma linha na tabela
//   `guia_dados`; só as que mudaram são enviadas/baixadas.
// - Se a nuvem não responder, nada se perde: tudo continua salvo no navegador
//   e é enviado quando a conexão voltar.
//
// O banco só é acessado por funções (RPC) criadas em supabase/guia-schema.sql.

const URL_PADRAO = "https://umhtvicnmiiiiubefyzo.supabase.co";
// Chave "publishable": pública por natureza. Quem protege a gravação é o PIN
// conferido dentro do banco.
const CHAVE_PUBLICA = "sb_publishable_iLwH3L5f-eFCRTyRRDc7Rg_JMEzTJsV";

const LS_ESTADO = "dnd.sync";
const ATRASO_ENVIO_MS = 1800;
const INTERVALO_PULL_MS = 60000;

function baseUrl() {
  try {
    return (window.localStorage.getItem("dnd.nuvemUrl") || URL_PADRAO).replace(/\/$/, "");
  } catch {
    return URL_PADRAO;
  }
}

async function rpc(nome, args = {}) {
  const res = await fetch(`${baseUrl()}/rest/v1/rpc/${nome}`, {
    method: "POST",
    headers: { apikey: CHAVE_PUBLICA, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    const err = new Error(texto || res.statusText);
    err.status = res.status;
    throw err;
  }
  const texto = await res.text();
  return texto ? JSON.parse(texto) : null;
}

// ---------- estado persistido ----------
function lerEstado() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(LS_ESTADO) || "{}");
    return { pin: "", ts: {}, sujo: {}, ...raw };
  } catch {
    return { pin: "", ts: {}, sujo: {} };
  }
}
function gravarEstado(e) {
  try {
    window.localStorage.setItem(LS_ESTADO, JSON.stringify(e));
  } catch {
    /* sem armazenamento: segue sem persistir o estado */
  }
}

// ---------- estado público (para a interface) ----------
let publico = { fase: "inicio", mensagem: "", temPin: false, ultima: null, pendentes: 0 };
const ouvintes = new Set();
function atualizarPublico(patch) {
  publico = { ...publico, ...patch };
  ouvintes.forEach((f) => f());
}
export function assinar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}
export function estadoAtual() {
  return publico;
}

// ---------- registro de coleções ----------
const handlers = new Map(); // chave -> { get, set, inicial }
const remotoPendente = new Map(); // chave -> timestamp (ignora o próximo efeito de mudança)
let estado = lerEstado();
let timerEnvio = null;
let emAndamento = false;

function igual(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function registrar(chave, handler) {
  handlers.set(chave, handler);
}

export function consumirRemoto(chave) {
  const t = remotoPendente.get(chave);
  if (!t) return false;
  remotoPendente.delete(chave);
  return Date.now() - t < 3000;
}

export function marcarSujo(chave) {
  estado.sujo[chave] = true;
  gravarEstado(estado);
  atualizarPublico({ pendentes: Object.keys(estado.sujo).length });
  clearTimeout(timerEnvio);
  timerEnvio = setTimeout(() => sincronizar({ soEnvio: true }), ATRASO_ENVIO_MS);
}

export function definirPin(pin) {
  estado.pin = (pin || "").trim();
  gravarEstado(estado);
  atualizarPublico({ temPin: !!estado.pin });
  return sincronizar();
}

export function temPin() {
  return !!estado.pin;
}

function mensagemErro(err) {
  if (err?.status === 404) return "A nuvem ainda não foi configurada (falta rodar o SQL no Supabase).";
  if (/PIN/i.test(err?.message || "")) return "PIN incorreto.";
  return "Sem conexão com a nuvem. Tudo continua salvo neste aparelho.";
}

export async function sincronizar({ soEnvio = false } = {}) {
  if (emAndamento) return;
  emAndamento = true;
  estado = lerEstado();
  atualizarPublico({ fase: "sincronizando", mensagem: "", temPin: !!estado.pin });
  try {
    if (!soEnvio) {
      const meta = await rpc("guia_listar");
      const remotos = new Map((meta || []).map((m) => [m.chave, m.atualizado]));
      for (const [chave, h] of handlers) {
        const rts = remotos.get(chave);
        if (!rts) continue;
        const local = estado.ts[chave];
        const sujo = !!estado.sujo[chave];
        if (sujo && estado.pin) continue; // edição local pendente vence; será enviada abaixo
        if (local && new Date(rts) <= new Date(local)) continue; // já está em dia
        const valor = await rpc("guia_ler_chave", { p_chave: chave });
        if (valor === null || valor === undefined) continue;
        if (!local) {
          // primeiro contato deste aparelho: guarda cópia do que havia antes
          const atual = h.get();
          if (!igual(atual, h.inicial)) {
            try {
              window.localStorage.setItem(`dnd.preSync.${chave}`, JSON.stringify(atual));
            } catch {
              /* ignora */
            }
          }
        }
        if (!igual(valor, h.get())) {
          remotoPendente.set(chave, Date.now());
          h.set(valor);
        }
        estado.ts[chave] = rts;
        delete estado.sujo[chave];
      }
      // primeiro envio: coleções que existem só neste aparelho
      for (const [chave, h] of handlers) {
        if (!remotos.has(chave) && !igual(h.get(), h.inicial)) estado.sujo[chave] = true;
      }
      gravarEstado(estado);
    }
    // envio
    const sujas = Object.keys(estado.sujo).filter((c) => handlers.has(c));
    if (sujas.length && !estado.pin) {
      atualizarPublico({ fase: "sem-pin", mensagem: "", pendentes: sujas.length });
    } else {
      for (const chave of sujas) {
        const novo = await rpc("guia_gravar", {
          p_pin: estado.pin,
          p_chave: chave,
          p_valor: handlers.get(chave).get(),
        });
        estado.ts[chave] = novo;
        delete estado.sujo[chave];
        gravarEstado(estado);
      }
      atualizarPublico({
        fase: estado.pin ? "ok" : "leitura",
        mensagem: "",
        ultima: new Date(),
        pendentes: Object.keys(estado.sujo).length,
      });
    }
  } catch (err) {
    const pinErrado = /PIN/i.test(err?.message || "");
    if (pinErrado) {
      estado.pin = "";
      gravarEstado(estado);
    }
    atualizarPublico({
      fase: pinErrado ? "pin-errado" : err?.status === 404 ? "nao-configurada" : "erro",
      mensagem: mensagemErro(err),
      temPin: !!estado.pin,
      pendentes: Object.keys(estado.sujo).length,
    });
  } finally {
    emAndamento = false;
  }
}

let iniciado = false;
export function iniciar() {
  if (iniciado) return;
  iniciado = true;
  estado = lerEstado();
  atualizarPublico({ temPin: !!estado.pin, pendentes: Object.keys(estado.sujo).length });
  sincronizar();
  let ultimoPull = Date.now();
  const puxar = () => {
    if (document.visibilityState !== "visible") return;
    if (Date.now() - ultimoPull < 20000) return;
    ultimoPull = Date.now();
    sincronizar();
  };
  document.addEventListener("visibilitychange", puxar);
  window.addEventListener("focus", puxar);
  setInterval(puxar, INTERVALO_PULL_MS);
}
