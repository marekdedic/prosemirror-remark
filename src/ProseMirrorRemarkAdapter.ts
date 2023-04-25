import { defaultMarkdownSerializer } from "prosemirror-markdown";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import remarkParse from "remark-parse";
import { type Processor, unified } from "unified";

import { MdastToProseMirrorConverter } from "./MdastToProseMirrorConverter";
import type { ProseMirrorRemarkExtension } from "./ProseMirrorRemarkExtension";
import { SchemaBuilder } from "./SchemaBuilder";

export class ProseMirrorRemarkAdapter {
  private readonly mdastToProseMirrorConverter: MdastToProseMirrorConverter;
  private readonly parser: Processor;
  private readonly builtSchema: Schema<string, string>;

  public constructor(extensions: Array<ProseMirrorRemarkExtension> = []) {
    this.parser = unified().use(remarkParse);
    this.mdastToProseMirrorConverter = new MdastToProseMirrorConverter(
      extensions
    );
    this.builtSchema = new SchemaBuilder(extensions).build();
  }

  public parse(markdown: string): ProseMirrorNode | null {
    const mdast = this.parser.runSync(this.parser.parse(markdown));
    const ret = this.mdastToProseMirrorConverter.convert(mdast, this.schema());
    console.log(ret);
    return ret;
  }

  // TODO: Replace "string" with a string literal
  public schema(): Schema<string, string> {
    return this.builtSchema;
  }

  public serialize(doc: ProseMirrorNode): string {
    return defaultMarkdownSerializer.serialize(doc);
  }
}
