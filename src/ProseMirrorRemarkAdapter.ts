import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
} from "prosemirror-markdown";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import remarkParse from "remark-parse";
import { type Processor, unified } from "unified";

import { MdastToProseMirrorConverter } from "./MdastToProseMirrorConverter";
import { SchemaBuilder } from "./SchemaBuilder";

export class ProseMirrorRemarkAdapter {
  private readonly parser: Processor;
  private readonly mdastToProseMirrorConverter: MdastToProseMirrorConverter;

  public constructor() {
    this.parser = unified().use(remarkParse);
    this.mdastToProseMirrorConverter = new MdastToProseMirrorConverter();
  }

  public parse(markdown: string): ProseMirrorNode | null {
    const mdast = this.parser.runSync(this.parser.parse(markdown));
    const ret = this.mdastToProseMirrorConverter.convert(mdast);
    console.log(ret);
    return defaultMarkdownParser.parse(markdown);
  }

  // TODO: Replace "string" with a string literal
  public schema(): Schema<string, string> {
    return new SchemaBuilder().build();
  }

  public serialize(doc: ProseMirrorNode): string {
    return defaultMarkdownSerializer.serialize(doc);
  }
}
