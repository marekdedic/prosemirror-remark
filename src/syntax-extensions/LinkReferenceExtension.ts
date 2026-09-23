import type { LinkReference } from "mdast";
import type { Mark, Node as ProseMirrorNode, Schema } from "prosemirror-model";

import { type Extension, MarkExtension } from "prosemirror-unified";

import { addMarkToNodes } from "../utils/addMarkToNodes";
import { resolveReferences } from "../utils/resolveReferences";
import {
  DefinitionExtension,
  type DefinitionExtensionContext,
} from "./DefinitionExtension";
import { LinkExtension } from "./LinkExtension";

export interface LinkReferenceExtensionContext {
  marks: Record<string, Mark>;
}

export class LinkReferenceExtension extends MarkExtension<LinkReference> {
  public override dependencies(): Array<Extension> {
    return [new DefinitionExtension(), new LinkExtension()];
  }

  public override postUnistToProseMirrorHook(
    context: Partial<{
      DefinitionExtension: DefinitionExtensionContext;
      LinkReferenceExtension: LinkReferenceExtensionContext;
    }>,
  ): void {
    if (
      context.LinkReferenceExtension === undefined ||
      context.DefinitionExtension === undefined
    ) {
      return;
    }
    resolveReferences(
      context.LinkReferenceExtension.marks,
      context.DefinitionExtension.definitions,
      "href",
    );
  }

  public override processConvertedUnistNode(
    convertedNode: LinkReference,
  ): LinkReference {
    return convertedNode;
  }

  public override proseMirrorMarkName(): null {
    return null;
  }

  public override proseMirrorMarkSpec(): null {
    return null;
  }

  public override unistNodeName(): "linkReference" {
    return "linkReference";
  }

  public override unistNodeToProseMirrorNodes(
    node: LinkReference,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
    context: Partial<{
      LinkReferenceExtension: LinkReferenceExtensionContext;
    }>,
  ): Array<ProseMirrorNode> {
    const mark = proseMirrorSchema.marks["link"].create({
      href: null,
      title: null,
    });
    context.LinkReferenceExtension ??= { marks: {} };
    context.LinkReferenceExtension.marks[node.identifier] = mark;
    return addMarkToNodes(convertedChildren, mark);
  }
}
