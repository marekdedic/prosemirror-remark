import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import { ProseMirrorUnified, type SyntaxExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import { ParagraphExtension } from "./ParagraphExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";
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

  protected readonly pmu: ProseMirrorUnified;

  private readonly unistNodeName: string;

  private readonly unistNodeMatches: Array<{
    node: UnistNode;
    shouldMatch: boolean;
  }>;

  private readonly unistNodeConversions: Array<{
    source: UNode;
    target: Array<ProseMirrorNode>;
    injectNodes: Array<UnistNode>;
  }>;

  private readonly proseMirrorNodeConversions: Array<{
    source: ProseMirrorNode;
    target: Array<UNode>;
  }>;

  public constructor(
    extension: SyntaxExtension<UNode, UnistToProseMirrorContext>,
    config: SyntaxExtensionTesterConfig
  ) {
    this.extension = extension;
    this.unistNodeName = config.unistNodeName;

    this.unistNodeMatches = [];
    this.unistNodeConversions = [];
    this.proseMirrorNodeConversions = [];

    this.pmu = new ProseMirrorUnified([
      new ParserProviderExtension(),
      new RootExtension(),
      new ParagraphExtension(),
      new TextExtension(),
      this.extension,
    ]);
  }

  public shouldMatchUnistNode(node: UNode): this {
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
    injectNodes: Array<UnistNode> = []
  ): this {
    this.unistNodeConversions.push({
      source,
      target: target(this.pmu.schema()),
      injectNodes,
    });
    return this;
  }

  public shouldConvertProseMirrorNode(
    source: (schema: Schema<string, string>) => ProseMirrorNode,
    target: Array<UNode>
  ): this {
    this.proseMirrorNodeConversions.push({
      source: source(this.pmu.schema()),
      target,
    });
    return this;
  }

  protected enqueueTests(): void {
    test("Handles the correct unist node", () => {
      expect(this.extension.unistNodeName()).toBe(this.unistNodeName);
    });

    this.enqueueUnistNodeMatchTests();
    this.enqueueUnistNodeConversionTests();
    this.enqueueProseMirrorNodeConversionTests();
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
      for (const { source, target, injectNodes } of this.unistNodeConversions) {
        const annotatedPmu = this.pmu as unknown as {
          unistToProseMirrorConverter: {
            convertNode(
              node: UnistNode,
              context: Record<string, unknown>
            ): Array<ProseMirrorNode>;
          };
        };
        const context = {} as UnistToProseMirrorContext;
        for (const node of injectNodes) {
          annotatedPmu.unistToProseMirrorConverter.convertNode(node, context);
        }
        const result = annotatedPmu.unistToProseMirrorConverter.convertNode(
          source,
          context
        );
        this.extension.postUnistToProseMirrorHook(context);
        expect(result).toStrictEqual(target);
      }
    });
  }

  private enqueueProseMirrorNodeConversionTests(): void {
    if (this.proseMirrorNodeConversions.length === 0) {
      return;
    }
    test("Converts ProseMirror -> unist correctly", () => {
      // eslint-disable-next-line jest/prefer-expect-assertions -- The rule requires a number literal
      expect.assertions(this.proseMirrorNodeConversions.length);
      for (const { source, target } of this.proseMirrorNodeConversions) {
        expect(
          (
            this.pmu as unknown as {
              proseMirrorToUnistConverter: {
                convertNode(node: ProseMirrorNode): Array<UnistNode>;
              };
            }
          ).proseMirrorToUnistConverter.convertNode(source)
        ).toStrictEqual(target);
      }
    });
  }
}
