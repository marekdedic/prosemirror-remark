import { createEditor } from "jest-prosemirror";
import type { Mark, Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { MarkExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import {
  SyntaxExtensionTester,
  type SyntaxExtensionTesterConfig,
} from "./SyntaxExtensionTester";

interface MarkExtensionTesterConfig extends SyntaxExtensionTesterConfig {
  proseMirrorMarkName: string | null;
}

export class MarkExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends SyntaxExtensionTester<UNode, UnistToProseMirrorContext> {
  protected readonly extension: MarkExtension<UNode, UnistToProseMirrorContext>;

  private readonly proseMirrorMarkName: string | null;

  private readonly proseMirrorNodeMatches: Array<{
    node: UnistNode;
    mark: Mark;
    shouldMatch: boolean;
  }>;

  private readonly inputRuleMatches: Array<{
    editorInput: string;
    proseMirrorNodes: Array<ProseMirrorNode>;
    markdownOutput: string;
  }>;

  public constructor(
    extension: MarkExtension<UNode, UnistToProseMirrorContext>,
    config: MarkExtensionTesterConfig,
  ) {
    super(extension, config);
    this.extension = extension;

    this.proseMirrorMarkName = config.proseMirrorMarkName;
    this.proseMirrorNodeMatches = [];
    this.inputRuleMatches = [];
  }

  public shouldMatchProseMirrorNode(
    node: UnistNode,
    mark: (schema: Schema<string, string>) => Mark,
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
    mark: (schema: Schema<string, string>) => Mark,
  ): this {
    this.proseMirrorNodeMatches.push({
      node,
      mark: mark(this.pmu.schema()),
      shouldMatch: false,
    });
    return this;
  }

  public shouldMatchInputRule(
    editorInput: string,
    markdownOutput: string,
    proseMirrorContents:
      | string
      | ((schema: Schema<string, string>) => Array<ProseMirrorNode>),
  ): this {
    this.inputRuleMatches.push({
      editorInput,
      proseMirrorNodes:
        typeof proseMirrorContents === "string"
          ? [
              this.pmu
                .schema()
                .text(proseMirrorContents)
                .mark([
                  this.pmu.schema().mark(this.extension.proseMirrorMarkName()!),
                ]),
            ]
          : proseMirrorContents(this.pmu.schema()),
      markdownOutput,
    });
    return this;
  }

  public shouldNotMatchInputRule(
    editorInput: string,
    markdownOutput: string,
    proseMirrorContents?: (
      schema: Schema<string, string>,
    ) => Array<ProseMirrorNode>,
  ): this {
    this.inputRuleMatches.push({
      editorInput,
      proseMirrorNodes: proseMirrorContents?.(this.pmu.schema()) ?? [
        this.pmu.schema().text(editorInput),
      ],
      markdownOutput,
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
        this.proseMirrorMarkName,
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
      for (const { node, mark, shouldMatch } of this.proseMirrorNodeMatches) {
        expect(this.extension.proseMirrorToUnistTest(node, mark)).toBe(
          shouldMatch,
        );
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
      for (const { editorInput, proseMirrorNodes, markdownOutput } of this
        .inputRuleMatches) {
        const source = "BEGIN";
        const proseMirrorRoot = this.pmu.parse(source);
        const proseMirrorTree = this.pmu
          .schema()
          .nodes["doc"].createAndFill({}, [
            this.pmu
              .schema()
              .nodes["paragraph"].createAndFill({}, [
                this.pmu.schema().text("BEGIN"),
                ...proseMirrorNodes,
                this.pmu.schema().text("END"),
              ])!,
          ])!;

        jest.spyOn(console, "warn").mockImplementation();
        createEditor(proseMirrorRoot, {
          plugins: [this.pmu.inputRulesPlugin()],
        })
          .selectText("end")
          .insertText(editorInput)
          .insertText("END")
          .callback((content) => {
            expect(content.doc).toEqualProsemirrorNode(proseMirrorTree);
            expect(this.pmu.serialize(content.doc)).toBe(
              "BEGIN" + markdownOutput + "END\n",
            );
          });
        expect(console.warn).not.toHaveBeenCalled();
      }
    });
  }
}
