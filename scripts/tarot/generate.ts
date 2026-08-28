import { deterministicLocalProvider } from "./provider";
import {
  formatGenerationSummary,
  getProjectRoot,
  parseCliArgs,
  runGeneration,
} from "./shared";

export async function generateMain(args: string[]): Promise<void> {
  const parsed = parseCliArgs(args);
  const root = getProjectRoot();
  const result = await runGeneration(root, {
    resume: parsed.resume,
    dryRun: parsed.dryRun,
    from: parsed.from,
    to: parsed.to,
    batch: parsed.batch,
    staleLockMs: parsed.staleLockMs,
    providerName: deterministicLocalProvider.name,
    providerModel: deterministicLocalProvider.model,
    promptVersion: deterministicLocalProvider.promptVersion,
    buildReading: deterministicLocalProvider.buildReading,
  });

  process.stdout.write(`${formatGenerationSummary(result)}\n`);
}

generateMain(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
