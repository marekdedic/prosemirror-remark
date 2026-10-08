import type { MarkdownRenderer } from "vitepress";

// Replaces ```mermaid fenced code blocks with a <MermaidDiagram> component.
// The source is URI-encoded so it survives inside a double-quoted attribute.
export const mermaidPlugin = (md: MarkdownRenderer): void => {
  const fence = md.renderer.rules.fence;
  if (fence === undefined) {
    return;
  }

  md.renderer.rules.fence = (tokens, idx, options, env, self): string => {
    const token = tokens[idx];
    if (token.info.trim() === "mermaid") {
      const encoded = encodeURIComponent(token.content);
      return `<MermaidDiagram graph="${encoded}"></MermaidDiagram>\n`;
    }
    return fence(tokens, idx, options, env, self);
  };
};
