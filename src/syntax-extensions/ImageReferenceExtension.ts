import type { ImageReference } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import { type Extension, NodeExtension } from "prosemirror-unified";

import {
  DefinitionExtension,
  type DefinitionExtensionContext,
} from "./DefinitionExtension";
import { ImageExtension } from "./ImageExtension";

/**
 * @public
 */
export interface ImageReferenceExtensionContext {
  proseMirrorNodes: Record<string, ProseMirrorNode>;
}

/**
 * @public
 */
export class ImageReferenceExtension extends NodeExtension<ImageReference> {
  public override dependencies(): Array<Extension> {
    return [new DefinitionExtension(), new ImageExtension()];
  }

  public override unistNodeName(): "imageReference" {
    return "imageReference";
  }

  public override proseMirrorNodeName(): null {
    return null;
  }

  public override proseMirrorNodeSpec(): null {
    return null;
  }

  public override unistNodeToProseMirrorNodes(
    node: ImageReference,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
    context: Partial<{
      ImageReferenceExtension: ImageReferenceExtensionContext;
    }>,
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = proseMirrorSchema.nodes.image.createAndFill(
      { src: "", alt: node.alt, title: node.label },
      convertedChildren,
    );
    if (proseMirrorNode === null) {
      return [];
    }
    if (context.ImageReferenceExtension === undefined) {
      context.ImageReferenceExtension = { proseMirrorNodes: {} };
    }
    context.ImageReferenceExtension.proseMirrorNodes[node.identifier] =
      proseMirrorNode;
    return [proseMirrorNode];
  }

  public override proseMirrorNodeToUnistNodes(): Array<ImageReference> {
    return [];
  }

  public override postUnistToProseMirrorHook(
    context: Partial<{
      DefinitionExtension: DefinitionExtensionContext;
      ImageReferenceExtension: ImageReferenceExtensionContext;
    }>,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Attrs can be any
        any
      >;
      attrs.src = definition.url;
      if (definition.title !== undefined) {
        attrs.title = definition.title;
      }
    }
  }
}
