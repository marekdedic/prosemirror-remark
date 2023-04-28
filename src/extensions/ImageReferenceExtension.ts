import type { Image, ImageReference } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import remarkUnwrapImages from "remark-unwrap-images";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import type { ConverterContext } from "../ConverterContext";
import { NodeExtension } from "../NodeExtension";

export class ImageReferenceExtension extends NodeExtension {
  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor.use(remarkUnwrapImages);
  }

  public mdastNodeName(): "imageReference" {
    return "imageReference";
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

  public mdastNodeToProseMirrorNodes(
    node: ImageReference,
    convertedChildren: Array<ProseMirrorNode>,
    schema: Schema,
    context: ConverterContext
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = schema.nodes[
      this.proseMirrorNodeName()
    ].createAndFill(
      { src: "", alt: node.alt, title: node.label },
      convertedChildren
    );
    if (proseMirrorNode === null) {
      return [];
    }
    if (context.ImageReferenceExtension === undefined) {
      context.ImageReferenceExtension = {};
    }
    if (context.ImageReferenceExtension.proseMirrorNodes === undefined) {
      context.ImageReferenceExtension.proseMirrorNodes = {};
    }
    context.ImageReferenceExtension.proseMirrorNodes[node.identifier] =
      proseMirrorNode;
    return [proseMirrorNode];
  }

  public proseMirrorNodeToMdastNodes(node: ProseMirrorNode): Array<Image> {
    return [
      {
        type: "image",
        url: node.attrs.src as string,
        title: node.attrs.title as string | null,
        alt: node.attrs.alt as string | null,
      },
    ];
  }

  public postMdastToProseMirrorHook(context: ConverterContext): void {
    if (
      context.ImageReferenceExtension === undefined ||
      context.ImageReferenceExtension.proseMirrorNodes === undefined ||
      context.DefinitionExtension === undefined ||
      context.DefinitionExtension.imageDefinitions === undefined
    ) {
      return;
    }
    for (const id in context.ImageReferenceExtension.proseMirrorNodes as Record<
      string,
      ProseMirrorNode
    >) {
      const definition = context.DefinitionExtension.imageDefinitions[id];
      if (definition === undefined) {
        continue;
      }
      context.ImageReferenceExtension.proseMirrorNodes[id].attrs.src =
        definition.url;
    }
  }
}
