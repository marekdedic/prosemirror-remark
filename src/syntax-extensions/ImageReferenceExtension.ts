import type { ImageReference } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";

import { type Extension, NodeExtension } from "prosemirror-unified";

import { resolveReferences } from "../utils/resolveReferences";
import {
  DefinitionExtension,
  type DefinitionExtensionContext,
} from "./DefinitionExtension";
import { ImageExtension } from "./ImageExtension";

export interface ImageReferenceExtensionContext {
  proseMirrorNodes: Record<string, ProseMirrorNode>;
}

export class ImageReferenceExtension extends NodeExtension<ImageReference> {
  public override dependencies(): Array<Extension> {
    return [new DefinitionExtension(), new ImageExtension()];
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
    resolveReferences(
      context.ImageReferenceExtension.proseMirrorNodes,
      context.DefinitionExtension.definitions,
      "src",
    );
  }

  public override proseMirrorNodeName(): null {
    return null;
  }

  public override proseMirrorNodeSpec(): null {
    return null;
  }

  public override proseMirrorNodeToUnistNodes(): Array<ImageReference> {
    return [];
  }

  public override unistNodeName(): "imageReference" {
    return "imageReference";
  }

  public override unistNodeToProseMirrorNodes(
    node: ImageReference,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
    context: Partial<{
      ImageReferenceExtension: ImageReferenceExtensionContext;
    }>,
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = proseMirrorSchema.nodes["image"].createAndFill(
      { alt: node.alt, src: "", title: node.label },
      convertedChildren,
    );
    if (proseMirrorNode === null) {
      return [];
    }
    context.ImageReferenceExtension ??= { proseMirrorNodes: {} };
    context.ImageReferenceExtension.proseMirrorNodes[node.identifier] =
      proseMirrorNode;
    return [proseMirrorNode];
  }
}
