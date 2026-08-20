import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const username = process.env.GITHUB_USER || "wheakerd";
const organizationNames = (process.env.GITHUB_ORGS || "")
  .split(",")
  .map((organization) => organization.trim())
  .filter(Boolean);
const lightOutputPath = resolve(
  process.argv[2] || "dist/readme-tools_github-readme-stats.svg",
);
const darkOutputPath = resolve(
  process.argv[3] || "dist/readme-tools_github-readme-stats-dark.svg",
);
const token = process.env.GITHUB_TOKEN;

const publicHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${username}-profile-readme`,
  "X-GitHub-Api-Version": "2022-11-28",
};

async function getJson(url) {
  const authenticatedHeaders = token
    ? { ...publicHeaders, Authorization: `Bearer ${token}` }
    : publicHeaders;
  let response = await fetch(url, { headers: authenticatedHeaders });

  // Repository-scoped Actions tokens cannot use every user-level API route.
  // These endpoints are public, so retry anonymously before failing the job.
  if (token && [401, 403, 404].includes(response.status)) {
    response = await fetch(url, { headers: publicHeaders });
  }

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${url}`);
  }

  return response.json();
}

async function getPaginatedRepositories(urlForPage) {
  const repositories = [];

  for (let page = 1; ; page += 1) {
    const batch = await getJson(urlForPage(page));

    repositories.push(...batch);

    if (batch.length < 100) {
      return repositories;
    }
  }
}

function getPublicRepositories() {
  return getPaginatedRepositories(
    (page) =>
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=100&page=${page}`,
  );
}

function getPublicOrganizationRepositories(organization) {
  return getPaginatedRepositories(
    (page) =>
      `https://api.github.com/orgs/${encodeURIComponent(organization)}/repos?type=public&sort=updated&per_page=100&page=${page}`,
  );
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

const [profile, repositories, organizationRepositoryGroups] = await Promise.all([
  getJson(`https://api.github.com/users/${encodeURIComponent(username)}`),
  getPublicRepositories(),
  Promise.all(
    organizationNames.map(async (organization) => ({
      organization,
      repositories: await getPublicOrganizationRepositories(organization),
    })),
  ),
]);

const ownedProjects = repositories.filter(
  (repository) =>
    !repository.fork &&
    !repository.archived &&
    repository.name.toLowerCase() !== username.toLowerCase(),
);
const organizationProjects = organizationRepositoryGroups
  .flatMap(({ repositories: organizationRepositories }) => organizationRepositories)
  .filter((repository) => !repository.fork && !repository.archived);
const languageCounts = new Map();

for (const repository of [...ownedProjects, ...organizationProjects]) {
  if (repository.language) {
    languageCounts.set(repository.language, (languageCounts.get(repository.language) || 0) + 1);
  }
}

const topLanguages = [...languageCounts.entries()]
  .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
  .slice(0, 5);
const languageTotal = Math.max(
  1,
  topLanguages.reduce((total, [, count]) => total + count, 0),
);
const palettes = {
  dark: {
    background: ["#07101f", "#0b1730", "#11102b"],
    edge: ["#2dd4bf", "#60a5fa", "#a78bfa"],
    grid: "#94a3b8",
    gridOpacity: "0.055",
    eyebrow: "#5eead4",
    stamp: "#64748b",
    statLabel: "#94a3b8",
    statValue: "#f8fafc",
    legend: "#cbd5e1",
    border: "#29364e",
    track: "#1e293b",
    languages: ["#2dd4bf", "#60a5fa", "#a78bfa", "#fb7185", "#fbbf24"],
  },
  light: {
    background: ["#f8fafc", "#f1f5f9", "#e9f1f7"],
    edge: ["#0f766e", "#2563eb", "#7c3aed"],
    grid: "#64748b",
    gridOpacity: "0.08",
    eyebrow: "#0f766e",
    stamp: "#64748b",
    statLabel: "#475569",
    statValue: "#0f172a",
    legend: "#334155",
    border: "#cbd5e1",
    track: "#dbe4ee",
    languages: ["#0f766e", "#2563eb", "#7c3aed", "#be123c", "#a16207"],
  },
};
const createdYear = new Date(profile.created_at).getUTCFullYear();
const updatedAt = new Date().toISOString().slice(0, 10);

const stats = [
  ["PUBLIC REPOS", formatNumber(profile.public_repos)],
  ["ORIGINAL PROJECTS", formatNumber(ownedProjects.length)],
  ["ECOSYSTEM REPOS", formatNumber(organizationProjects.length)],
  ["ON GITHUB SINCE", createdYear],
];

const statMarkup = stats
  .map(([label, value], index) => {
    const x = 58 + index * 211;
    return `
      <g transform="translate(${x} 82)">
        <text class="stat-label" x="0" y="0">${escapeXml(label)}</text>
        <text class="stat-value" x="0" y="48">${escapeXml(value)}</text>
      </g>`;
  })
  .join("");

function renderSvg(theme) {
  const palette = palettes[theme];
  let barOffset = 0;
  const languageBars = topLanguages
    .map(([, count], index) => {
      const width = (count / languageTotal) * 780;
      const markup = `<rect x="${barOffset.toFixed(2)}" y="0" width="${width.toFixed(2)}" height="12" fill="${palette.languages[index]}" />`;
      barOffset += width;
      return markup;
    })
    .join("");
  const languageLegend = topLanguages
    .map(([language, count], index) => {
      const x = 58 + index * 155;
      const repositoryLabel = count === 1 ? "repo" : "repos";
      return `
      <g transform="translate(${x} 210)">
        <circle cx="5" cy="-5" r="5" fill="${palette.languages[index]}" />
        <text class="legend" x="17" y="0">${escapeXml(language)} · ${count} ${repositoryLabel}</text>
      </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 248" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(username)} public GitHub ecosystem</title>
  <desc id="description">Live public personal and organization repository statistics generated inside the profile repository.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.background[0]}" />
      <stop offset="0.55" stop-color="${palette.background[1]}" />
      <stop offset="1" stop-color="${palette.background[2]}" />
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${palette.edge[0]}" />
      <stop offset="0.5" stop-color="${palette.edge[1]}" />
      <stop offset="1" stop-color="${palette.edge[2]}" />
    </linearGradient>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="${palette.grid}" stroke-opacity="${palette.gridOpacity}" />
    </pattern>
    <clipPath id="language-clip">
      <rect width="780" height="12" rx="6" />
    </clipPath>
  </defs>
  <style>
    text { font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace; }
    .eyebrow { fill: ${palette.eyebrow}; font-size: 12px; font-weight: 700; letter-spacing: 2.5px; }
    .stamp { fill: ${palette.stamp}; font-size: 10px; letter-spacing: 1px; }
    .stat-label { fill: ${palette.statLabel}; font-size: 10px; font-weight: 700; letter-spacing: 1.4px; }
    .stat-value { fill: ${palette.statValue}; font-size: 34px; font-weight: 800; }
    .legend { fill: ${palette.legend}; font-size: 11px; }
  </style>
  <rect width="900" height="248" rx="22" fill="url(#background)" />
  <rect width="900" height="248" rx="22" fill="url(#grid)" />
  <rect x="1" y="1" width="898" height="246" rx="21" fill="none" stroke="${palette.border}" />
  <path d="M22 2h856" stroke="url(#edge)" stroke-width="3" />
  <text class="eyebrow" x="58" y="44">LIVE PUBLIC ECOSYSTEM // ${escapeXml(username.toUpperCase())}</text>
  <text class="stamp" x="842" y="44" text-anchor="end">SYNC ${updatedAt} UTC</text>
  ${statMarkup}
  <g transform="translate(58 174)">
    <rect width="780" height="12" rx="6" fill="${palette.track}" />
    <g clip-path="url(#language-clip)">${languageBars}</g>
  </g>
  ${languageLegend}
  <text class="stamp" x="842" y="224" text-anchor="end">SOURCE · GITHUB REST API</text>
</svg>
`;
}

const outputs = [
  [lightOutputPath, renderSvg("light")],
  [darkOutputPath, renderSvg("dark")],
];

for (const [outputPath, svg] of outputs) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, svg, "utf8");
}

console.log(
  `Generated light and dark stats cards for ${username} from ${repositories.length} public repositories and ${organizationProjects.length} public organization repositories.`,
);
