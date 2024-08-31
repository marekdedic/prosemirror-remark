import type { Link, Text } from "mdast";
import type {
  DOMOutputSpec,
  Mark,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import { MarkExtension } from "prosemirror-unified";

/**
 * @public
 */
export class LinkExtension extends MarkExtension<Link> {
  public override unistNodeName(): "link" {
    return "link";
  }

  public override proseMirrorMarkName(): string {
    return "link";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
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

  public override unistNodeToProseMirrorNodes(
    node: Link,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(
        child.marks.concat([
          proseMirrorSchema.marks[this.proseMirrorMarkName()].create({
            href: node.url,
            title: node.title,
          }),
        ]),
      ),
    );
  }

  public override processConvertedUnistNode(
    convertedNode: Text,
    originalMark: Mark,
  ): Link {
    return {
      type: this.unistNodeName(),
      url: originalMark.attrs.href as string,
      ...(originalMark.attrs.title !== null && {
        title: originalMark.attrs.title as string,
      }),
      children: [convertedNode],
    };
  }
}
