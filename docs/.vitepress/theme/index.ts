import type { Theme } from "vitepress";

import DefaultTheme from "vitepress/theme";

import MermaidDiagram from "../mermaid/MermaidDiagram.vue";

export default {
  enhanceApp({ app }): void {
    app.component("MermaidDiagram", MermaidDiagram);
  },
  extends: DefaultTheme,
} satisfies Theme;
