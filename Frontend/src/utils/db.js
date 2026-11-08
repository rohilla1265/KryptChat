const DB_NAME = 'KryptChat_LocalDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalMessage(msg) {
  try {
    const db = await openDB();
    const tx = db.transaction('messages', 'readwrite');
    tx.objectStore('messages').add(msg);
  } catch (err) {
    console.error("IndexedDB Save Error:", err);
  }
}

export async function getLocalMessagesByRoom(roomId) {
  try {
    const db = await openDB();
    const tx = db.transaction('messages', 'readonly');
    const store = tx.objectStore('messages');
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        resolve(all.filter(m => m.roomId === roomId));
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.error("IndexedDB Fetch Error:", err);
    return [];
  }
}