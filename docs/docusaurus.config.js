const { themes: prismThemes } = require("prism-react-renderer");

/**
 * Normalize a URL path.
 *
 * Examples:
 * docs     -> /docs/
 * /docs    -> /docs/
 * /docs/   -> /docs/
 */
function normalizePath(value, fallback) {
  const raw = (value || fallback).trim();

  const leading = raw.startsWith("/") ? raw : `/${raw}`;

  return leading.endsWith("/") ? leading : `${leading}/`;
}

/**
 * Docusaurus lives under:
 *
 * /docs/
 *
 * On the custom domain sd.somnog.so there is no
 * repository path segment, so the default is simply:
 *
 * /docs/
 */
const baseUrl = normalizePath(process.env.DOCS_BASE_URL, "/docs/");

/**
 * Determine where the main Vite website lives.
 *
 * /docs/
 * -> /
 *
 * /somnog9-workshop/docs/
 * -> /somnog9-workshop/
 */
const mainBasePath = baseUrl.endsWith("/docs/")
  ? baseUrl.slice(0, -"docs/".length)
  : "/";

/**
 * Development:
 *
 * http://localhost:5173
 *
 * Production:
 *
 * PUBLIC_SITE_URL
 *
 * Example:
 *
 * https://sd.somnog.so
 */
const isDevelopment = process.env.NODE_ENV !== "production";

const mainSiteOrigin = (
  isDevelopment
    ? "http://localhost:5173"
    : process.env.PUBLIC_SITE_URL || "https://sd.somnog.so"
).replace(/\/+$/, "");

/**
 * Generate an ABSOLUTE URL pointing back to the
 * Vite application.
 *
 * This deliberately prevents Docusaurus from
 * interpreting Home / Schedule / Materials as
 * routes underneath /docs/.
 */
function mainSiteHref(path = "") {
  const cleanPath = path.replace(/^\/+/, "").replace(/\/+$/, "");

  const normalizedBase = mainBasePath.endsWith("/")
    ? mainBasePath
    : `${mainBasePath}/`;

  if (!cleanPath) {
    return `${mainSiteOrigin}${normalizedBase}`;
  }

  return `${mainSiteOrigin}${normalizedBase}${cleanPath}/`;
}

/**
 * Temporary routing diagnostic.
 *
 * You can remove this later once everything works.
 */
console.log("\n[SOMNOG9 DOCS ROUTING]");

console.log({
  baseUrl,
  mainBasePath,
  mainSiteOrigin,
  home: mainSiteHref(),
  schedule: mainSiteHref("schedule"),
  materials: mainSiteHref("materials"),
});

console.log("");

module.exports = {
  title: "SOMNOG9 Docs",

  tagline: "Software Development Track workshop documentation",

  favicon: "img/somnog9-logo.png",

  /**
   * Main domain only.
   *
   * Correct:
   *
   * https://sd.somnog.so
   *
   * Do NOT add /docs/ here.
   */
  url: process.env.PUBLIC_SITE_URL || "https://sd.somnog.so",

  /**
   * Docusaurus itself lives under /docs/.
   */
  baseUrl,

  trailingSlash: true,

  organizationName: "SomNOG",

  projectName: "somnog9-workshop",

  /**
   * Throw if production build finds broken routes.
   */
  onBrokenLinks: "throw",

  /**
   * Docusaurus 3.10+ replacement for the deprecated
   * onBrokenMarkdownLinks setting.
   */
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  presets: [
    [
      "classic",

      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),

          /**
           * Docusaurus already lives at /docs/.
           *
           * Therefore:
           *
           * docs/docs/day-1/git-github.md
           *
           * becomes:
           *
           * /docs/day-1/git-github/
           *
           * rather than:
           *
           * /docs/docs/day-1/git-github/
           */
          routeBasePath: "/",

          showLastUpdateTime: false,

          showLastUpdateAuthor: false,
        },

        blog: false,

        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],

  themeConfig: {
    image: "img/somnog9-logo.png",

    colorMode: {
      defaultMode: "light",

      disableSwitch: true,

      respectPrefersColorScheme: false,
    },

    /**
     * NAVBAR
     *
     * IMPORTANT:
     *
     * Home / Schedule / Materials use absolute `href`
     * URLs.
     *
     * We intentionally do NOT use `to`.
     *
     * `to` = Docusaurus client router.
     * `href` = normal browser navigation.
     */
    navbar: {
      title: "",

      logo: {
        alt: "SOMNOG9",

        src: "img/somnog9-logo.png",

        href: mainSiteHref(),

        target: "_self",
      },

      items: [
        {
          label: "Home",

          position: "right",

          href: mainSiteHref(),

          target: "_self",

          prependBaseUrlToHref: false,
        },

        {
          label: "Schedule",

          position: "right",

          href: mainSiteHref("schedule"),

          target: "_self",

          prependBaseUrlToHref: false,
        },

        {
          label: "Materials",

          position: "right",

          href: mainSiteHref("materials"),

          target: "_self",

          prependBaseUrlToHref: false,
        },
      ],
    },

    footer: {
      style: "light",

      copyright:
        `© ${new Date().getFullYear()} ` +
        "SomNOG · Software Development Track · " +
        "#DigitalSomalia",
    },

    /**
     * VS Code-like syntax highlighting.
     */
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.github,

      additionalLanguages: [
        "bash",
        "powershell",
        "javascript",
        "typescript",
        "jsx",
        "tsx",
        "json",
        "css",
        "markup",
        "sql",
        "python",
      ],
    },
  },
};
