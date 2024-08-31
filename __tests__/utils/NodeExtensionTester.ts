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

export class NodeExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> extends SyntaxExtensionTester<UNode, UnistToProseMirrorContext> {
  protected readonly extension: NodeExtension<UNode, UnistToProseMirrorContext>;

  private readonly proseMirrorNodeName: string | null;

  private readonly proseMirrorNodeMatches: Array<{
    node: ProseMirrorNode;
    shouldMatch: boolean;
  }>;

  private readonly inputRuleMatches: Array<{
    editorInput: string;
    proseMirrorNodes: Array<ProseMirrorNode>;
    markdownOutput: string;
  }>;

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

  public shouldMatchProseMirrorNode(
    node: (schema: Schema<string, string>) => ProseMirrorNode,
  ): this {
    this.proseMirrorNodeMatches.push({
      node: node(this.pmu.schema()),
      shouldMatch: true,
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

  public shouldMatchInputRule(
    editorInput: string,
    proseMirrorNodes: (
      schema: Schema<string, string>,
    ) => Array<ProseMirrorNode>,
    markdownOutput: string,
  ): this {
    this.inputRuleMatches.push({
      editorInput,
      proseMirrorNodes: proseMirrorNodes(this.pmu.schema()),
      markdownOutput,
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
      proseMirrorNodes: proseMirrorNodes?.(this.pmu.schema()) ?? [
        this.pmu
          .schema()
          .nodes.paragraph.createAndFill({}, [
            this.pmu.schema().text(editorInput),
          ])!,
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

    test("Provides the correct ProseMirror node", () => {
      expect(this.extension.proseMirrorNodeName()).toBe(
        this.proseMirrorNodeName,
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

      for (const { editorInput, proseMirrorNodes, markdownOutput } of this
        .inputRuleMatches) {
        const source = "";
        const proseMirrorRoot = this.pmu.parse(source);
        const proseMirrorTree = this.pmu
          .schema()
          .nodes.doc.createAndFill({}, proseMirrorNodes)!;

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
      }
    });
  }
}
