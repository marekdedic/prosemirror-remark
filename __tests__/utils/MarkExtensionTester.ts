import type { Mark, Schema } from "prosemirror-model";
import type { MarkExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import {
  SyntaxExtensionTester,
  type SyntaxExtensionTesterConfig,
} from "./SyntaxExtensionTester";

interface MarkExtensionTesterConfig extends SyntaxExtensionTesterConfig {
  proseMirrorMarkName: string;
}

// TODO: Test proseMirrorMarkSpec
// TODO: Test processConvertedUnistNode
// TODO: Test input rules

export class MarkExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >
> extends SyntaxExtensionTester<UNode, UnistToProseMirrorContext> {
  protected readonly extension: MarkExtension<UNode, UnistToProseMirrorContext>;

  private readonly proseMirrorMarkName: string;

  private readonly proseMirrorNodeMatches: Array<{
    node: UnistNode;
    mark: Mark;
    shouldMatch: boolean;
  }>;

  public constructor(
    extension: MarkExtension<UNode, UnistToProseMirrorContext>,
    config: MarkExtensionTesterConfig
  ) {
    super(extension, config);
    this.extension = extension;

    this.proseMirrorMarkName = config.proseMirrorMarkName;
    this.proseMirrorNodeMatches = [];
  }

  public shouldMatchProseMirrorNode(
    node: UnistNode,
    mark: (schema: Schema<string, string>) => Mark
  ): this {
    this.proseMirrorNodeMatches.push({
      node,
      mark: mark(this.pmu.schema()),
      shouldMatch: true,
    });
    return this;
  }

  public shouldNotMatchProseMirrorNode(
    node: UnistNode,
    mark: (schema: Schema<string, string>) => Mark
  ): this {
    this.proseMirrorNodeMatches.push({
      node,
      mark: mark(this.pmu.schema()),
      shouldMatch: false,
    });
    return this;
  }

  public test(): void {
    describe(this.extension.constructor.name, () => {
      this.enqueueTests();
    });
  }

  protected enqueueTests(): void {
    super.enqueueTests();

    test("Provides the correct ProseMirror mark", () => {
      expect(this.extension.proseMirrorMarkName()).toBe(
        this.proseMirrorMarkName
      );
    });

    this.enqueueProseMirrorNodeMatchTests();
  }

  private enqueueProseMirrorNodeMatchTests(): void {
    if (this.proseMirrorNodeMatches.length === 0) {
      return;
    }
    test("Matches correct ProseMirror nodes", () => {
      // eslint-disable-next-line jest/prefer-expect-assertions -- The rule requires a number literal
      expect.assertions(this.proseMirrorNodeMatches.length);
      for (const { node, mark, shouldMatch } of this.proseMirrorNodeMatches) {
        expect(this.extension.proseMirrorToUnistTest(node, mark)).toBe(
          shouldMatch
        );
      }
    });
  }
}
