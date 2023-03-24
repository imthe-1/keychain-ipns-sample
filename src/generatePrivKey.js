import elliptic, { eddsa as EdDSA } from "elliptic";

const ec = new EdDSA("ed25519");

function toHex(arr) {
    return elliptic.utils.toHex(arr).toUpperCase();
}

function fromHex(hex) {
    return elliptic.utils.toArray(hex, "hex");
}

function generateKey() {
    let secret;

    if (window.crypto && window.crypto.getRandomValues) {
        secret = new Uint8Array(256);
        window.crypto.getRandomValues(secret);
    } else {
        console.warn("Warning: Using insecure methods to generate private key");
        secret = [];
        for (let i = 0; i < 256; i++) {
            secret.push(Math.random() * 9007199254740991); // aka Number.MAX_SAFE_INTEGER
        }
    }

    const key = ec.keyFromSecret(secret);

    // Save keys to localStorage
    const privateKey = toHex(key.getSecret());
    console.log("[Ed25519 Private key]", privateKey);
    const publicKey = toHex(key.getPublic());
}

generateKey();

