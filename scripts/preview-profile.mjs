import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

// Run from the repository: node scripts/preview-profile.mjs
// GitHub renders the public README once; SVGs are read from the working tree.
const root = new URL("../", import.meta.url);
const port = Number(process.env.PROFILE_PREVIEW_PORT || 4173);
const assets = new Set([
  "/assets/hero.svg",
  "/assets/hero-light.svg",
  "/assets/stack.svg",
  "/assets/stack-light.svg",
  "/assets/icons/terminal.svg",
  "/assets/icons/layers.svg",
  "/assets/icons/settings.svg",
]);
let cachedMarkdown;
let cachedPage;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PROFILE_PREVIEW_PORT must be an integer between 1 and 65535.");
}

async function renderPage() {
  const markdown = await readFile(new URL("README.md", root), "utf8");
  if (markdown === cachedMarkdown) return cachedPage;

  const response = await fetch("https://api.github.com/markdown", {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "wheakerd-profile-preview",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ text: markdown, mode: "markdown" }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`GitHub Markdown rendering failed (${response.status}).`);
  }

  const content = await response.text();
  const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Wheakerd — local profile preview</title>
  <link rel="stylesheet" href="/scripts/profile-preview.css">
</head>
<body>
  <article>${content}</article>
  <script>
    // GitHub's renderer adds links around images. A local browser needs the
    // fallback image directly inside <picture> for source selection to work.
    for (const picture of document.querySelectorAll("picture")) {
      const link = picture.querySelector("a");
      const image = link?.querySelector("img");
      if (image) link.replaceWith(image);
    }
    // GitHub adds this prefix to heading IDs and resolves fragments in its UI.
    for (const anchor of document.querySelectorAll('.markdown-heading .anchor[id^="user-content-"]')) {
      anchor.parentElement.id = anchor.id.slice("user-content-".length);
    }
  </script>
</body>
</html>`;
  cachedMarkdown = markdown;
  cachedPage = page;
  return page;
}

const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  try {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    let body;

    if (pathname === "/" || pathname === "/index.html") {
      body = await renderPage();
      response.setHeader("Content-Type", "text/html; charset=utf-8");
    } else if (pathname === "/scripts/profile-preview.css") {
      body = await readFile(new URL(pathname.slice(1), root));
      response.setHeader("Content-Type", "text/css; charset=utf-8");
    } else if (assets.has(pathname)) {
      body = await readFile(new URL(pathname.slice(1), root));
      response.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    } else {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    console.error(error.message);
    response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Preview unavailable. Check the terminal for details, then reload.");
  }
});

server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

await renderPage();
server.listen(port, "127.0.0.1", () => {
  console.log(`Profile preview: http://127.0.0.1:${port}`);
  console.log("Reload after editing. Local SVGs use the current working tree.");
  console.log("Press Ctrl+C to stop.");
});
