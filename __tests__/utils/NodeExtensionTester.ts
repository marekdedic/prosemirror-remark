import { createEditor } from "jest-prosemirror";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import { type NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import {
  SyntaxExtensionTester,
  type SyntaxExtensionTesterConfig,
} from "./SyntaxExtensionTester";

interface NodeExtensionTesterConfig extends SyntaxExtensionTesterConfig {
  proseMirrorNodeName: string;
}

// TODO: Test proseMirrorNodeSpec

export class NodeExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >
> extends SyntaxExtensionTester<UNode, UnistToProseMirrorContext> {
  protected readonly extension: NodeExtension<UNode, UnistToProseMirrorContext>;

  private readonly proseMirrorNodeName: string;

  private readonly proseMirrorNodeMatches: Array<{
    node: ProseMirrorNode;
    shouldMatch: boolean;
  }>;

  private readonly proseMirrorNodeConversions: Array<{
    source: ProseMirrorNode;
    target: Array<UNode>;
  }>;

  private readonly inputRuleMatches: Array<{
    editorInput: string;
    markdownOutput: string;
    shouldMatch: boolean;
  }>;

  public constructor(
    extension: NodeExtension<UNode, UnistToProseMirrorContext>,
    config: NodeExtensionTesterConfig
  ) {
    super(extension, config);
    this.extension = extension;

    this.proseMirrorNodeName = config.proseMirrorNodeName;
    this.proseMirrorNodeMatches = [];
    this.proseMirrorNodeConversions = [];
    this.inputRuleMatches = [];
  }

  public shouldMatchProseMirrorNode(
    node: (schema: Schema<string, string>) => ProseMirrorNode
  ): this {
    this.proseMirrorNodeMatches.push({
      node: node(this.pmu.schema()),
      shouldMatch: true,
    });
    return this;
  }

  public shouldNotMatchProseMirrorNode(
    node: (schema: Schema<string, string>) => ProseMirrorNode
  ): this {
    this.proseMirrorNodeMatches.push({
      node: node(this.pmu.schema()),
      shouldMatch: false,
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

  public shouldMatchInputRule(
    editorInput: string,
    markdownOutput: string
  ): this {
    this.inputRuleMatches.push({
      editorInput,
      markdownOutput,
      shouldMatch: true,
    });
    return this;
  }

  public shouldNotMatchInputRule(
    editorInput: string,
    markdownOutput: string
  ): this {
    this.inputRuleMatches.push({
      editorInput,
      markdownOutput,
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

    test("Provides the correct ProseMirror node", () => {
      expect(this.extension.proseMirrorNodeName()).toBe(
        this.proseMirrorNodeName
      );
    });

    this.enqueueProseMirrorNodeMatchTests();
    this.enqueueProseMirrorNodeConversionTests();
    this.enqueueInputRuleTests();
  }

  private enqueueProseMirrorNodeMatchTests(): void {
    if (this.proseMirrorNodeMatches.length === 0) {
      return;
    }
    test("Matches correct ProseMirror nodes", () => {
      // eslint-disable-next-line jest/prefer-expect-assertions -- The rule requires a number literal
      expect.assertions(this.proseMirrorNodeMatches.length);
      for (const { node, shouldMatch } of this.proseMirrorNodeMatches) {
        expect(this.extension.proseMirrorToUnistTest(node)).toBe(shouldMatch);
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

  private enqueueInputRuleTests(): void {
    if (this.inputRuleMatches.length === 0) {
      return;
    }
    test("Matches input rules correctly", () => {
      // eslint-disable-next-line jest/prefer-expect-assertions -- The rule requires a number literal
      expect.assertions(3 * this.inputRuleMatches.length);
      for (const { editorInput, markdownOutput, shouldMatch } of this
        .inputRuleMatches) {
        const source = "";
        const proseMirrorRoot = this.pmu.parse(source);
        const proseMirrorTree = this.pmu
          .schema()
          .nodes["doc"].createAndFill({}, [
            this.pmu
              .schema()
              .nodes["test_paragraph"].createAndFill(
                {},
                shouldMatch ? [] : [this.pmu.schema().text(editorInput)]
              )!,
            ...(shouldMatch
              ? [
                  this.pmu
                    .schema()
                    .nodes[
                      this.extension.proseMirrorNodeName()!
                    ].createAndFill()!,
                ]
              : []),
          ])!;
        const paddedMarkdownOutput = shouldMatch
          ? "\n\n" + markdownOutput
          : markdownOutput + "\n";

        jest.spyOn(console, "warn").mockImplementation();
        createEditor(proseMirrorRoot, {
          plugins: [this.pmu.inputRulesPlugin()],
        })
          .selectText("end")
          .insertText(editorInput)
          .callback((content) => {
            expect(content.doc).toEqualProsemirrorNode(proseMirrorTree);
            expect(this.pmu.serialize(content.doc)).toBe(paddedMarkdownOutput);
          });
        expect(console.warn).not.toHaveBeenCalled();
      }
    });
  }
}
