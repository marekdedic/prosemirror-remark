import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { NodeExtension } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import { describe, expect, test, vi } from "vitest";
import { ProseMirrorTester } from "vitest-prosemirror";

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
    describe(this.extension.constructor.name, () => {
      this.enqueueTests();
    });
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
        "$editorInput -> $markdownOutput",
        ({ editorInput, markdownOutput, proseMirrorNodes }) => {
          expect.assertions(3);

          const proseMirrorTreeBefore = this.pmu
            .schema()
            .nodes[
              "doc"
            ].create({}, [this.pmu.schema().nodes["paragraph"].create()]);
          const proseMirrorTreeAfter = this.pmu
            .schema()
            .nodes["doc"].create({}, proseMirrorNodes);

          // eslint-disable-next-line @typescript-eslint/no-empty-function -- Empty mock function
          vi.spyOn(console, "warn").mockImplementation(() => {});
          const testEditor = new ProseMirrorTester(proseMirrorTreeBefore, {
            plugins: [this.pmu.inputRulesPlugin(), this.pmu.keymapPlugin()],
          });
          testEditor.selectText("end");
          testEditor.insertText(editorInput);
          expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTreeAfter);
          expect(this.pmu.serialize(testEditor.doc)).toBe(
            `${markdownOutput}\n`,
          );

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
      test.each(this.proseMirrorNodeMatches)(
        "$shouldMatch, $node.type.name",
        ({ node, shouldMatch }) => {
          expect.assertions(1);
          expect(this.extension.proseMirrorToUnistTest(node)).toBe(shouldMatch);
        },
      );
    });
  }
}
