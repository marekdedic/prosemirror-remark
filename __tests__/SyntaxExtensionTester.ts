import type { SyntaxExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

// TODO: Re-evaluate
// eslint-disable-next-line jest/no-export
export interface SyntaxExtensionTesterConfig {
  unistNodeName: string;
}

// TODO: Test input rules
// TODO: Test keymap
// TODO: Test post-hook
// TODO: Test unist -> ProseMirror

// TODO: Re-evaluate
// eslint-disable-next-line jest/no-export
export class SyntaxExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >
> {
  protected readonly extension: SyntaxExtension<
    UNode,
    UnistToProseMirrorContext
  >;
  private readonly unistNodeName: string;

  private readonly unistNodeMatches: Array<{
    node: UnistNode;
    shouldMatch: boolean;
  }>;

  public constructor(
    extension: SyntaxExtension<UNode, UnistToProseMirrorContext>,
    config: SyntaxExtensionTesterConfig
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

  protected enqueueTests(): void {
    test("Handles the correct unist node", () => {
      expect(this.extension.unistNodeName()).toBe(this.unistNodeName);
    });

    this.enqueueUnistNodeMatchTests();
  }

  private enqueueUnistNodeMatchTests(): void {
    if (this.unistNodeMatches.length === 0) {
      return;
    }
    test("Matches correct unist nodes", () => {
      // eslint-disable-next-line jest/prefer-expect-assertions -- The rule requires a number literal
      expect.assertions(this.unistNodeMatches.length);
      for (const { node, shouldMatch } of this.unistNodeMatches) {
        expect(this.extension.unistToProseMirrorTest(node)).toBe(shouldMatch);
      }
    });
  }
}
