import type { ImageReference } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
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
import { ImageExtension } from "./ImageExtension";

export interface ImageReferenceExtensionContext {
  proseMirrorNodes: Record<string, ProseMirrorNode>;
}

export class ImageReferenceExtension extends NodeExtension<ImageReference> {
  public dependencies(): Array<Extension> {
    return [new DefinitionExtension(), new ImageExtension()];
  }

  public unifiedInitializationHook(
    processor: Processor<UnistNode, UnistNode, UnistNode, string>
  ): Processor<UnistNode, UnistNode, UnistNode, string> {
    return processor.use(remarkUnwrapImages);
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
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
    context: ConverterContext<{
      ImageReferenceExtension: ImageReferenceExtensionContext;
    }>
  ): Array<ProseMirrorNode> {
    const proseMirrorNode = schema.nodes["image"].createAndFill(
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
