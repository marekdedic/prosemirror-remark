import type { Node as UnistNode } from "unist";

import {
  type Attrs,
  Node as ProseMirrorNode,
  type Schema,
} from "prosemirror-model";
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

/**
 * Shared test fixture for a single syntax extension: a minimal
 * `ProseMirrorUnified` instance plus the `prosemirror-test-builder` helpers and
 * a couple of accessors that the matchers assert against.
 */
export interface ExtensionFixture<UNode extends UnistNode> {
  b: TestBuilders;
  convertProseMirrorNode(node: ProseMirrorNode): Array<UnistNode>;
  convertUnistNode(
    node: UnistNode,
    context: Record<string, unknown>,
  ): Array<ProseMirrorNode>;
  extension: SyntaxExtension<UNode, Record<string, unknown>>;
  pmu: ProseMirrorUnified;
  /**
   * Flattens builder output into ProseMirror nodes: `NodeBuilder`s already
   * yield nodes, `MarkBuilder`s yield `{ flat }` child specs, and a bare string
   * becomes a text node.
   */
  resolveNodes(spec: Array<BuiltNode> | BuiltNode): Array<ProseMirrorNode>;
  schema: Schema<string, string>;
}

export type TestBuilders = Record<BuilderName, Builder> & {
  schema: Schema<string, string>;
};

/** A raw unist node literal, permitting extra fields like `children`/`value`. */
export type UnistLike = Record<string, unknown> & UnistNode;

export function createExtensionFixture<UNode extends UnistNode>(
  extension: SyntaxExtension<UNode>,
  otherExtensions: Array<Extension> = [],
): ExtensionFixture<UNode> {
  const pmu = createTestProseMirrorUnified(extension, otherExtensions);

  const schema = pmu.schema();

  const b = builders(schema, {
    br: { nodeType: "hard_break" },
    hr: { nodeType: "horizontal_rule" },
    img: { nodeType: "image" },
    li: { nodeType: "regular_list_item" },
    ol: { nodeType: "ordered_list" },
    p: { nodeType: "paragraph" },
    taskListItem: { nodeType: "task_list_item" },
    ul: { nodeType: "bullet_list" },
  }) as unknown as TestBuilders;

  const internals = pmu as unknown as {
    proseMirrorToUnistConverter: {
      convertNode(node: ProseMirrorNode): Array<UnistNode>;
    };
    unistToProseMirrorConverter: {
      convertNode(
        node: UnistNode,
        context: Record<string, unknown>,
      ): Array<ProseMirrorNode>;
    };
  };

  return {
    b,
    convertProseMirrorNode: (node) =>
      internals.proseMirrorToUnistConverter.convertNode(node),
    convertUnistNode: (node, context) =>
      internals.unistToProseMirrorConverter.convertNode(node, context),
    extension,
    pmu,
    resolveNodes: (spec): Array<ProseMirrorNode> => {
      const specs = Array.isArray(spec) ? spec : [spec];
      return specs.flatMap((entry) => {
        if (typeof entry === "string") {
          return [schema.text(entry)];
        }
        if (entry instanceof ProseMirrorNode) {
          return [entry];
        }
        return [...entry.flat];
      });
    },
    schema,
  };
}

export function createTestProseMirrorUnified(
  extension: Extension,
  otherExtensions: Array<Extension> = [],
): ProseMirrorUnified {
  return new ProseMirrorUnified([
    new ParserProviderExtension(),
    new RootExtension(),
    new ParagraphExtension(),
    new TextExtension(),
    ...otherExtensions,
    extension,
  ]);
}
