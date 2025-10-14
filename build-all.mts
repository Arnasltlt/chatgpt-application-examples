import { build } from "vite";
import { resolve } from "node:path";

const targets = ["your-ai-council"] as const;

const rootDir = resolve(".");

async function buildTarget(target: (typeof targets)[number]) {
  const targetRoot = resolve(rootDir, target);
  await build({
    configFile: resolve(targetRoot, "vite.config.mts"),
    build: {
      outDir: resolve(targetRoot, "assets"),
      emptyOutDir: false,
    },
  });
  // eslint-disable-next-line no-console
  console.log(`Built ${target}`);
}

async function main() {
  for (const target of targets) {
    await buildTarget(target);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});

