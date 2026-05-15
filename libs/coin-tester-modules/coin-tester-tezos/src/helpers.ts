import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { getAlpacaCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getAlpacaAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { tezosGetAddress } from "@ledgerhq/live-common/bridge/generic-coin-framework/families/tezos/signer";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import type { TezosTestSigner } from "./signer";

registerCoinModules(coinModuleLoaders);

export function getBridges(signer: TezosTestSigner): {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
  getAddress: GetAddressFn;
} {
  const context: SignerContext<TezosTestSigner> = (_, fn) => fn(signer);
  const getAddress = tezosGetAddress(context);

  return {
    currencyBridge: getAlpacaCurrencyBridge("tezos", "local", { context, getAddress }),
    accountBridge: getAlpacaAccountBridge("tezos", "local", { context, getAddress }),
    getAddress,
  };
}
