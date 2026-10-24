import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Every hex color in a dark source must be mapped in `colors` or listed in
// `keep`, so a new dark color fails here instead of leaking into the light
// variant. Pass --check to compare the light files without writing them.
const variants = [
  {
    source: "assets/hero.svg",
    output: "assets/hero-light.svg",
    colors: {
      "#050d14": "#f8fafc",
      "#07121b": "#ffffff",
      "#09151e": "#edf5f7",
      "#263d49": "#c2d5dd",
      "#91d7da": "#28616a",
      "#b3d4df": "#3d6172",
      "#203449": "#cbd5e1",
      "#2dd4bf": "#0f766e",
      "#5eead4": "#0d9488",
      "#73e7d3": "#0f766e",
      "#f8fafc": "#0f172a",
    },
  },
  {
    source: "assets/stack.svg",
    output: "assets/stack-light.svg",
    colors: {
      "#050d14": "#f8fafc",
      "#07121b": "#ffffff",
      "#09151e": "#edf5f7",
      "#263d49": "#c2d5dd",
      "#2dd4bf": "#0f766e",
      "#5eead4": "#0d9488",
      "#60a5fa": "#2563eb",
      "#94a3b8": "#64748b",
      "#a3b3c9": "#475569",
      "#a78bfa": "#7c3aed",
      "#e2e8f0": "#1e293b",
      "#f8fafc": "#0f172a",
    },
    // Technology brand markers keep their colors in both themes.
    keep: [
      "#00add8",
      "#22d3ee",
      "#2496ed",
      "#38bdf8",
      "#4169e1",
      "#42b883",
      "#4479a1",
      "#777bb4",
      "#a3e635",
      "#dc382d",
      "#ef4444",
      "#f05032",
      "#f97316",
      "#facc15",
    ],
  },
];
const check = process.argv.includes("--check");
const outdated = [];

function applyColorMap(source, colors) {
  const colorPattern = new RegExp(
    Object.keys(colors)
      .map((color) => color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|"),
    "g",
  );

  return source.replace(colorPattern, (color) => colors[color]);
}

function findUnhandledColors(source, variant) {
  const handled = new Set([...Object.keys(variant.colors), ...(variant.keep || [])]);
  const colors = new Set(source.match(/(?<!&)#[0-9a-f]{3,8}\b/gi));

  return [...colors].filter((color) => !handled.has(color)).sort();
}

async function readExisting(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

for (const variant of variants) {
  const sourcePath = resolve(variant.source);
  const outputPath = resolve(variant.output);
  const source = await readFile(sourcePath, "utf8");
  const unhandledColors = findUnhandledColors(source, variant);

  if (unhandledColors.length > 0) {
    throw new Error(
      `${variant.source} has colors with no light mapping: ${unhandledColors.join(", ")}. ` +
        "Map each one in colors, or add it to keep to reuse it unchanged.",
    );
  }

  const themed = applyColorMap(source, variant.colors).replace(
    "\n  <title",
    `\n  <!-- Generated from ${variant.source} by scripts/generate-theme-assets.mjs. -->\n  <title`,
  );

  if (check) {
    if ((await readExisting(outputPath)) !== themed) outdated.push(variant.output);
    continue;
  }

  await writeFile(outputPath, themed, "utf8");
  console.log(`Generated ${outputPath}`);
}

if (outdated.length > 0) {
  console.error(`Out of date: ${outdated.join(", ")}. Run node scripts/generate-theme-assets.mjs.`);
  process.exitCode = 1;
} else if (check) {
  console.log("Light theme variants are up to date.");
}
