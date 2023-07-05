import { createEditor } from "jest-prosemirror";
import { type NodeExtension, ProseMirrorUnified } from "prosemirror-unified";
import type { Node as UnistNode } from "unist";

import { ConfigurableRootExtension } from "./ConfigurableRootExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";
import {
  SyntaxExtensionTester,
  type SyntaxExtensionTesterConfig,
} from "./SyntaxExtensionTester";
import { TextExtension } from "./TextExtension";

interface NodeExtensionTesterConfig extends SyntaxExtensionTesterConfig {
  unistNodeName: string;
}

// TODO: Add things from NodeExtension

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

    this.inputRuleMatches = [];
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

    this.enqueueInputRuleTests();
  }

  private enqueueInputRuleTests(): void {
    if (this.inputRuleMatches.length === 0) {
      return;
    }
    test("Matches input rules correctly", () => {
      // eslint-disable-next-line jest/prefer-expect-assertions -- The rule requires a number literal
      expect.assertions(4 * this.inputRuleMatches.length);
      for (const { editorInput, markdownOutput, shouldMatch } of this
        .inputRuleMatches) {
        expect(shouldMatch).toBe(true); // TODO
        const pmu = new ProseMirrorUnified([
          new ParserProviderExtension(),
          new ConfigurableRootExtension(this.extension),
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
              .nodes[this.extension.proseMirrorNodeName()!].createAndFill()!,
          ])!;

        jest.spyOn(console, "warn").mockImplementation();
        createEditor(proseMirrorRoot, {
          plugins: [pmu.inputRulesPlugin()],
        })
          .selectText("end")
          .insertText(editorInput)
          .callback((content) => {
            expect(content.doc).toEqualProsemirrorNode(proseMirrorTree);
            expect(pmu.serialize(content.doc)).toBe(markdownOutput);
          });
        expect(console.warn).not.toHaveBeenCalled();
      }
    });
  }
}
