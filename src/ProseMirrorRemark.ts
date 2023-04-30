import type { Root } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import { type Processor } from "unified";
import type { Node as UnistNode } from "unist";

import type { Extension } from "./Extension";
import { ExtensionManager } from "./ExtensionManager";
import { MdastToProseMirrorConverter } from "./MdastToProseMirrorConverter";
import { ProseMirrorToMdastConverter } from "./ProseMirrorToMdastConverter";
import { SchemaBuilder } from "./SchemaBuilder";
import { UnifiedBuilder } from "./UnifiedBuilder";

export class ProseMirrorRemark {
  private readonly builtSchema: Schema<string, string>;
  private readonly mdastToProseMirrorConverter: MdastToProseMirrorConverter;
  private readonly proseMirrorToMdastConverter: ProseMirrorToMdastConverter;
  private readonly remark: Processor<UnistNode, UnistNode, UnistNode, string>;

  public constructor(extensions: Array<Extension> = []) {
    const extensionManager = new ExtensionManager(extensions);
    this.builtSchema = new SchemaBuilder(extensionManager).build();
    this.mdastToProseMirrorConverter = new MdastToProseMirrorConverter(
      extensionManager
    );
    this.proseMirrorToMdastConverter = new ProseMirrorToMdastConverter(
      extensionManager
    );
    this.remark = new UnifiedBuilder(extensionManager).build();
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
