import CryptoJS from 'crypto-js';

const encryptionKey = process.env.CRYPTO_KEY || "default";

// Function to encrypt data
export function encrypt(data: object): string {
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
    return ciphertext;
}

// Function to decrypt data
export function decrypt(ciphertext: string): object {
    const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
}

export function hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
}


