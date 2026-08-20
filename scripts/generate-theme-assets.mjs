import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const variants = [
  {
    source: "assets/hero.svg",
    output: "assets/hero-light.svg",
    colors: {
      "#05080f": "#f8fafc",
      "#07101a": "#ffffff",
      "#080f19": "#f8fafc",
      "#08111c": "#ffffff",
      "#08111d": "#f1f5f9",
      "#091624": "#e8f1f7",
      "#0d9488": "#0f766e",
      "#172538": "#cbd5e1",
      "#1b2c3e": "#cbd5e1",
      "#1c2c3e": "#d7e1ea",
      "#1e3042": "#d2dde8",
      "#203449": "#cbd5e1",
      "#28475a": "#94a3b8",
      "#2dd4bf": "#0f766e",
      "#38bdf8": "#0284c7",
      "#5eead4": "#0d9488",
      "#5f7488": "#64748b",
      "#60758a": "#475569",
      "#73e7d3": "#0f766e",
      "#8ca5b8": "#64748b",
      "#8da2b5": "#475569",
      "#99f6e4": "#14b8a6",
      "#9bb4c7": "#64748b",
      "#c7d6df": "#334155",
      "#c9d5df": "#1e293b",
      "#d9fff8": "#115e59",
      "#f8fafc": "#0f172a",
    },
  },
  {
    source: "assets/stack.svg",
    output: "assets/stack-light.svg",
    colors: {
      "#07101f": "#f8fafc",
      "#0b1328": "#eef4f8",
      "#0f172a": "#ffffff",
      "#24324a": "#cbd5e1",
      "#2dd4bf": "#0f766e",
      "#334155": "#cbd5e1",
      "#5eead4": "#0d9488",
      "#60a5fa": "#2563eb",
      "#64748b": "#475569",
      "#94a3b8": "#64748b",
      "#a78bfa": "#7c3aed",
      "#e2e8f0": "#1e293b",
      "#f8fafc": "#0f172a",
    },
  },
];

function applyColorMap(source, colors) {
  const colorPattern = new RegExp(
    Object.keys(colors)
      .map((color) => color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|"),
    "g",
  );

  return source.replace(colorPattern, (color) => colors[color]);
}

for (const variant of variants) {
  const sourcePath = resolve(variant.source);
  const outputPath = resolve(variant.output);
  const source = await readFile(sourcePath, "utf8");
  const themed = applyColorMap(source, variant.colors).replace(
    "\n  <title",
    `\n  <!-- Generated from ${variant.source} by scripts/generate-theme-assets.mjs. -->\n  <title`,
  );

  await writeFile(outputPath, themed, "utf8");
  console.log(`Generated ${outputPath}`);
}
