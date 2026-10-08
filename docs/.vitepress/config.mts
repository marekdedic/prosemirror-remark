import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/prosemirror-remark/",
  description: "Markdown support for ProseMirror, powered by remark",
  lastUpdated: true,
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
});
