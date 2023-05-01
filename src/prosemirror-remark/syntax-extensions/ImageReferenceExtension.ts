import type { ImageReference, Paragraph } from "mdast";
import type {
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  Schema,
} from "prosemirror-model";
import remarkUnwrapImages from "remark-unwrap-images";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import {
  type ConverterContext,
  type Extension,
  NodeExtension,
} from "../../prosemirror-unified";
import {
  DefinitionExtension,
  type DefinitionExtensionContext,
} from "./DefinitionExtension";

export interface ImageReferenceExtensionContext {
  proseMirrorNodes: Record<string, ProseMirrorNode>;
}

export class ImageReferenceExtension extends NodeExtension<
  ImageReference | Paragraph
> {
  public dependencies(): Array<Extension> {
    return [new DefinitionExtension()];
  }

  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor.use(remarkUnwrapImages);
  }

  public unistNodeName(): "imageReference" {
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

  public unistNodeToProseMirrorNodes(
    node: ImageReference,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
    context: ConverterContext<{
      ImageReferenceExtension: ImageReferenceExtensionContext;
    }>
  ): Array<ProseMirrorNode> {
    const proseMirrorNodes = this.createProseMirrorNodeHelper(
      schema,
      convertedChildren,
      { src: "", alt: node.alt, title: node.label }
    );
    if (proseMirrorNodes.length == 1) {
      if (context.ImageReferenceExtension === undefined) {
        context.ImageReferenceExtension = { proseMirrorNodes: {} };
      }
      context.ImageReferenceExtension.proseMirrorNodes[node.identifier] =
        proseMirrorNodes[0];
    }
    return proseMirrorNodes;
  }

  // TODO: This shouldn't be called at all
  public proseMirrorNodeToUnistNodes(node: ProseMirrorNode): Array<Paragraph> {
    return [
      // The paragraph is needed to counter-balance remark-unwrap-images, otherwise stringification breaks
      {
        type: "paragraph",
        children: [
          {
            type: "image",
            url: node.attrs.src as string,
            title: node.attrs.title as string | null,
            alt: node.attrs.alt as string | null,
          },
        ],
      },
    ];
  }

  public postUnistToProseMirrorHook(
    context: ConverterContext<{
      DefinitionExtension: DefinitionExtensionContext;
      ImageReferenceExtension: ImageReferenceExtensionContext;
    }>
  ): void {
    if (
      context.ImageReferenceExtension === undefined ||
      context.DefinitionExtension === undefined
    ) {
      return;
    }
    for (const id in context.ImageReferenceExtension.proseMirrorNodes) {
      if (!(id in context.DefinitionExtension.definitions)) {
        continue;
      }
      const definition = context.DefinitionExtension.definitions[id];
      const attrs = context.ImageReferenceExtension.proseMirrorNodes[id]
        .attrs as Record<
        string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      >;
      attrs.src = definition.url;
      if (definition.title !== undefined) {
        attrs.title = definition.title;
      }
    }
  }
}
