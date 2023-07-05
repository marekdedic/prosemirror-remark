import type { NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import {
  SyntaxExtensionTester,
  type SyntaxExtensionTesterConfig,
} from "./SyntaxExtensionTester";

interface NodeExtensionTesterConfig extends SyntaxExtensionTesterConfig {
  unistNodeName: string;
}

// TODO: Add things from NodeExtension

// TODO: Re-evaluate
// eslint-disable-next-line jest/no-export
export class NodeExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >
> extends SyntaxExtensionTester<UNode, UnistToProseMirrorContext> {
  protected readonly extension: NodeExtension<UNode, UnistToProseMirrorContext>;

  public constructor(
    extension: NodeExtension<UNode, UnistToProseMirrorContext>,
    config: NodeExtensionTesterConfig
  ) {
    super(extension, config);
    this.extension = extension;
  }

  public test(): void {
    // eslint-disable-next-line jest/valid-title -- The rule requires a string literal
    describe(this.extension.constructor.name, () => {
      this.enqueueTests();
    });
  }

  protected enqueueTests(): void {
    super.enqueueTests();
  }
}
