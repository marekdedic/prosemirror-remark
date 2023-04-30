import type { Root } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import { type Processor } from "unified";
import type { Node as UnistNode } from "unist";

import type { Extension } from "./Extension";
import { MarkExtension } from "./MarkExtension";
import { MdastToProseMirrorConverter } from "./MdastToProseMirrorConverter";
import { NodeExtension } from "./NodeExtension";
import { ProseMirrorToMdastConverter } from "./ProseMirrorToMdastConverter";
import { SchemaBuilder } from "./SchemaBuilder";
import { SyntaxExtension } from "./SyntaxExtension";
import { UnifiedBuilder } from "./UnifiedBuilder";

function isSyntaxExtension(extension: Extension): extension is SyntaxExtension {
  return extension instanceof SyntaxExtension;
}

function isNodeExtension(
  extension: SyntaxExtension
): extension is NodeExtension {
  return extension instanceof NodeExtension;
}

function isMarkExtension(
  extension: SyntaxExtension
): extension is MarkExtension {
  return extension instanceof MarkExtension;
}

export class ProseMirrorRemark {
  // TODO: Specialize schema generic
  private readonly builtSchema: Schema<string, string>;
  private readonly mdastToProseMirrorConverter: MdastToProseMirrorConverter;
  private readonly proseMirrorToMdastConverter: ProseMirrorToMdastConverter;
  // TODO: UnistNode is a generic
  // TODO: Maybe more specific types?
  private readonly remark: Processor<UnistNode, UnistNode, UnistNode, string>;

  public constructor(extensions: Array<Extension> = []) {
    const syntaxExtensions = extensions.filter(isSyntaxExtension);
    const nodeExtensions = syntaxExtensions.filter(isNodeExtension);
    const markExtensions = syntaxExtensions.filter(isMarkExtension);
    this.builtSchema = new SchemaBuilder(
      nodeExtensions,
      markExtensions
    ).build();
    this.mdastToProseMirrorConverter = new MdastToProseMirrorConverter(
      syntaxExtensions
    );
    this.proseMirrorToMdastConverter = new ProseMirrorToMdastConverter(
      nodeExtensions,
      markExtensions
    );
    this.remark = new UnifiedBuilder(extensions).build();
  }

  public parse(markdown: string): ProseMirrorNode | null {
    const mdast = this.remark.runSync(this.remark.parse(markdown));
    // TODO: Fix remark-unwrap-images to not put text nodes in root
    (mdast as Root).children = (mdast as Root).children.filter(
      (child) => child.type !== "text"
    );
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
    console.log(mdast);
    return markdown;
  }
}
