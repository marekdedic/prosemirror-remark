import type { ImageReference } from "mdast";
import type { Node as ProseMirrorNode } from "prosemirror-model";
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
  public dependencies(): Array<Extension> {
    return [new DefinitionExtension(), new ImageExtension()];
  }

  public unistNodeName(): "imageReference" {
    return "imageReference";
  }

  public proseMirrorNodeName(): null {
    return null;
  }

  public proseMirrorNodeSpec(): null {
    return null;
  }

  public unistNodeToProseMirrorNodes(
    node: ImageReference,
    convertedChildren: Array<ProseMirrorNode>,
    context: Partial<{
      ImageReferenceExtension: ImageReferenceExtensionContext;
    }>
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = this.proseMirrorSchema().nodes[
      "image"
    ].createAndFill(
      { src: "", alt: node.alt, title: node.label },
      convertedChildren
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

  public proseMirrorToUnistTest(): boolean {
    return false;
  }

  public proseMirrorNodeToUnistNodes(): Array<ImageReference> {
    return [];
  }

  public postUnistToProseMirrorHook(
    context: Partial<{
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
