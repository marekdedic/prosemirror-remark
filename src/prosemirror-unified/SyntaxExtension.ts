import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { Node as UnistNode } from "unist";

import type { ConverterContext } from "./ConverterContext";
import { Extension } from "./Extension";

export abstract class SyntaxExtension<
  UNode extends UnistNode,
  Context = Record<string, never>
> extends Extension {
  public unistToProseMirrorTest(node: UnistNode): boolean {
    return node.type === this.unistNodeName();
  }

  public postUnistToProseMirrorHook(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ConverterContext<Context>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ): void {}

  // TODO: Remove schema parameter from both here and conversion
  public proseMirrorKeymap(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _schema: Schema<string, string>
  ): Record<string, Command> {
    return {};
  }

  public abstract unistNodeName(): UNode["type"];

  public abstract unistNodeToProseMirrorNodes(
    node: UNode,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
    context: ConverterContext<Context>
  ): Array<ProseMirrorNode>;
}
