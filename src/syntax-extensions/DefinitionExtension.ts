import type { Definition } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";

import { NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export interface DefinitionExtensionContext {
  definitions: Record<
    string,
    { title: string | null | undefined; url: string }
  >;
}

/**
 * @public
 */
export class DefinitionExtension extends NodeExtension<Definition> {
  public override proseMirrorNodeName(): null {
    return null;
  }

  public override proseMirrorNodeSpec(): null {
    return null;
  }

  public override proseMirrorNodeToUnistNodes(): Array<Definition> {
    return [];
  }

  public override unistNodeName(): "definition" {
    return "definition";
  }

  public override unistNodeToProseMirrorNodes(
    node: Definition,
    _proseMirrorSchema: Schema<string, string>,
    _convertedChildren: Array<ProseMirrorNode>,
    context: Partial<{
      DefinitionExtension: DefinitionExtensionContext;
    }>,
  ): Array<ProseMirrorNode> {
    context.DefinitionExtension ??= { definitions: {} };
    context.DefinitionExtension.definitions[node.identifier] = {
      title: node.title,
      url: node.url,
    };
    return [];
  }
}
