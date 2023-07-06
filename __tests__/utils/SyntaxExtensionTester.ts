import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import { ProseMirrorUnified, type SyntaxExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import { ParagraphExtension } from "./ParagraphExtension";
import { RootExtension } from "./RootExtension";
import { TextExtension } from "./TextExtension";

export interface SyntaxExtensionTesterConfig {
  unistNodeName: string;
}

// TODO: Test keymap
// TODO: Test post-hook

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

  protected readonly schema: Schema<string, string>;

  private readonly unistNodeName: string;

  private readonly unistNodeMatches: Array<{
    node: UnistNode;
    shouldMatch: boolean;
  }>;

  private readonly unistNodeConversions: Array<{
    source: UNode;
    target: Array<ProseMirrorNode>;
    convertedChildren: Array<ProseMirrorNode>;
    contextChecker(context: UnistToProseMirrorContext): void;
  }>;

  public constructor(
    extension: SyntaxExtension<UNode, UnistToProseMirrorContext>,
    config: SyntaxExtensionTesterConfig
  ) {
    this.extension = extension;
    this.unistNodeName = config.unistNodeName;

    this.unistNodeMatches = [];
    this.unistNodeConversions = [];

    this.schema = new ProseMirrorUnified([
      new RootExtension(),
      new ParagraphExtension(),
      new TextExtension(),
      this.extension,
    ]).schema();
  }

  public shouldMatchUnistNode(node: UnistNode): this {
    this.unistNodeMatches.push({ node, shouldMatch: true });
    return this;
  }

  public shouldNotMatchUnistNode(node: UnistNode): this {
    this.unistNodeMatches.push({ node, shouldMatch: false });
    return this;
  }

  public shouldConvertUnistNode(
    source: UNode,
    target: (schema: Schema<string, string>) => Array<ProseMirrorNode>,
    convertedChildren: Array<ProseMirrorNode> = [],
    contextChecker: (
      context: UnistToProseMirrorContext
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    ) => void = (): void => {}
  ): this {
    this.unistNodeConversions.push({
      source,
      target: target(this.schema),
      convertedChildren,
      contextChecker,
    });
    return this;
  }

  protected enqueueTests(): void {
    test("Handles the correct unist node", () => {
      expect(this.extension.unistNodeName()).toBe(this.unistNodeName);
    });

    this.enqueueUnistNodeMatchTests();
    this.enqueueUnistNodeConversionTests();
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

  private enqueueUnistNodeConversionTests(): void {
    if (this.unistNodeConversions.length === 0) {
      return;
    }
    test("Converts unist -> ProseMirror correctly", () => {
      // eslint-disable-next-line jest/prefer-expect-assertions -- The rule requires a number literal
      expect.assertions(this.unistNodeConversions.length);
      for (const { source, target, convertedChildren, contextChecker } of this
        .unistNodeConversions) {
        const context = {} as UnistToProseMirrorContext;
        expect(
          this.extension.unistNodeToProseMirrorNodes(
            source,
            this.schema,
            convertedChildren,
            context
          )
        ).toStrictEqual(target);
        contextChecker(context);
      }
    });
  }
}
