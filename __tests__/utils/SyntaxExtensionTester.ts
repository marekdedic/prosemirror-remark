import type { PrimitiveSelection } from "@remirror/core-types";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import { createEditor } from "jest-prosemirror";
import {
  type Extension,
  ProseMirrorUnified,
  type SyntaxExtension,
} from "prosemirror-unified";

import { ParagraphExtension } from "./ParagraphExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";
import { RootExtension } from "./RootExtension";
import { TextExtension } from "./TextExtension";

// eslint-disable-next-line jest/no-export -- Not a test file
export interface SyntaxExtensionTesterConfig {
  otherExtensionsInTest?: Array<Extension>;
  unistNodeName: string;
}

// eslint-disable-next-line jest/no-export -- Not a test file
export class SyntaxExtensionTester<
  UNode extends UnistNode,
  UnistToProseMirrorContext extends Record<string, unknown> = Record<
    string,
    never
  >,
> {
  protected readonly extension: SyntaxExtension<
    UNode,
    UnistToProseMirrorContext
  >;

  protected readonly pmu: ProseMirrorUnified;

  private readonly keymapMatches: Array<{
    key: string;
    markdownOutput: string;
    proseMirrorAfter: Array<ProseMirrorNode>;
    proseMirrorBefore: Array<ProseMirrorNode>;
    selection: PrimitiveSelection;
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

    this.pmu = new ProseMirrorUnified([
      new ParserProviderExtension(),
      new RootExtension(),
      new ParagraphExtension(),
      new TextExtension(),
      ...(config.otherExtensionsInTest ?? []),
      this.extension,
    ]);
  }

  protected enqueueTests(): void {
    test("Handles the correct unist node", () => {
      expect(this.extension.unistNodeName()).toBe(this.unistNodeName);
    });

    this.enqueueUnistNodeMatchTests();
    this.enqueueUnistNodeConversionTests();
    this.enqueueProseMirrorNodeConversionTests();
    this.enqueueKeymapTests();
  }

  private enqueueKeymapTests(): void {
    if (this.keymapMatches.length === 0) {
      return;
    }

    describe("Supports keymap correctly", () => {
      test.each(this.keymapMatches)(
        "%p",
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

          jest.spyOn(console, "warn").mockImplementation();
          createEditor(proseMirrorTreeBefore, {
            plugins: [this.pmu.keymapPlugin()],
          })
            .selectText(selection)
            .shortcut(key)
            .callback((content) => {
              expect(content.doc).toEqualProsemirrorNode(proseMirrorTreeAfter);
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

  private enqueueProseMirrorNodeConversionTests(): void {
    if (this.proseMirrorNodeConversions.length === 0) {
      return;
    }

    describe("Converts ProseMirror -> unist correctly", () => {
      test.each(this.proseMirrorNodeConversions)("%p", ({ source, target }) => {
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
      });
    });
  }

  private enqueueUnistNodeConversionTests(): void {
    if (this.unistNodeConversions.length === 0) {
      return;
    }

    describe("Converts unist -> ProseMirror correctly", () => {
      test.each(this.unistNodeConversions)(
        "%p",
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
      test.each(this.unistNodeMatches)("%p", ({ node, shouldMatch }) => {
        expect.assertions(1);
        expect(this.extension.unistToProseMirrorTest(node)).toBe(shouldMatch);
      });
    });
  }

  public shouldConvertProseMirrorNode(
    source: (schema: Schema<string, string>) => ProseMirrorNode,
    target: Array<UnistNode | UNode>,
  ): this {
    this.proseMirrorNodeConversions.push({
      source: source(this.pmu.schema()),
      target,
    });
    return this;
  }

  public shouldConvertUnistNode(
    source: UnistNode | UNode,
    target: (schema: Schema<string, string>) => Array<ProseMirrorNode>,
    injectNodes: Array<UnistNode> = [],
  ): this {
    this.unistNodeConversions.push({
      injectNodes,
      source,
      target: target(this.pmu.schema()),
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

  public shouldSupportKeymap(
    proseMirrorBefore: (
      schema: Schema<string, string>,
    ) => Array<ProseMirrorNode>,
    selection: PrimitiveSelection,
    key: string,
    proseMirrorAfter: (
      schema: Schema<string, string>,
    ) => Array<ProseMirrorNode>,
    markdownOutput: string,
  ): this {
    this.keymapMatches.push({
      key,
      markdownOutput,
      proseMirrorAfter: proseMirrorAfter(this.pmu.schema()),
      proseMirrorBefore: proseMirrorBefore(this.pmu.schema()),
      selection,
    });
    return this;
  }
}
