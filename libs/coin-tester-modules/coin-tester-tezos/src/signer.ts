import { ed25519 } from "@noble/curves/ed25519";
import { blake2b } from "@noble/hashes/blake2b";
import { sha256 } from "@noble/hashes/sha2";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";

/**
 * Test signer matching the TezosSigner interface expected by the generic coin framework
 * (`live-common/bridge/generic-coin-framework/families/tezos/signer.ts`).
 *
 * Implemented without `@taquito/signer` to avoid its UMD bundle's dependency on
 * `bn.js`, which is not available in Jest's module resolver.
 */
export type TezosTestSigner = {
  getAddress(
    path: string,
    options?: { verify?: boolean; derivationMode?: string },
  ): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(
    path: string,
    rawTxHex: string,
    options?: { derivationMode?: string },
  ): Promise<string>;
  readonly address: string;
  readonly publicKey: string;
  readonly mnemonic: string;
};

// Tezos base58 alphabet (same as Bitcoin)
const BASE58_ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(data: Uint8Array): string {
  const digits: number[] = [];
  for (const byte of data) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let result = "";
  for (let i = 0; i < data.length && data[i] === 0; i++) result += "1";
  return result + digits.reverse().map(d => BASE58_ALPHA[d]).join("");
}

/**
 * Standard Tezos base58check: prefix || payload || sha256(sha256(prefix || payload))[0:4]
 * then base58-encoded.
 */
function tezBase58Check(prefix: Uint8Array, payload: Uint8Array): string {
  const pl = new Uint8Array(prefix.length + payload.length);
  pl.set(prefix);
  pl.set(payload, prefix.length);
  const checksum = sha256(sha256(pl)).slice(0, 4);
  const out = new Uint8Array(pl.length + 4);
  out.set(pl);
  out.set(checksum, pl.length);
  return base58Encode(out);
}

// Human-readable prefix bytes for Tezos encoding
// tz1 = Ed25519 public key hash
const TZ1_PREFIX = new Uint8Array([0x06, 0xa1, 0x9f]);
// edpk = Ed25519 public key
const EDPK_PREFIX = new Uint8Array([0x0d, 0x0f, 0x25, 0xd9]);

/**
 * Builds a test signer from a fresh BIP39 mnemonic.
 *
 * Key derivation deliberately skips SLIP-10 path derivation: the first 32
 * bytes of the BIP39 seed are used directly as the Ed25519 private key.
 * For testing purposes this is sufficient — the address is always valid and
 * the key can sign transactions that the local Flextesa node will accept.
 *
 * `signTransaction` receives `rawTxHex` from `rawEncode`, which already
 * includes the `0x03` manager watermark prefix. We must NOT add it again.
 * The signature (raw 64 bytes as hex) is returned and later appended to
 * the forged bytes by `combine()` (which also strips the watermark prefix).
 *
 * `getAddress` intentionally returns `publicKey` in the raw hex format that
 * the real Ledger Tezos app produces: a 33-byte buffer where the first byte
 * is the curve identifier (0x00 = Ed25519) followed by the 32-byte public
 * key. This ensures `normalizePublicKeyForAddress` in the production signer
 * is exercised by the coin tester, so regressions in that function are caught.
 */
export async function buildSigner(): Promise<TezosTestSigner> {
  const mnemonic = generateMnemonic();
  const seed = mnemonicToSeedSync(mnemonic);
  const privateKey = seed.slice(0, 32);

  const pubKeyBytes = ed25519.getPublicKey(privateKey);
  const address = tezBase58Check(TZ1_PREFIX, blake2b(pubKeyBytes, { dkLen: 20 }));

  // The real Ledger Tezos app prepends the curve byte (0x00 for Ed25519) to
  // the 32-byte public key and returns the whole thing as a hex string.
  const publicKeyHex = Buffer.from([0x00, ...pubKeyBytes]).toString("hex");

  // Keep a base58 copy for internal use (e.g. signing — Taquito expects edpk…)
  const publicKey = tezBase58Check(EDPK_PREFIX, pubKeyBytes);

  return {
    mnemonic,
    address,
    publicKey,

    async getAddress(path: string) {
      // Return the hex form so normalizePublicKeyForAddress is exercised,
      // matching what hw-app-tezos returns from a real Ledger device.
      return { path, address, publicKey: publicKeyHex };
    },

    async signTransaction(_path: string, rawTxHex: string) {
      // rawTxHex is "03" + forged_bytes_hex (watermark already prepended by rawEncode)
      const txBytes = Buffer.from(rawTxHex.replace(/^0x/, ""), "hex");
      const hash = blake2b(txBytes, { dkLen: 32 });
      const signature = ed25519.sign(hash, privateKey);
      return Buffer.from(signature).toString("hex");
    },
  };
}
