import type { NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

interface NodeExtensionTesterConfig {
  unistNodeName: string;
}

// TODO: Re-evaluate
// eslint-disable-next-line jest/no-export
export class NodeExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >
> {
  private readonly extension: NodeExtension<UNode, UnistToProseMirrorContext>;
  private readonly unistNodeName: string;

  public constructor(
    extension: NodeExtension<UNode, UnistToProseMirrorContext>,
    config: NodeExtensionTesterConfig
  ) {
    this.extension = extension;
    this.unistNodeName = config.unistNodeName;
  }

  public test(): void {
    // eslint-disable-next-line jest/valid-title -- The rule requires a string literal
    describe(this.extension.constructor.name, () => {
      test("Handles the correct unist node", () => {
        expect(this.extension.unistNodeName()).toBe(this.unistNodeName);
      });
    });
  }
}
