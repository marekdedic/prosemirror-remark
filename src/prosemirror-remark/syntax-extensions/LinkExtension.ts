import type { Link, Text } from "mdast";
import type {
  DOMOutputSpec,
  Mark,
  MarkSpec,
  Node as ProseMirrorNode,
} from "prosemirror-model";

import { MarkExtension } from "../../prosemirror-unified";

export class LinkExtension extends MarkExtension<Link> {
  public unistNodeName(): "link" {
    return "link";
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

  // TODO: Add a keymap

  public unistNodeToProseMirrorNodes(
    node: Link,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return convertedChildren.map((child) =>
      child.mark(
        child.marks.concat([
          this.proseMirrorSchema().marks[this.proseMirrorMarkName()].create({
            href: node.url,
            title: node.title,
          }),
        ])
      )
    );
  }

  public processConvertedUnistNode(
    convertedNode: Text,
    originalMark: Mark
  ): Link {
    return {
      type: this.unistNodeName(),
      url: originalMark.attrs.href as string,
      title: originalMark.attrs.title as string | null,
      children: [convertedNode],
    };
  }
}
