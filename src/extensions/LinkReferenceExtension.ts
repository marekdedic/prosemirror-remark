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
    context: ConverterContext
  ): Array<ProseMirrorNode> {
    const mark = schema.marks[this.proseMirrorMarkName()].create({
      href: null,
      title: null,
    });
    if (context.LinkReferenceExtension === undefined) {
      context.LinkReferenceExtension = {};
    }
    if (context.LinkReferenceExtension.marks === undefined) {
      context.LinkReferenceExtension.marks = {};
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

  public postMdastToProseMirrorHook(context: ConverterContext): void {
    if (
      context.LinkReferenceExtension === undefined ||
      context.LinkReferenceExtension.marks === undefined ||
      context.DefinitionExtension === undefined ||
      context.DefinitionExtension.definitions === undefined
    ) {
      return;
    }
    for (const id in context.LinkReferenceExtension.marks as Record<
      string,
      Mark
    >) {
      const definition = context.DefinitionExtension.definitions[id];
      if (definition === undefined) {
        continue;
      }
      context.LinkReferenceExtension.marks[id].attrs.href = definition.url;
      if (definition.title !== undefined) {
        context.LinkReferenceExtension.marks[id].attrs.title = definition.title;
      }
    }
  }
}
