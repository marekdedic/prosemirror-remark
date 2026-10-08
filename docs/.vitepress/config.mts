import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/prosemirror-remark/",
  description: "Markdown support for ProseMirror, powered by remark",
  lastUpdated: true,
  srcExclude: ["custom-ui.md"],
  themeConfig: {
    editLink: {
      pattern:
        "https://github.com/marekdedic/prosemirror-remark/edit/master/docs/:path",
      text: "Edit this page on GitHub",
    },
    nav: [
      { link: "/guide/introduction", text: "Guide" },
      { link: "/reference/extensions", text: "Reference" },
      { link: "/extending/customising", text: "Extending" },
    ],
    search: {
      provider: "local",
    },
    sidebar: [
      {
        items: [
          { link: "/guide/introduction", text: "Introduction" },
          { link: "/guide/getting-started", text: "Getting started" },
          { link: "/guide/gfm", text: "GitHub Flavored Markdown" },
          {
            link: "/guide/choosing-extensions",
            text: "Picking individual extensions",
          },
          {
            link: "/guide/markdown-output",
            text: "Markdown output and limitations",
          },
        ],
        text: "Guide",
      },
      {
        items: [
          { link: "/reference/extensions", text: "Extensions" },
          { link: "/reference/bundles", text: "Bundles" },
        ],
        text: "Reference",
      },
      {
        items: [
          { link: "/extending/customising", text: "Customising an extension" },
          { link: "/extending/new-syntax", text: "Adding new Markdown syntax" },
        ],
        text: "Extending",
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
