import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { type Processor, unified } from "unified";
import type { Node as UnistNode } from "unist";

import type { Extension } from "./Extension";
import { MarkExtension } from "./MarkExtension";
import { MdastToProseMirrorConverter } from "./MdastToProseMirrorConverter";
import { NodeExtension } from "./NodeExtension";
import { ProseMirrorToMdastConverter } from "./ProseMirrorToMdastConverter";
import { SchemaBuilder } from "./SchemaBuilder";

function isNodeExtension(extension: Extension): extension is NodeExtension {
  return extension instanceof NodeExtension;
}

function isMarkExtension(extension: Extension): extension is MarkExtension {
  return extension instanceof MarkExtension;
}

export class ProseMirrorRemark {
  private readonly builtSchema: Schema<string, string>;
  private readonly mdastToProseMirrorConverter: MdastToProseMirrorConverter;
  private readonly proseMirrorToMdastConverter: ProseMirrorToMdastConverter;
  private readonly remark: Processor<UnistNode, UnistNode, UnistNode, string>;

  public constructor(extensions: Array<Extension> = []) {
    const nodeExtensions = extensions.filter(isNodeExtension);
    const markExtensions = extensions.filter(isMarkExtension);
    this.builtSchema = new SchemaBuilder(
      nodeExtensions,
      markExtensions
    ).build();
    this.mdastToProseMirrorConverter = new MdastToProseMirrorConverter(
      extensions
    );
    this.proseMirrorToMdastConverter = new ProseMirrorToMdastConverter(
      nodeExtensions,
      markExtensions
    );
    this.remark = unified().use(remarkParse).use(remarkStringify);
  }

  public parse(markdown: string): ProseMirrorNode | null {
    const mdast = this.remark.runSync(this.remark.parse(markdown));
    const ret = this.mdastToProseMirrorConverter.convert(mdast, this.schema());
    console.log(ret);
    return ret;
  }

  // TODO: Replace "string" with a string literal
  public schema(): Schema<string, string> {
    return this.builtSchema;
  }

  public serialize(doc: ProseMirrorNode): string {
    const mdast = this.proseMirrorToMdastConverter.convert(doc);
    if (mdast === null) {
      return "";
    }
    const markdown: string = this.remark.stringify(mdast);
    console.log(markdown);
    return markdown;
  }
}
