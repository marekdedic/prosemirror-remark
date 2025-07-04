import type { LinkReference } from "mdast";
import type { Mark, Node as ProseMirrorNode, Schema } from "prosemirror-model";

import { type Extension, MarkExtension } from "prosemirror-unified";

import {
  DefinitionExtension,
  type DefinitionExtensionContext,
} from "./DefinitionExtension";
import { LinkExtension } from "./LinkExtension";

/**
 * @public
 */
export interface LinkReferenceExtensionContext {
  marks: Record<string, Mark>;
}

/**
 * @public
 */
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
    for (const id in context.LinkReferenceExtension.marks) {
      if (!(id in context.DefinitionExtension.definitions)) {
        continue;
      }
      const definition = context.DefinitionExtension.definitions[id];
      const attrs = context.LinkReferenceExtension.marks[id].attrs as Record<
        string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Attrs can be any
        any
      >;
      attrs["href"] = definition.url;
      if (definition.title !== undefined) {
        attrs["title"] = definition.title;
      }
    }
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
    return convertedChildren.map((child) =>
      child.mark(child.marks.concat([mark])),
    );
  }
}
