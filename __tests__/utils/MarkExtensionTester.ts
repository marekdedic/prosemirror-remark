import type { Mark, Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { MarkExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import { createEditor } from "jest-prosemirror";

import {
  SyntaxExtensionTester,
  type SyntaxExtensionTesterConfig,
} from "./SyntaxExtensionTester";

interface MarkExtensionTesterConfig extends SyntaxExtensionTesterConfig {
  proseMirrorMarkName: string | null;
}

// eslint-disable-next-line jest/no-export -- Not a test file
export class MarkExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends SyntaxExtensionTester<UNode, UnistToProseMirrorContext> {
  protected override readonly extension: MarkExtension<
    UNode,
    UnistToProseMirrorContext
  >;

  private readonly inputRuleMatches: Array<{
    editorInput: string;
    markdownOutput: string;
    proseMirrorNodes: Array<ProseMirrorNode>;
  }>;

  private readonly proseMirrorMarkMatches: Array<{
    mark: Mark;
    shouldMatch: boolean;
  }>;

  private readonly proseMirrorMarkName: string | null;

  public constructor(
    extension: MarkExtension<UNode, UnistToProseMirrorContext>,
    config: MarkExtensionTesterConfig,
  ) {
    super(extension, config);
    this.extension = extension;

    this.proseMirrorMarkName = config.proseMirrorMarkName;
    this.proseMirrorMarkMatches = [];
    this.inputRuleMatches = [];
  }

  public shouldMatchInputRule(
    editorInput: string,
    markdownOutput: string,
    proseMirrorContents:
      | ((schema: Schema<string, string>) => Array<ProseMirrorNode>)
      | string,
  ): this {
    const markName = this.extension.proseMirrorMarkName();
    if (markName === null) {
      throw new Error("Testing input rules for extension without a name");
    }
    this.inputRuleMatches.push({
      editorInput,
      markdownOutput,
      proseMirrorNodes:
        typeof proseMirrorContents === "string"
          ? [
              this.pmu
                .schema()
                .text(proseMirrorContents)
                .mark([this.pmu.schema().mark(markName)]),
            ]
          : proseMirrorContents(this.pmu.schema()),
    });
    return this;
  }

  public shouldMatchProseMirrorMark(
    mark: (schema: Schema<string, string>) => Mark,
  ): this {
    this.proseMirrorMarkMatches.push({
      mark: mark(this.pmu.schema()),
      shouldMatch: true,
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
      markdownOutput,
      proseMirrorNodes: proseMirrorContents?.(this.pmu.schema()) ?? [
        this.pmu.schema().text(editorInput),
      ],
    });
    return this;
  }

  public shouldNotMatchProseMirrorMark(
    mark: (schema: Schema<string, string>) => Mark,
  ): this {
    this.proseMirrorMarkMatches.push({
      mark: mark(this.pmu.schema()),
      shouldMatch: false,
    });
    return this;
  }

  public test(): void {
    // eslint-disable-next-line jest/valid-title -- The rule can't parse that this is a string
    describe(this.extension.constructor.name, () => {
      this.enqueueTests();
    });
  }

  protected override enqueueTests(): void {
    super.enqueueTests();

    test("Provides the correct ProseMirror mark", () => {
      expect(this.extension.proseMirrorMarkName()).toBe(
        this.proseMirrorMarkName,
      );
    });

    this.enqueueProseMirrorNodeMatchTests();
    this.enqueueInputRuleTests();
  }

  private enqueueInputRuleTests(): void {
    if (this.inputRuleMatches.length === 0) {
      return;
    }

    describe("Matches input rules correctly", () => {
      test.each(this.inputRuleMatches)(
        "%p",
        ({ editorInput, markdownOutput, proseMirrorNodes }) => {
          expect.assertions(3);

          const source = "BEGIN";
          const proseMirrorRoot = this.pmu.parse(source);
          const proseMirrorTree = this.pmu
            .schema()
            .nodes[
              "doc"
            ].create({}, [this.pmu.schema().nodes["paragraph"].create({}, [this.pmu.schema().text("BEGIN"), ...proseMirrorNodes, this.pmu.schema().text("END")])]);

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
                `BEGIN${markdownOutput}END\n`,
              );
            });

          // eslint-disable-next-line no-console -- Testing for console
          expect(console.warn).not.toHaveBeenCalled();
        },
      );
    });
  }

  private enqueueProseMirrorNodeMatchTests(): void {
    if (this.proseMirrorMarkMatches.length === 0) {
      return;
    }

    describe("Matches correct ProseMirror nodes", () => {
      test.each(this.proseMirrorMarkMatches)("%p", ({ mark, shouldMatch }) => {
        expect.assertions(1);
        expect(mark.type.name === this.extension.proseMirrorMarkName()).toBe(
          shouldMatch,
        );
      });
    });
  }
}
