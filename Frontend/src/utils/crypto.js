export async function deriveSessionKey(seedText) {
  const enc = new TextEncoder();
  const buf = await window.crypto.subtle.digest('SHA-256', enc.encode(seedText));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deriveNextKey(currentKeyHex) {
  const encoder = new TextEncoder();
  const data = encoder.encode(currentKeyHex + "_ratchet_step");
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function encryptMessageWithKey(plainText, keyHex) {
  const enc = new TextEncoder();
  const sanitizedKeyHex = keyHex.padEnd(64, '0').slice(0, 64);
  const keyBytes = new Uint8Array(sanitizedKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, cryptoKey, enc.encode(plainText)
  );

  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(encrypted))
  };
}

export async function decryptSingleKey(encryptedData, keyHex) {
  try {
    if (typeof encryptedData === 'string') return encryptedData;
    if (!encryptedData || !encryptedData.ciphertext || !encryptedData.iv) {
      return null;
    }

    const ivBytes = Array.isArray(encryptedData.iv) 
      ? new Uint8Array(encryptedData.iv) 
      : (typeof encryptedData.iv === 'string' 
          ? new Uint8Array(encryptedData.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16))) 
          : new Uint8Array(Object.values(encryptedData.iv)));

    const cipherBytes = Array.isArray(encryptedData.ciphertext) 
      ? new Uint8Array(encryptedData.ciphertext) 
      : (typeof encryptedData.ciphertext === 'string' 
          ? new Uint8Array(encryptedData.ciphertext.match(/.{1,2}/g).map(byte => parseInt(byte, 16))) 
          : new Uint8Array(Object.values(encryptedData.ciphertext)));

    const sanitizedKeyHex = keyHex.padEnd(64, '0').slice(0, 64);
    const keyBytes = new Uint8Array(sanitizedKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      cryptoKey,
      cipherBytes
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null; // Silent fail for single key attempts
  }
}

export async function decryptWithKeyRing(encryptedData, keyRingArray) {
  for (const keyHex of keyRingArray) {
    const result = await decryptSingleKey(encryptedData, keyHex);
    if (result !== null) {
      return result;
    }
  }
  return null;
}