// Encrypts the private people list (kept OUTSIDE the repo) into public/people.enc.json with AES-256-GCM.
// Only someone holding the key (Tuệ Minh, via her private link #/people?k=…) can read it.
// usage: node tools/encrypt-people.mjs /path/to/people.json /path/to/keyfile
import { readFileSync, writeFileSync, existsSync } from "fs";
import { webcrypto as C } from "crypto";
const [src, keyFile] = process.argv.slice(2);
const b64u = b => Buffer.from(b).toString("base64url");
let raw = existsSync(keyFile) ? Buffer.from(readFileSync(keyFile, "utf8").trim(), "base64url") : C.getRandomValues(new Uint8Array(32));
if (!existsSync(keyFile)) writeFileSync(keyFile, b64u(raw));
const key = await C.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]), iv = C.getRandomValues(new Uint8Array(12));
const ct = await C.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(readFileSync(src, "utf8")));
writeFileSync("public/people.enc.json", JSON.stringify({ v: 1, iv: b64u(iv), ct: b64u(new Uint8Array(ct)) }));
console.log("encrypted", JSON.parse(readFileSync(src, "utf8")).length, "people");
