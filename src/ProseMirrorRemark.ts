import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { type Processor, unified } from "unified";
import type { Node as UnistNode } from "unist";

import { MdastToProseMirrorConverter } from "./MdastToProseMirrorConverter";
import type { ProseMirrorRemarkExtension } from "./ProseMirrorRemarkExtension";
import { ProseMirrorRemarkMarkExtension } from "./ProseMirrorRemarkMarkExtension";
import { ProseMirrorRemarkNodeExtension } from "./ProseMirrorRemarkNodeExtension";
import { ProseMirrorToMdastConverter } from "./ProseMirrorToMdastConverter";
import { SchemaBuilder } from "./SchemaBuilder";

function isNodeExtension(
  extension: ProseMirrorRemarkExtension
): extension is ProseMirrorRemarkNodeExtension {
  return extension instanceof ProseMirrorRemarkNodeExtension;
}

function isMarkExtension(
  extension: ProseMirrorRemarkExtension
): extension is ProseMirrorRemarkMarkExtension {
  return extension instanceof ProseMirrorRemarkMarkExtension;
}

export class ProseMirrorRemark {
  private readonly builtSchema: Schema<string, string>;
  private readonly mdastToProseMirrorConverter: MdastToProseMirrorConverter;
  private readonly proseMirrorToMdastConverter: ProseMirrorToMdastConverter;
  private readonly remark: Processor<UnistNode, UnistNode, UnistNode, string>;

  public constructor(extensions: Array<ProseMirrorRemarkExtension> = []) {
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
      nodeExtensions
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
