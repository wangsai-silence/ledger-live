import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioTezos } from "./scenarii/tezos";
import { killFlextesa } from "./flextesa";

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killFlextesa();
  }),
);

describe("Tezos Deterministic Tester", () => {
  it("scenario Tezos", async () => {
    try {
      await executeScenario(scenarioTezos);
    } catch (e) {
      if (e !== "done") {
        await killFlextesa();
        throw e;
      }
    }
  });
});
