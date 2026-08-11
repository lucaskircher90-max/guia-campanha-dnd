// Armazenamento das cartas de Tarot via IndexedDB. O localStorage (usado
// pelo resto do app) tem uma cota pequena (poucos MB, compartilhada entre
// tudo que o app salva) e falha silenciosamente quando estoura — foi o que
// fazia o baralho "perder" cartas e descrições ao atualizar a página. O
// IndexedDB tem uma cota muito maior e é o lugar certo pra guardar imagens.

const DB_NAME = "guia-campanha-dnd";
const DB_VERSION = 1;
const STORE_TAROT = "tarotCards";

function openDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB não disponível neste navegador."));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_TAROT)) {
        db.createObjectStore(STORE_TAROT, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function tarotGetAll() {
  const db = await openDb();
  const tx = db.transaction(STORE_TAROT, "readonly");
  const result = await reqToPromise(tx.objectStore(STORE_TAROT).getAll());
  return result || [];
}

export async function tarotPut(card) {
  const db = await openDb();
  const tx = db.transaction(STORE_TAROT, "readwrite");
  tx.objectStore(STORE_TAROT).put(card);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function tarotDelete(id) {
  const db = await openDb();
  const tx = db.transaction(STORE_TAROT, "readwrite");
  tx.objectStore(STORE_TAROT).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function tarotBulkReplace(cards) {
  const db = await openDb();
  const tx = db.transaction(STORE_TAROT, "readwrite");
  const store = tx.objectStore(STORE_TAROT);
  store.clear();
  for (const card of cards) store.put(card);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
