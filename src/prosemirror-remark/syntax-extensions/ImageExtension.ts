import type { Image, Paragraph } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
} from "prosemirror-model";
import { type Extension, NodeExtension } from "prosemirror-unified";
import remarkUnwrapImages from "remark-unwrap-images";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { ParagraphExtension } from "./ParagraphExtension";

export class ImageExtension extends NodeExtension<Image | Paragraph> {
  public dependencies(): Array<Extension> {
    return [new ParagraphExtension()];
  }

  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor.use(remarkUnwrapImages);
  }

  public unistNodeName(): "image" {
    return "image";
  }

  public proseMirrorNodeName(): string {
    return "image";
  }

  public proseMirrorNodeSpec(): NodeSpec {
    return {
      inline: false,
      attrs: {
        src: {},
        alt: { default: null },
        title: { default: null },
      },
      group: "block",
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
    convertedChildren: Array<ProseMirrorNode>
  ): Array<ProseMirrorNode> {
    return this.createProseMirrorNodeHelper(convertedChildren, {
      src: node.url,
      alt: node.alt,
      title: node.title,
    });
  }

  public proseMirrorNodeToUnistNodes(node: ProseMirrorNode): Array<Paragraph> {
    return [
      // The paragraph is needed to counter-balance remark-unwrap-images, otherwise stringification breaks
      {
        type: "paragraph",
        children: [
          {
            type: this.unistNodeName(),
            url: node.attrs.src as string,
            title: node.attrs.title as string | null,
            alt: node.attrs.alt as string | null,
          },
        ],
      },
    ];
  }
}
