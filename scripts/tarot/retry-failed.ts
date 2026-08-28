import { deterministicLocalProvider } from "./provider";
import {
  formatGenerationSummary,
  getProjectRoot,
  parseCliArgs,
  retryFailedBatches,
} from "./shared";

export async function retryFailedMain(args: string[]): Promise<void> {
  const parsed = parseCliArgs(args);
  const root = getProjectRoot();
  const result = await retryFailedBatches(root, {
    resume: true,
    dryRun: parsed.dryRun,
    staleLockMs: parsed.staleLockMs,
    providerName: deterministicLocalProvider.name,
    providerModel: deterministicLocalProvider.model,
    promptVersion: deterministicLocalProvider.promptVersion,
    buildReading: deterministicLocalProvider.buildReading,
  });

  process.stdout.write(`${formatGenerationSummary(result)}\n`);
}

retryFailedMain(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
