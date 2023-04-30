import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { ConverterContext } from "./ConverterContext";
import { Extension } from "./Extension";

export abstract class SyntaxExtension<
  UNode extends UnistNode,
  Context = Record<string, never>
> extends Extension {
  public mdastNodeMatches(node: UnistNode): boolean {
    return node.type === this.mdastNodeName();
  }

  public postMdastToProseMirrorHook(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ConverterContext<Context>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ): void {}

  // TODO: Use node type instead of string?
  public abstract mdastNodeName(): string;

  // TODO: There is some code duplication in the specializations of this method
  // TODO: Specialize schema generic
  public abstract mdastNodeToProseMirrorNodes(
    node: UNode,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema,
    context: ConverterContext<Context>
  ): Array<ProseMirrorNode>;
}
