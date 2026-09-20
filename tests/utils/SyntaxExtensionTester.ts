import type { Node as UnistNode } from "unist";

import {
  type Attrs,
  DOMSerializer,
  Fragment,
  DOMParser as ProseMirrorDOMParser,
  Node as ProseMirrorNode,
  type Schema,
} from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import {
  builders,
  type MarkBuilder,
  type NodeBuilder,
} from "prosemirror-test-builder";
import {
  type Extension,
  ProseMirrorUnified,
  type SyntaxExtension,
} from "prosemirror-unified";
import { describe, expect, test, vi } from "vitest";
import { renderProseMirror, type TesterSelection } from "vitest-prosemirror";

import { ParagraphExtension } from "../../src/syntax-extensions/ParagraphExtension";
import { RootExtension } from "../../src/syntax-extensions/RootExtension";
import { TextExtension } from "../../src/syntax-extensions/TextExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";

export type Builder = (
  attrsOrFirstChild?: Attrs | BuiltNode,
  ...children: Array<BuiltNode>
) => BuiltNode;

export type BuilderName =
  | "blockquote"
  | "br"
  | "bullet_list"
  | "code_block"
  | "code"
  | "doc"
  | "em"
  | "hard_break"
  | "heading"
  | "horizontal_rule"
  | "hr"
  | "image"
  | "img"
  | "li"
  | "link"
  | "ol"
  | "ordered_list"
  | "p"
  | "paragraph"
  | "regular_list_item"
  | "strikethrough"
  | "strong"
  | "task_list_item"
  | "taskListItem"
  | "ul";

export type BuiltNode = ReturnType<MarkBuilder> | ReturnType<NodeBuilder>;

export interface SyntaxExtensionTesterConfig {
  otherExtensionsInTest?: Array<Extension>;
  unistNodeName: string;
}

export type TestBuilders = Record<BuilderName, Builder> & {
  schema: Schema<string, string>;
};

export class SyntaxExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> {
  protected readonly builders: TestBuilders;

  protected readonly extension: SyntaxExtension<
    UNode,
    UnistToProseMirrorContext
  >;

  protected readonly pmu: ProseMirrorUnified;

  private readonly domParses: Array<{
    html: string;
    target: Array<ProseMirrorNode>;
  }>;

  private readonly domRenders: Array<{
    html: string;
    source: Array<ProseMirrorNode>;
  }>;

  private readonly keymapApplicabilities: Array<{
    applicable: boolean;
    key: string;
    proseMirrorNodes: Array<ProseMirrorNode>;
    selection: { from: number; to: number } | number;
  }>;

  private readonly keymapMatches: Array<{
    key: string;
    markdownOutput: string;
    proseMirrorAfter: Array<ProseMirrorNode>;
    proseMirrorBefore: Array<ProseMirrorNode>;
    selection: TesterSelection;
  }>;

  private readonly proseMirrorNodeConversions: Array<{
    source: ProseMirrorNode;
    target: Array<UnistNode>;
  }>;

  private readonly unistNodeConversions: Array<{
    injectNodes: Array<UnistNode>;
    source: UnistNode;
    target: Array<ProseMirrorNode>;
  }>;

  private readonly unistNodeMatches: Array<{
    node: UnistNode;
    shouldMatch: boolean;
  }>;

  private readonly unistNodeName: string;

  public constructor(
    extension: SyntaxExtension<UNode, UnistToProseMirrorContext>,
    config: SyntaxExtensionTesterConfig,
  ) {
    this.extension = extension;
    this.unistNodeName = config.unistNodeName;

    this.unistNodeMatches = [];
    this.unistNodeConversions = [];
    this.proseMirrorNodeConversions = [];
    this.keymapMatches = [];
    this.domParses = [];
    this.domRenders = [];
    this.keymapApplicabilities = [];

    this.pmu = new ProseMirrorUnified([
      new ParserProviderExtension(),
      new RootExtension(),
      new ParagraphExtension(),
      new TextExtension(),
      ...(config.otherExtensionsInTest ?? []),
      this.extension,
    ]);

    this.builders = builders(this.pmu.schema(), {
      br: { nodeType: "hard_break" },
      hr: { nodeType: "horizontal_rule" },
      img: { nodeType: "image" },
      li: { nodeType: "regular_list_item" },
      ol: { nodeType: "ordered_list" },
      p: { nodeType: "paragraph" },
      taskListItem: { nodeType: "task_list_item" },
      ul: { nodeType: "bullet_list" },
    }) as unknown as TestBuilders;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Generic fixes error with unknown properties
  public shouldConvertProseMirrorNode<TNode extends UnistNode>(
    source: (builders: TestBuilders) => BuiltNode,
    target: Array<TNode>,
  ): this {
    this.proseMirrorNodeConversions.push({
      source: this.resolveNodes(source(this.builders))[0],
      target,
    });
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Generic fixes error with unknown properties
  public shouldConvertUnistNode<SNode extends UnistNode>(
    source: SNode,
    target: (builders: TestBuilders) => Array<BuiltNode>,
    injectNodes: Array<UnistNode> = [],
  ): this {
    this.unistNodeConversions.push({
      injectNodes,
      source,
      target: this.resolveNodes(target(this.builders)),
    });
    return this;
  }

  public shouldMatchUnistNode(node: UNode): this {
    this.unistNodeMatches.push({ node, shouldMatch: true });
    return this;
  }

  public shouldNotMatchUnistNode(node: UnistNode): this {
    this.unistNodeMatches.push({ node, shouldMatch: false });
    return this;
  }

  public shouldParseDOM(
    html: string,
    target: (builders: TestBuilders) => Array<BuiltNode>,
  ): this {
    this.domParses.push({
      html,
      target: this.resolveNodes(target(this.builders)),
    });
    return this;
  }

  public shouldRenderDOM(
    source: (builders: TestBuilders) => Array<BuiltNode>,
    html: string,
  ): this {
    this.domRenders.push({
      html,
      source: this.resolveNodes(source(this.builders)),
    });
    return this;
  }

  public shouldReportKeymapApplicability(
    proseMirrorNodes: (builders: TestBuilders) => Array<BuiltNode>,
    selection: { from: number; to: number } | number,
    key: string,
    applicable: boolean,
  ): this {
    this.keymapApplicabilities.push({
      applicable,
      key,
      proseMirrorNodes: this.resolveNodes(proseMirrorNodes(this.builders)),
      selection,
    });
    return this;
  }

  public shouldSupportKeymap(
    proseMirrorBefore: (builders: TestBuilders) => Array<BuiltNode>,
    selection: TesterSelection,
    key: string,
    proseMirrorAfter: (builders: TestBuilders) => Array<BuiltNode>,
    markdownOutput: string,
  ): this {
    this.keymapMatches.push({
      key,
      markdownOutput,
      proseMirrorAfter: this.resolveNodes(proseMirrorAfter(this.builders)),
      proseMirrorBefore: this.resolveNodes(proseMirrorBefore(this.builders)),
      selection,
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
    this.enqueueKeymapTests();
    this.enqueueDOMParseTests();
    this.enqueueDOMRenderTests();
    this.enqueueKeymapApplicabilityTests();
  }

  /**
   * Flattens the output of one or more builder calls into ProseMirror nodes.
   * `NodeBuilder`s already yield nodes; `MarkBuilder`s yield `{ flat }` child
   * specs (or, for tag-only input, a bare string that becomes a text node).
   */
  protected resolveNodes(
    spec: Array<BuiltNode> | BuiltNode,
  ): Array<ProseMirrorNode> {
    const specs = Array.isArray(spec) ? spec : [spec];
    return specs.flatMap((entry) => {
      if (typeof entry === "string") {
        return [this.pmu.schema().text(entry)];
      }
      if (entry instanceof ProseMirrorNode) {
        return [entry];
      }
      return [...entry.flat];
    });
  }

  private enqueueDOMParseTests(): void {
    if (this.domParses.length === 0) {
      return;
    }

    describe("Parses DOM correctly", () => {
      test.each(this.domParses)("$html", ({ html, target }) => {
        expect.assertions(1);

        const container = document.createElement("div");
        container.innerHTML = html;

        expect(
          ProseMirrorDOMParser.fromSchema(this.pmu.schema()).parse(container),
        ).toEqualProseMirrorNode(
          this.pmu.schema().nodes["doc"].create({}, target),
        );
      });
    });
  }

  private enqueueDOMRenderTests(): void {
    if (this.domRenders.length === 0) {
      return;
    }

    describe("Renders DOM correctly", () => {
      test.each(this.domRenders)("$html", ({ html, source }) => {
        expect.assertions(1);

        const container = document.createElement("div");
        container.appendChild(
          DOMSerializer.fromSchema(this.pmu.schema()).serializeFragment(
            Fragment.from(source),
          ),
        );

        expect(container.innerHTML).toBe(html);
      });
    });
  }

  private enqueueKeymapApplicabilityTests(): void {
    if (this.keymapApplicabilities.length === 0) {
      return;
    }

    describe("Reports keymap applicability correctly", () => {
      test.each(this.keymapApplicabilities)(
        "$selection, $key -> $applicable",
        ({ applicable, key, proseMirrorNodes, selection }) => {
          expect.assertions(2);

          const schema = this.pmu.schema();
          const doc = schema.nodes["doc"].create({}, proseMirrorNodes);
          const state = EditorState.create({ doc }).apply(
            EditorState.create({ doc }).tr.setSelection(
              typeof selection === "number"
                ? TextSelection.near(doc.resolve(selection))
                : TextSelection.between(
                    doc.resolve(selection.from),
                    doc.resolve(selection.to),
                  ),
            ),
          );

          const command = this.extension.proseMirrorKeymap(schema)[key];

          // A command invoked without a dispatch function must only report
          // Whether it applies, without modifying the document.
          expect(command(state)).toBe(applicable);
          expect(state.doc).toEqualProseMirrorNode(doc);
        },
      );
    });
  }

  private enqueueKeymapTests(): void {
    if (this.keymapMatches.length === 0) {
      return;
    }

    describe("Supports keymap correctly", () => {
      test.each(this.keymapMatches)(
        "$selection, $key -> $markdownOutput",
        ({
          key,
          markdownOutput,
          proseMirrorAfter,
          proseMirrorBefore,
          selection,
        }) => {
          expect.assertions(3);

          const proseMirrorTreeBefore = this.pmu
            .schema()
            .nodes["doc"].create({}, proseMirrorBefore);
          const proseMirrorTreeAfter = this.pmu
            .schema()
            .nodes["doc"].create({}, proseMirrorAfter);

          // eslint-disable-next-line @typescript-eslint/no-empty-function -- Empty mock function
          vi.spyOn(console, "warn").mockImplementation(() => {});
          const testEditor = renderProseMirror(proseMirrorTreeBefore, {
            editorProps: {
              plugins: [this.pmu.keymapPlugin()],
            },
          });
          testEditor.setSelection(selection);
          testEditor.type(key);
          expect(testEditor.doc).toEqualProseMirrorNode(proseMirrorTreeAfter);
          expect(this.pmu.serialize(testEditor.doc).replace(/\n$/gu, "")).toBe(
            markdownOutput,
          );

          // eslint-disable-next-line no-console -- Testing for console
          expect(console.warn).not.toHaveBeenCalled();
        },
      );
    });
  }

  private enqueueProseMirrorNodeConversionTests(): void {
    if (this.proseMirrorNodeConversions.length === 0) {
      return;
    }

    describe("Converts ProseMirror -> unist correctly", () => {
      test.each(this.proseMirrorNodeConversions)(
        "$source.type.name -> $target",
        ({ source, target }) => {
          expect.assertions(1);
          expect(
            (
              this.pmu as unknown as {
                proseMirrorToUnistConverter: {
                  convertNode(node: ProseMirrorNode): Array<UnistNode>;
                };
              }
            ).proseMirrorToUnistConverter.convertNode(source),
          ).toStrictEqual(target);
        },
      );
    });
  }

  private enqueueUnistNodeConversionTests(): void {
    if (this.unistNodeConversions.length === 0) {
      return;
    }

    describe("Converts unist -> ProseMirror correctly", () => {
      test.each(this.unistNodeConversions)(
        "$source.type -> $target",
        ({ injectNodes, source, target }) => {
          expect.assertions(1);

          const annotatedPmu = this.pmu as unknown as {
            unistToProseMirrorConverter: {
              convertNode(
                node: UnistNode,
                context: Record<string, unknown>,
              ): Array<ProseMirrorNode>;
            };
          };
          const context = {} as UnistToProseMirrorContext;
          for (const node of injectNodes) {
            annotatedPmu.unistToProseMirrorConverter.convertNode(node, context);
          }
          const result = annotatedPmu.unistToProseMirrorConverter.convertNode(
            source,
            context,
          );
          this.extension.postUnistToProseMirrorHook(context);

          expect(result).toStrictEqual(target);
        },
      );
    });
  }

  private enqueueUnistNodeMatchTests(): void {
    if (this.unistNodeMatches.length === 0) {
      return;
    }

    describe("Matches correct unist nodes", () => {
      test.each(this.unistNodeMatches)(
        "$shouldMatch, $node.type",
        ({ node, shouldMatch }) => {
          expect.assertions(1);
          expect(this.extension.unistToProseMirrorTest(node)).toBe(shouldMatch);
        },
      );
    });
  }
}
