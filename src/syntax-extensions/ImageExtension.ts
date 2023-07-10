import type { Image } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
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
  public dependencies(): Array<Extension> {
    return [new ParagraphExtension()];
  }

  public unistNodeName(): "image" {
    return "image";
  }

  public proseMirrorNodeName(): string {
    return "image";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      inline: true,
      attrs: {
        src: {},
        alt: { default: null },
        title: { default: null },
      },
      group: "inline",
      draggable: true,
      parseDOM: [
        {
          getAttrs(dom: Node | string): {
            src: string | null;
            alt: string | null;
            title: string | null;
          } {
            return {
              src: (dom as HTMLElement).getAttribute("src"),
              alt: (dom as HTMLElement).getAttribute("alt"),
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

  public unistNodeToProseMirrorNodes(
    node: Image,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return createProseMirrorNode(
      this.proseMirrorNodeName(),
      proseMirrorSchema,
      convertedChildren,
      {
        src: node.url,
        alt: node.alt,
        title: node.title,
      }
    );
  }

  public proseMirrorNodeToUnistNodes(node: ProseMirrorNode): Array<Image> {
    return [
      {
        type: this.unistNodeName(),
        url: node.attrs.src as string,
        ...(node.attrs.alt !== null && { alt: node.attrs.alt as string }),
        ...(node.attrs.title !== null && { title: node.attrs.title as string }),
      },
    ];
  }
}
