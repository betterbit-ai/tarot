import {
  deriveManifest,
  formatManifestSummary,
  getProjectRoot,
  parseCliArgs,
} from "./shared";

export async function statusMain(args: string[]): Promise<void> {
  const parsed = parseCliArgs(args);
  const root = getProjectRoot();
  const manifest = await deriveManifest(root);

  if (parsed.json) {
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${formatManifestSummary(manifest)}\n`);
}

statusMain(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
