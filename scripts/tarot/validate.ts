import { getProjectRoot, validateProjectData } from "./shared";

export async function validateMain(): Promise<void> {
  const summary = await validateProjectData(getProjectRoot());
  process.stdout.write(
    `cards=${summary.totals.cards} combinations=${summary.totals.combinations} batches=${summary.totals.batches} samples=${summary.samples} evalRows=${summary.evalRows} generatedRows=${summary.generatedRows}\n`,
  );
}

validateMain().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
