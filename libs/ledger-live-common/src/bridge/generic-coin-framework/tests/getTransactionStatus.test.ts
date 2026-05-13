import BigNumber from "bignumber.js";
import { genericGetTransactionStatus } from "../getTransactionStatus";
import { getAlpacaApi } from "../api";
import * as utils from "../utils";

jest.mock("../api", () => ({
  getAlpacaApi: jest.fn(),
}));

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  transactionToIntent: jest.fn(),
  extractBalances: jest.fn(),
}));

const mockTransactionToIntent = utils.transactionToIntent as jest.Mock;
const mockExtractBalances = utils.extractBalances as jest.Mock;

describe("genericGetTransactionStatus", () => {
  const account = {
    id: "test-account",
    currency: { id: "ethereum" },
    pendingOperations: [],
  } as any;

  const validatedAmount = 1000n;
  const validateIntentResult = {
    errors: {},
    warnings: {},
    estimatedFees: 50n,
    amount: validatedAmount,
    totalSpent: 1050n,
    totalFees: 50n,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactionToIntent.mockReturnValue({ intent: true });
    mockExtractBalances.mockReturnValue({});
    (getAlpacaApi as jest.Mock).mockReturnValue({
      validateIntent: jest.fn().mockResolvedValue(validateIntentResult),
    });
  });

  it.each([
    ["useAllAmount is true", new BigNumber(999), true, new BigNumber(validatedAmount.toString())],
    ["amount is 0", new BigNumber(0), false, new BigNumber(validatedAmount.toString())],
    [
      "useAllAmount is false and amount > 0",
      new BigNumber(500),
      false,
      new BigNumber(validatedAmount.toString()),
    ],
  ])(
    "returns validated amount from validateIntent when %s",
    async (_label, txAmount, useAllAmount, expected) => {
      const getStatus = genericGetTransactionStatus("mainnet", "evm");
      const result = await getStatus(account, {
        amount: txAmount,
        useAllAmount,
        recipient: "0x",
        family: "evm",
      } as any);

      expect(result.amount).toEqual(expected);
    },
  );

  it("forwards a destination tag through transactionToIntent to validateIntent", async () => {
    const realUtils = jest.requireActual("../utils");
    mockTransactionToIntent.mockImplementation(realUtils.transactionToIntent);

    const validateIntent = jest.fn().mockResolvedValue(validateIntentResult);
    (getAlpacaApi as jest.Mock).mockReturnValue({ validateIntent });

    const xrpAccount = {
      ...account,
      freshAddress: "rSender",
      currency: { id: "ripple", name: "ripple", units: [{ name: "ripple", code: "XRP" }] },
    };

    const getStatus = genericGetTransactionStatus("mainnet", "xrp");
    await getStatus(xrpAccount, {
      amount: new BigNumber(100),
      useAllAmount: false,
      recipient: "rRecipient",
      family: "xrp",
      tag: 1234,
    } as any);

    expect(validateIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        memo: { type: "map", memos: new Map([["destinationTag", "1234"]]) },
      }),
      expect.anything(),
      expect.anything(),
    );
  });
});
