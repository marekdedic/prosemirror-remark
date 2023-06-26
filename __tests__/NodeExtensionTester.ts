import type { NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

interface NodeExtensionTesterConfig {
  unistNodeName: string;
}

// TODO: Test input rules
// TODO: Test keymap
// TODO: Test post-hook
// TODO: Test unist -> ProseMirror
// TODO: Add things from NodeExtension

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

  private readonly unistNodeMatches: Array<{
    node: UnistNode;
    shouldMatch: boolean;
  }>;

  public constructor(
    extension: NodeExtension<UNode, UnistToProseMirrorContext>,
    config: NodeExtensionTesterConfig
  ) {
    this.extension = extension;
    this.unistNodeName = config.unistNodeName;

    this.unistNodeMatches = [];
  }

  public shouldMatchUnistNode(node: UnistNode): this {
    this.unistNodeMatches.push({ node, shouldMatch: true });
    return this;
  }

  public shouldNotMatchUnistNode(node: UnistNode): this {
    this.unistNodeMatches.push({ node, shouldMatch: false });
    return this;
  }

  public test(): void {
    // eslint-disable-next-line jest/valid-title -- The rule requires a string literal
    describe(this.extension.constructor.name, () => {
      test("Handles the correct unist node", () => {
        expect(this.extension.unistNodeName()).toBe(this.unistNodeName);
      });

      if (this.unistNodeMatches.length > 0) {
        test("Matches correct unist nodes", () => {
          // eslint-disable-next-line jest/prefer-expect-assertions -- The rule requires a number literal
          expect.assertions(this.unistNodeMatches.length);
          for (const { node, shouldMatch } of this.unistNodeMatches) {
            expect(this.extension.unistToProseMirrorTest(node)).toBe(
              shouldMatch
            );
          }
        });
      }
    });
  }
}
