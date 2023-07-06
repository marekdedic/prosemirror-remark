import { createEditor } from "jest-prosemirror";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import { type NodeExtension, ProseMirrorUnified } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import { ParagraphExtension } from "./ParagraphExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";
import { RootExtension } from "./RootExtension";
import {
  SyntaxExtensionTester,
  type SyntaxExtensionTesterConfig,
} from "./SyntaxExtensionTester";
import { TextExtension } from "./TextExtension";

interface NodeExtensionTesterConfig extends SyntaxExtensionTesterConfig {
  proseMirrorNodeName: string;
}

// TODO: Test proseMirrorNodeSpec
// TODO: Test proseMirrorNodeToUnsitNodes

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

  private readonly proseMirrorNodeName: string;

  private readonly proseMirrorNodeMatches: Array<{
    node: ProseMirrorNode;
    shouldMatch: boolean;
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
    this.inputRuleMatches = [];
  }

  public shouldMatchProseMirrorNode(
    node: (schema: Schema<string, string>) => ProseMirrorNode
  ): this {
    this.proseMirrorNodeMatches.push({
      node: node(this.schema),
      shouldMatch: true,
    });
    return this;
  }

  public shouldNotMatchProseMirrorNode(
    node: (schema: Schema<string, string>) => ProseMirrorNode
  ): this {
    this.proseMirrorNodeMatches.push({
      node: node(this.schema),
      shouldMatch: false,
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
    // eslint-disable-next-line jest/valid-title -- The rule requires a string literal
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

  private enqueueInputRuleTests(): void {
    if (this.inputRuleMatches.length === 0) {
      return;
    }
    test("Matches input rules correctly", () => {
      // eslint-disable-next-line jest/prefer-expect-assertions -- The rule requires a number literal
      expect.assertions(3 * this.inputRuleMatches.length);
      for (const { editorInput, markdownOutput, shouldMatch } of this
        .inputRuleMatches) {
        const pmu = new ProseMirrorUnified([
          new ParserProviderExtension(),
          new RootExtension(),
          new ParagraphExtension(),
          new TextExtension(),
          this.extension,
        ]);

        const source = "";
        const proseMirrorRoot = pmu.parse(source);
        const proseMirrorTree = pmu
          .schema()
          .nodes["doc"].createAndFill({}, [
            pmu
              .schema()
              .nodes["test_paragraph"].createAndFill(
                {},
                shouldMatch ? [] : [pmu.schema().text(editorInput)]
              )!,
            ...(shouldMatch
              ? [
                  pmu
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
          plugins: [pmu.inputRulesPlugin()],
        })
          .selectText("end")
          .insertText(editorInput)
          .callback((content) => {
            expect(content.doc).toEqualProsemirrorNode(proseMirrorTree);
            expect(pmu.serialize(content.doc)).toBe(paddedMarkdownOutput);
          });
        expect(console.warn).not.toHaveBeenCalled();
      }
    });
  }
}
