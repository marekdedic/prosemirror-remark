import type { Link, LinkReference, Text } from "mdast";
import type {
  DOMOutputSpec,
  Mark,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import type { ConverterContext } from "../ConverterContext";
import { MarkExtension } from "../MarkExtension";
import type { DefinitionExtensionContext } from "./DefinitionExtension";

export interface LinkReferenceExtensionContext {
  marks: Record<string, Mark>;
}

export class LinkReferenceExtension extends MarkExtension {
  public mdastNodeName(): "linkReference" {
    return "linkReference";
  }

  public proseMirrorMarkName(): string {
    return "link";
  }

  public proseMirrorMarkSpec(): MarkSpec {
    return {
      attrs: { href: {}, title: { default: null } },
      inclusive: false,
      parseDOM: [
        {
          tag: "a[href]",
          getAttrs(dom: Node | string): {
            href: string | null;
            title: string | null;
          } {
            return {
              href: (dom as HTMLElement).getAttribute("href"),
              title: (dom as HTMLElement).getAttribute("title"),
            };
          },
        },
      ],
      toDOM(node: Mark): DOMOutputSpec {
        return ["a", node.attrs];
      },
    };
  }

  // TODO: Specialize schema generic
  public mdastNodeToProseMirrorNodes(
    node: LinkReference,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema,
    context: ConverterContext<{
      LinkReferenceExtension: LinkReferenceExtensionContext;
    }>
  ): Array<ProseMirrorNode> {
    const mark = schema.marks[this.proseMirrorMarkName()].create({
      href: null,
      title: null,
    });
    if (context.LinkReferenceExtension === undefined) {
      context.LinkReferenceExtension = { marks: {} };
    }
    context.LinkReferenceExtension.marks[node.identifier] = mark;
    return convertedChildren.map((child) =>
      child.mark(child.marks.concat([mark]))
    );
  }

  // TODO: This shouldn't be called at all
  public modifyMdastNode(convertedNode: Text, originalMark: Mark): Link {
    return {
      type: "link",
      url: originalMark.attrs.href as string,
      title: originalMark.attrs.title as string | null,
      children: [convertedNode],
    };
  }

  public postMdastToProseMirrorHook(
    context: ConverterContext<{
      DefinitionExtension: DefinitionExtensionContext;
      LinkReferenceExtension: LinkReferenceExtensionContext;
    }>
  ): void {
    if (
      context.LinkReferenceExtension === undefined ||
      context.DefinitionExtension === undefined
    ) {
      return;
    }
    for (const id in context.LinkReferenceExtension.marks) {
      const definition = context.DefinitionExtension.definitions[id];
      if (definition === undefined) {
        continue;
      }
      const attrs = context.LinkReferenceExtension.marks[id].attrs as Record<
        string,
        any
      >;
      attrs.href = definition.url;
      if (definition.title !== undefined) {
        attrs.title = definition.title;
      }
    }
  }
}
