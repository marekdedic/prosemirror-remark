import type { Node as ProseMirrorNode } from "prosemirror-model";

// The characters CommonMark splits an info string at
const infoWhitespaceCharacter = "[\\t\\n\\r ]";

export const infoWhitespace = new RegExp(infoWhitespaceCharacter, "u");

export const infoWhitespaceGlobal = new RegExp(infoWhitespaceCharacter, "gu");

export interface CodeBlockAttrs {
  lang: string | null;
  meta: string | null;
}

export function codeBlockAttrs(
  lang: string | null | undefined,
  meta: string | null | undefined,
): CodeBlockAttrs {
  return { lang: normaliseLanguage(lang), meta: normaliseMeta(meta) };
}

// Shared by toDOM and the node view, so that they can't diverge
export function domAttrs(attrs: CodeBlockAttrs): {
  code: Record<string, string | null>;
  pre: Record<string, string | null>;
} {
  return {
    code: { class: attrs.lang === null ? null : `language-${attrs.lang}` },
    pre: { "data-language": attrs.lang, "data-meta": attrs.meta },
  };
}

// The attributes as they're written out: apps can set them directly, bypassing
// codeBlockAttrs
export function nodeAttrs(node: ProseMirrorNode): CodeBlockAttrs {
  return codeBlockAttrs(
    node.attrs["lang"] as string | null,
    node.attrs["meta"] as string | null,
  );
}

// Literal values, cut where Markdown would split the info string
export function normaliseLanguage(
  lang: string | null | undefined,
): string | null {
  return lang?.split(infoWhitespace).find((word) => word !== "") ?? null;
}

function normaliseMeta(meta: string | null | undefined): string | null {
  // The parser drops leading spaces and tabs, but keeps trailing ones
  const normalised = meta?.replace(/^[\t ]+/u, "") ?? "";
  return normalised === "" ? null : normalised;
}
