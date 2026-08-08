// Integração client-side com o Google Drive (sem backend).
// Usa o Google Identity Services para obter um token de acesso OAuth com o
// escopo "drive.file", que só concede acesso aos arquivos criados por este
// app — nunca ao Drive inteiro do usuário.

const GIS_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

export const BACKUP_FILENAME = "guia-campanha-dnd-backup.json";

let gisLoadPromise = null;
function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar a biblioteca de login do Google."));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

export async function requestAccessToken(clientId) {
  if (!clientId?.trim()) throw new Error("Informe o Client ID do Google antes de conectar.");
  await loadGis();
  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: SCOPE,
        callback: (resp) => {
          if (resp.error) reject(new Error(resp.error_description || resp.error));
          else resolve(resp.access_token);
        },
        error_callback: (err) => {
          reject(new Error(err?.message || "Login com Google cancelado ou não autorizado."));
        },
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
}

async function driveFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Sessão do Google expirou. Conecte novamente.");
    throw new Error(`Erro na API do Google Drive (${res.status}): ${text || res.statusText}`);
  }
  return res;
}

export async function findBackupFile(token) {
  const q = encodeURIComponent(`name='${BACKUP_FILENAME}' and trashed=false`);
  const res = await driveFetch(`${DRIVE_FILES_URL}?q=${q}&fields=files(id,modifiedTime)&spaces=drive`, token);
  const data = await res.json();
  return data.files?.[0] || null;
}

export async function uploadBackup(token, fileId, jsonString) {
  if (fileId) {
    await driveFetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: jsonString,
    });
    return fileId;
  }
  const boundary = "guia_campanha_dnd_boundary";
  const metadata = { name: BACKUP_FILENAME, mimeType: "application/json" };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonString}\r\n--${boundary}--`;
  const res = await driveFetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id`, token, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  const data = await res.json();
  return data.id;
}

export async function downloadBackup(token, fileId) {
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, token);
  return res.json();
}

export async function getFileMeta(token, fileId) {
  const res = await driveFetch(`${DRIVE_FILES_URL}/${fileId}?fields=modifiedTime`, token);
  return res.json();
}
