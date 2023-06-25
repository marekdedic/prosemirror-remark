import type { NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

interface NodeExtensionTesterConfig {
  unistNodeName: string;
}

// TODO: Re-evaluate
// eslint-disable-next-line jest/no-export
export function nodeExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >
>(
  extension: NodeExtension<UNode, UnistToProseMirrorContext>,
  config: NodeExtensionTesterConfig
): void {
  describe(extension.constructor.name, () => {
    test("Handles the correct unist node", () => {
      expect(extension.unistNodeName()).toBe(config.unistNodeName);
    });
  });
}
