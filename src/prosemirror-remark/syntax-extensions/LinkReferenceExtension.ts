import type { Link, LinkReference } from "mdast";
import type { Mark, Node as ProseMirrorNode, Schema } from "prosemirror-model";

import {
  type ConverterContext,
  type Extension,
  MarkExtension,
} from "../../prosemirror-unified";
import {
  DefinitionExtension,
  type DefinitionExtensionContext,
} from "./DefinitionExtension";
import { LinkExtension } from "./LinkExtension";

export interface LinkReferenceExtensionContext {
  marks: Record<string, Mark>;
}

export class LinkReferenceExtension extends MarkExtension<
  Link | LinkReference
> {
  public dependencies(): Array<Extension> {
    return [new DefinitionExtension(), new LinkExtension()];
  }

  public unistNodeName(): "linkReference" {
    return "linkReference";
  }

  public proseMirrorMarkName(): null {
    return null;
  }

  public proseMirrorMarkSpec(): null {
    return null;
  }

  public unistNodeToProseMirrorNodes(
    node: LinkReference,
    schema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
    context: ConverterContext<{
      LinkReferenceExtension: LinkReferenceExtensionContext;
    }>
  ): Array<ProseMirrorNode> {
    const mark = schema.marks["link"].create({
      href: null,
      title: null,
    });
    if (context.LinkReferenceExtension === undefined) {
      context.LinkReferenceExtension = { marks: {} };
    }
    context.LinkReferenceExtension.marks[node.identifier] = mark;
    return convertedChildren.map((child) =>
      child.mark(child.marks.concat([mark]))
    );
  }

  public proseMirrorToUnistTest(): boolean {
    return false;
  }

  public processConvertedUnistNode(): Link {
    throw new Error(
      "LinkReferenceExtension should never convert from ProseMirror to Unist."
    );
  }

  public postUnistToProseMirrorHook(
    context: ConverterContext<{
      DefinitionExtension: DefinitionExtensionContext;
      LinkReferenceExtension: LinkReferenceExtensionContext;
    }>
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      >;
      attrs.href = definition.url;
      if (definition.title !== undefined) {
        attrs.title = definition.title;
      }
    }
  }
}
