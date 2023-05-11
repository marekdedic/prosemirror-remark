import type { InputRule } from "prosemirror-inputrules";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Command } from "prosemirror-state";
import type { Node as UnistNode } from "unist";

import type { ConverterContext } from "./ConverterContext";
import { Extension } from "./Extension";

export abstract class SyntaxExtension<
  UNode extends UnistNode,
  Context = Record<string, never>
> extends Extension {
  private schema: Schema<string, string> | undefined;

  public setProseMirrorSchema(schema: Schema<string, string>): void {
    this.schema = schema;
  }

  public unistToProseMirrorTest(node: UnistNode): boolean {
    return node.type === this.unistNodeName();
  }

  public proseMirrorInputRules(): Array<InputRule> {
    return [];
  }

  public proseMirrorKeymap(): Record<string, Command> {
    return {};
  }

  public postUnistToProseMirrorHook(
    _context: ConverterContext<Context>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ): void {}

  protected proseMirrorSchema(): Schema<string, string> {
    return this.schema!;
  }

  public abstract unistNodeName(): UNode["type"];

  public abstract unistNodeToProseMirrorNodes(
    node: UNode,
    convertedChildren: Array<ProseMirrorNode>,
    context: ConverterContext<Context>
  ): Array<ProseMirrorNode>;
}
