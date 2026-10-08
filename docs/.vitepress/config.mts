import { defineConfig } from "vitepress";

import { mermaidPlugin } from "./mermaid/markdown-plugin";

export default defineConfig({
  base: "/prosemirror-remark/",
  description: "Markdown support for ProseMirror, powered by remark",
  lastUpdated: true,
  markdown: {
    config: (md) => {
      md.use(mermaidPlugin);
    },
  },
  themeConfig: {
    editLink: {
      pattern:
        "https://github.com/marekdedic/prosemirror-remark/edit/master/docs/:path",
      text: "Edit this page on GitHub",
    },
    nav: [{ link: "/guide/introduction", text: "Guide" }],
    search: {
      provider: "local",
    },
    sidebar: [
      {
        items: [{ link: "/guide/introduction", text: "Introduction" }],
        text: "Guide",
      },
    ],
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/marekdedic/prosemirror-remark",
      },
    ],
  },
  title: "prosemirror-remark",
  vite: {
    optimizeDeps: {
      // Mermaid pulls in these CommonJS modules; Vite's dev server needs
      // them pre-bundled or the browser errors on their missing ESM exports.
      include: ["mermaid", "fastdom", "fastdom-promised"],
    },
  },
});
