import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  schema,
} from "prosemirror-markdown";
import type { Node, Schema } from "prosemirror-model";

export class ProseMirrorRemarkAdapter {
  public parse(markdown: string): Node | null {
    return defaultMarkdownParser.parse(markdown);
  }

  // TODO: Replace "string" with a string literal
  public schema(): Schema<string, string> {
    return schema;
  }

  public serialize(doc: Node): string {
    return defaultMarkdownSerializer.serialize(doc);
  }
}
