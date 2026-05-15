import { BigNumber } from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import coinConfig from "@ledgerhq/coin-tezos/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import {
  makeAccount,
  ALICE_BAKER_ADDRESS,
  RECIPIENT,
  TEZOS,
  TZKT_MOCK_URL,
} from "../fixtures";
import { buildSigner } from "../signer";
import { getBridges } from "../helpers";
import { fundAccount, spawnFlextesa, killFlextesa, TEZOS_RPC } from "../flextesa";
import { indexBlocks, initMswHandlers, resetIndexer } from "../indexer";

global.console = require("console");
jest.setTimeout(600_000);

let closeMsw: (() => void) | null = null;
let startLevel = 1;
let watchedAddress = "";

type TezosScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

function makeScenarioTransactions(): TezosScenarioTransaction[] {
  const sendOneTez: TezosScenarioTransaction = {
    name: "Send 1 XTZ from unrevealed account",
    amount: new BigNumber(1e6),
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const outOp = currentAccount.operations.find(op => op.type === "OUT");
      expect(outOp).toBeDefined();
      expect(outOp?.recipients).toContain(RECIPIENT);
      expect(currentAccount.balance.isLessThan(previousAccount.balance)).toBe(true);
      const balanceDiff = previousAccount.balance.minus(currentAccount.balance);
      expect(balanceDiff.isGreaterThanOrEqualTo(1e6)).toBe(true);
    },
  };

  const delegate: TezosScenarioTransaction = {
    name: "Delegate to alice baker",
    mode: "delegate",
    recipient: ALICE_BAKER_ADDRESS,
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const delegateOp = currentAccount.operations.find(op => op.type === "DELEGATE");
      expect(delegateOp).toBeDefined();
      expect(delegateOp?.recipients).toContain(ALICE_BAKER_ADDRESS);
    },
  };

  const undelegate: TezosScenarioTransaction = {
    name: "Undelegate",
    mode: "undelegate",
    recipient: "",
    expect: (previousAccount, currentAccount) => {
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const undelegateOp = currentAccount.operations.find(op => op.type === "UNDELEGATE");
      expect(undelegateOp).toBeDefined();
    },
  };

  const sendMax: TezosScenarioTransaction = {
    name: "Send max XTZ",
    useAllAmount: true,
    recipient: RECIPIENT,
    expect: (previousAccount, currentAccount) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const outOps = currentAccount.operations.filter(op => op.type === "OUT");
      expect(outOps.length).toBeGreaterThanOrEqual(previousAccount.operations.filter(op => op.type === "OUT").length + 1);
      expect(currentAccount.balance.toFixed()).toBe(previousAccount.balance.minus(latestOperation.value).toFixed());
    },
  };

  return [sendOneTez, delegate, undelegate, sendMax];
}

export const scenarioTezos: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Tezos — Full scenario",

  setup: async () => {
    setupMockCryptoAssetsStore();

    await spawnFlextesa();

    const signer = await buildSigner();
    watchedAddress = signer.address;

    // Fund the test account with enough XTZ for all transactions
    await fundAccount(signer.address, 20);

    // Wait for funding to confirm
    await new Promise(resolve => setTimeout(resolve, 6_000));

    // Record the current block level so we only index ops from here on
    const headRes = await fetch(`${TEZOS_RPC}/chains/main/blocks/head/header`);
    const head = await headRes.json();
    startLevel = (head as { level: number }).level + 1;

    // Configure the coin module to talk to our local node and mock TzKT.
    const localConfig = {
      status: { type: "active" as const },
      baker: { url: "https://tezos-bakers.api.live.ledger.com" },
      explorer: { url: TZKT_MOCK_URL, maxTxQuery: 100 },
      node: { url: TEZOS_RPC },
      fees: { minGasLimit: 600, minRevealGasLimit: 300, minStorageLimit: 0, minFees: 300, minEstimatedFees: 300 },
    };

    coinConfig.setCoinConfig(() => localConfig);
    LiveConfig.setConfig({
      config_currency_tezos: {
        type: "object",
        default: localConfig,
      },
    });

    closeMsw = initMswHandlers();

    const { currencyBridge, accountBridge, getAddress } = getBridges(signer);

    const { address } = await getAddress("", {
      path: "44'/1729'/0'/0'",
      currency: TEZOS,
      derivationMode: "",
    });

    const account = makeAccount(address);

    return { currencyBridge, accountBridge, account };
  },

  getTransactions: () => makeScenarioTransactions(),
  beforeSync: async () => {
    await indexBlocks(watchedAddress, startLevel);
  },
  beforeAll: account => {
    expect(account.balance.isGreaterThan(new BigNumber(0))).toBe(true);
    expect(account.operations.length).toBe(0);
  },
  afterAll: account => {
    const outOps = account.operations.filter(op => op.type === "OUT");
    expect(outOps.length).toBeGreaterThanOrEqual(1);

    const delegateOps = account.operations.filter(op => op.type === "DELEGATE");
    expect(delegateOps.length).toBeGreaterThanOrEqual(1);

    const undelegateOps = account.operations.filter(op => op.type === "UNDELEGATE");
    expect(undelegateOps.length).toBeGreaterThanOrEqual(1);

    expect(account.balance.isLessThan(new BigNumber(10_000))).toBe(true);
  },

  teardown: async () => {
    closeMsw?.();
    closeMsw = null;
    resetIndexer();
    await killFlextesa();
  },
};
