import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import { createEditor } from "jest-prosemirror";

import {
  SyntaxExtensionTester,
  type SyntaxExtensionTesterConfig,
} from "./SyntaxExtensionTester";

interface NodeExtensionTesterConfig extends SyntaxExtensionTesterConfig {
  proseMirrorNodeName: string | null;
}

// eslint-disable-next-line jest/no-export -- Not a test file
export class NodeExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends SyntaxExtensionTester<UNode, UnistToProseMirrorContext> {
  protected override readonly extension: NodeExtension<
    UNode,
    UnistToProseMirrorContext
  >;

  private readonly inputRuleMatches: Array<{
    editorInput: string;
    markdownOutput: string;
    proseMirrorNodes: Array<ProseMirrorNode>;
  }>;

  private readonly proseMirrorNodeMatches: Array<{
    node: ProseMirrorNode;
    shouldMatch: boolean;
  }>;

  private readonly proseMirrorNodeName: string | null;

  public constructor(
    extension: NodeExtension<UNode, UnistToProseMirrorContext>,
    config: NodeExtensionTesterConfig,
  ) {
    super(extension, config);
    this.extension = extension;

    this.proseMirrorNodeName = config.proseMirrorNodeName;
    this.proseMirrorNodeMatches = [];
    this.inputRuleMatches = [];
  }

  protected override enqueueTests(): void {
    super.enqueueTests();

    test("Provides the correct ProseMirror node", () => {
      expect(this.extension.proseMirrorNodeName()).toBe(
        this.proseMirrorNodeName,
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

          const source = "";
          const proseMirrorRoot = this.pmu.parse(source);
          const proseMirrorTree = this.pmu
            .schema()
            .nodes["doc"].create({}, proseMirrorNodes);

          jest.spyOn(console, "warn").mockImplementation();
          createEditor(proseMirrorRoot, {
            plugins: [this.pmu.inputRulesPlugin()],
          })
            .selectText("end")
            .insertText(editorInput)
            .callback((content) => {
              expect(content.doc).toEqualProsemirrorNode(proseMirrorTree);
              expect(
                this.pmu.serialize(content.doc).replace(/^\s+|\s+$/gu, ""),
              ).toBe(markdownOutput);
            });

          // eslint-disable-next-line no-console -- Testing for console
          expect(console.warn).not.toHaveBeenCalled();
        },
      );
    });
  }

  private enqueueProseMirrorNodeMatchTests(): void {
    if (this.proseMirrorNodeMatches.length === 0) {
      return;
    }

    describe("Matches correct ProseMirror nodes", () => {
      test.each(this.proseMirrorNodeMatches)("%p", ({ node, shouldMatch }) => {
        expect.assertions(1);
        expect(this.extension.proseMirrorToUnistTest(node)).toBe(shouldMatch);
      });
    });
  }

  public shouldMatchInputRule(
    editorInput: string,
    proseMirrorNodes: (
      schema: Schema<string, string>,
    ) => Array<ProseMirrorNode>,
    markdownOutput: string,
  ): this {
    this.inputRuleMatches.push({
      editorInput,
      markdownOutput,
      proseMirrorNodes: proseMirrorNodes(this.pmu.schema()),
    });
    return this;
  }

  public shouldMatchProseMirrorNode(
    node: (schema: Schema<string, string>) => ProseMirrorNode,
  ): this {
    this.proseMirrorNodeMatches.push({
      node: node(this.pmu.schema()),
      shouldMatch: true,
    });
    return this;
  }

  public shouldNotMatchInputRule(
    editorInput: string,
    markdownOutput: string,
    proseMirrorNodes?: (
      schema: Schema<string, string>,
    ) => Array<ProseMirrorNode>,
  ): this {
    this.inputRuleMatches.push({
      editorInput,
      markdownOutput,
      proseMirrorNodes: proseMirrorNodes?.(this.pmu.schema()) ?? [
        this.pmu
          .schema()
          .nodes["paragraph"].create({}, [this.pmu.schema().text(editorInput)]),
      ],
    });
    return this;
  }

  public shouldNotMatchProseMirrorNode(
    node: (schema: Schema<string, string>) => ProseMirrorNode,
  ): this {
    this.proseMirrorNodeMatches.push({
      node: node(this.pmu.schema()),
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
}
