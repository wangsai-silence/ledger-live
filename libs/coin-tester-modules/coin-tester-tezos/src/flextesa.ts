import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import * as compose from "docker-compose";

const execAsync = promisify(exec);

export const TEZOS_RPC = "http://127.0.0.1:20000";

export async function spawnFlextesa(): Promise<void> {
  console.log("Starting Tezos sandbox (Flextesa)...");
  await compose.upOne("tezos", {
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--wait"],
  });
  // The Docker health check only verifies the HTTP RPC endpoint.
  // octez-client (bootstrap key import + protocol activation) finishes
  // slightly later. Poll until `get balance for alice` succeeds.
  const checkCmd = "docker exec tezos-sandbox octez-client get balance for alice";
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await execAsync(checkCmd, { timeout: 5_000 });
      break;
    } catch {
      await new Promise(r => setTimeout(r, 2_000));
    }
  }
  console.log(chalk.bgBlueBright(" -  TEZOS READY ✅  - "));
}

export async function killFlextesa(): Promise<void> {
  console.log("Stopping Tezos sandbox...");
  await compose.down({
    cwd: __dirname,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans", "--volumes"],
  });
}

/**
 * Transfers XTZ from alice (Flextesa bootstrap account) to a target address.
 * Uses `docker exec` to invoke the pre-configured `octez-client` inside the
 * tezos-sandbox container. Alice is pre-funded with millions of XTZ.
 */
export async function fundAccount(address: string, amountTez: number): Promise<void> {
  const cmd = `docker exec tezos-sandbox octez-client transfer ${amountTez} from alice to ${address} --burn-cap 0.5`;
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 60_000 });
    if (process.env.DEBUG) {
      console.log("fundAccount stdout:", stdout);
      if (stderr) console.log("fundAccount stderr:", stderr);
    }
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string };
    throw new Error(`Failed to fund ${address}: ${e.stderr ?? e.message}`);
  }
}

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killFlextesa();
  }),
);
