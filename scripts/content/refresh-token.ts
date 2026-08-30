import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getThreadsTokenConfig } from "../../src/lib/content/config";
import { refreshThreadsToken } from "../../src/lib/content/token";

const stateFile = resolve(process.cwd(), "generation/threads-token.json");
const result = await refreshThreadsToken(getThreadsTokenConfig());
if (result.token) await writeFile(stateFile, `${JSON.stringify(result.token, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ ...result, token: result.token ? { refreshedAt: result.token.refreshedAt, expiresAt: result.token.expiresAt } : undefined }, null, 2)}\n`);
if (result.mode === "failed") process.exitCode = 1;
