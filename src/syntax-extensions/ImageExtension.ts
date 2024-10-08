import type { Image } from "mdast";
import type {
  DOMOutputSpec,
  NodeSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";

import {
  createProseMirrorNode,
  type Extension,
  NodeExtension,
} from "prosemirror-unified";

import { ParagraphExtension } from "./ParagraphExtension";

/**
 * @public
 */
export class ImageExtension extends NodeExtension<Image> {
  public override dependencies(): Array<Extension> {
    return [new ParagraphExtension()];
  }

  public override proseMirrorNodeName(): string {
    return "image";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return {
      attrs: {
        alt: { default: null },
        src: {},
        title: { default: null },
      },
      draggable: true,
      group: "inline",
      inline: true,
      parseDOM: [
        {
          getAttrs(dom: Node | string): {
            alt: string | null;
            src: string | null;
            title: string | null;
          } {
            return {
              alt: (dom as HTMLElement).getAttribute("alt"),
              src: (dom as HTMLElement).getAttribute("src"),
              title: (dom as HTMLElement).getAttribute("title"),
            };
          },
          tag: "img[src]",
        },
      ],
      toDOM(node: ProseMirrorNode): DOMOutputSpec {
        return ["img", node.attrs];
      },
    };
  }

  public override proseMirrorNodeToUnistNodes(
    node: ProseMirrorNode,
  ): Array<Image> {
    return [
      {
        type: this.unistNodeName(),
        url: node.attrs["src"] as string,
        ...(node.attrs["alt"] !== null && { alt: node.attrs["alt"] as string }),
        ...(node.attrs["title"] !== null && {
          title: node.attrs["title"] as string,
        }),
      },
    ];
  }

  public override unistNodeName(): "image" {
    return "image";
  }

  public override unistNodeToProseMirrorNodes(
    node: Image,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
      {
        alt: node.alt,
        src: node.url,
        title: node.title,
      },
    );
  }
}
