import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
} from "prosemirror-markdown";
import type { Node, Schema } from "prosemirror-model";

import { SchemaBuilder } from "./SchemaBuilder";

export class ProseMirrorRemarkAdapter {
  public parse(markdown: string): Node | null {
    return defaultMarkdownParser.parse(markdown);
  }

  // TODO: Replace "string" with a string literal
  public schema(): Schema<string, string> {
    return new SchemaBuilder().build();
  }

  public serialize(doc: Node): string {
    return defaultMarkdownSerializer.serialize(doc);
  }
}
