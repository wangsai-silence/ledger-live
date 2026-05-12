---
"@ledgerhq/coin-evm": patch
---

Fix zkSync L1→L2 priority deposits (receipt type 0xff) producing a null net balance on the user's L2 account. The generic RPC adapter was emitting cancelling self-transfer pairs on both native (tx.value) and the mirrored L2BaseToken (0x...800A) Transfer log. We now prepend a synthesized credit op (peer = L2BaseToken) so the L2 balance reflects the L1→L2 deposit, while preserving the native and L2BaseToken self-transfer pairs (per ADR-016 Case 2).
