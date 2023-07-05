import { createEditor } from "jest-prosemirror";
import type {
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import {
  createProseMirrorNode,
  Extension,
  NodeExtension,
  ProseMirrorUnified,
  type SyntaxExtension,
} from "prosemirror-unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { TextExtension } from "./TextExtension";

// TODO: Re-evaluate
// eslint-disable-next-line jest/no-export
export interface SyntaxExtensionTesterConfig {
  unistNodeName: string;
}

// TODO: Test keymap
// TODO: Test post-hook
// TODO: Test unist -> ProseMirror

// TODO: Re-evaluate
// eslint-disable-next-line jest/no-export
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
  private readonly unistNodeName: string;

  private readonly unistNodeMatches: Array<{
    node: UnistNode;
    shouldMatch: boolean;
  }>;

  private readonly inputRuleMatches: Array<{
    input: string;
    inline: boolean;
    shouldMatch: boolean;
  }>;

  public constructor(
    extension: SyntaxExtension<UNode, UnistToProseMirrorContext>,
    config: SyntaxExtensionTesterConfig
  ) {
    this.extension = extension;
    this.unistNodeName = config.unistNodeName;

    this.unistNodeMatches = [];
    this.inputRuleMatches = [];
  }

  public shouldMatchUnistNode(node: UnistNode): this {
    this.unistNodeMatches.push({ node, shouldMatch: true });
    return this;
  }

  public shouldNotMatchUnistNode(node: UnistNode): this {
    this.unistNodeMatches.push({ node, shouldMatch: false });
    return this;
  }

  public shouldMatchInputRule(input: string, inline: boolean): this {
    this.inputRuleMatches.push({ input, inline, shouldMatch: true });
    return this;
  }

  protected enqueueTests(): void {
    test("Handles the correct unist node", () => {
      expect(this.extension.unistNodeName()).toBe(this.unistNodeName);
    });

    this.enqueueUnistNodeMatchTests();
    this.enqueueInputRuleTests();
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

  private enqueueInputRuleTests(): void {
    if (this.inputRuleMatches.length === 0) {
      return;
    }
    test("Matches input rules correctly", () => {
      // eslint-disable-next-line jest/prefer-expect-assertions -- The rule requires a number literal
      expect.assertions(3 * this.inputRuleMatches.length);
      for (const { input, inline, shouldMatch } of this.inputRuleMatches) {
        expect(inline).toBe(false); // TODO
        expect(shouldMatch).toBe(true); // TODO
        const pmu = new ProseMirrorUnified([
          new ParserProviderExtension(),
          new ConfigurableRootExtension(
            // TODO: Don't assume node extension
            this.extension as NodeExtension<UnistNode>
          ),
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
              .nodes[
                (
                  this.extension as NodeExtension<UnistNode>
                ).proseMirrorNodeName()!
              ].createAndFill()!,
          ])!;

        createEditor(proseMirrorRoot, {
          plugins: [pmu.inputRulesPlugin()],
        })
          .selectText("end")
          .insertText(input)
          .callback((content) => {
            expect(content.doc).toEqualProsemirrorNode(proseMirrorTree);
          });
      }
    });
  }
}

class ParserProviderExtension extends Extension {
  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor
      .use(remarkParse)
      .use(remarkStringify, { fences: true, resourceLink: true, rule: "-" });
  }
}

interface ConfigurableUnistRoot<ChildNode extends UnistNode> extends UnistNode {
  type: "root";
  children: Array<ChildNode>;
}

class ConfigurableRootExtension<
  ChildNode extends UnistNode
> extends NodeExtension<ConfigurableUnistRoot<ChildNode>> {
  private readonly nodeExtension: NodeExtension<UnistNode>;

  public constructor(nodeExtension: NodeExtension<UnistNode>) {
    super();

    this.nodeExtension = nodeExtension;
  }

  public unistNodeName(): "root" {
    return "root";
  }

  public proseMirrorNodeName(): string {
    return "doc";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      content: this.nodeExtension.proseMirrorNodeName() ?? "text" + "+",
    };
  }

  public unistNodeToProseMirrorNodes(
    _: ConfigurableUnistRoot<ChildNode>,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren
    );
  }

  public proseMirrorNodeToUnistNodes(
    _: ProseMirrorNode,
    convertedChildren: Array<UnistNode>
  ): Array<ConfigurableUnistRoot<ChildNode>> {
    return [
      {
        type: "root",
        children: convertedChildren as Array<ChildNode>,
      },
    ];
  }
}
