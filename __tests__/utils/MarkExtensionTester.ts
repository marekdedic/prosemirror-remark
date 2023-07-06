import { type MarkExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import {
  SyntaxExtensionTester,
  type SyntaxExtensionTesterConfig,
} from "./SyntaxExtensionTester";

type MarkExtensionTesterConfig = SyntaxExtensionTesterConfig;

// TODO: Test MarkExtension
// TODO: Test input rules

export class MarkExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >
> extends SyntaxExtensionTester<UNode, UnistToProseMirrorContext> {
  public constructor(
    extension: MarkExtension<UNode, UnistToProseMirrorContext>,
    config: MarkExtensionTesterConfig
  ) {
    super(extension, config);
  }

  public test(): void {
    describe(this.extension.constructor.name, () => {
      this.enqueueTests();
    });
  }

  protected enqueueTests(): void {
    super.enqueueTests();
  }
}
