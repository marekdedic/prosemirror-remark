import type { Definition } from "mdast";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import { NodeExtension } from "prosemirror-unified";

/**
 * @public
 */
export interface DefinitionExtensionContext {
  definitions: Record<
    string,
    { url: string; title: string | null | undefined }
  >;
}

/**
 * @public
 */
export class DefinitionExtension extends NodeExtension<Definition> {
  public unistNodeName(): "definition" {
    return "definition";
  }

  public proseMirrorNodeName(): null {
    return null;
  }

  public proseMirrorNodeSpec(): null {
    return null;
  }

  public unistNodeToProseMirrorNodes(
    node: Definition,
    _convertedChildren: Array<ProseMirrorNode>,
    context: Partial<{
      DefinitionExtension: DefinitionExtensionContext;
    }>
  ): Array<ProseMirrorNode> {
    if (context.DefinitionExtension === undefined) {
      context.DefinitionExtension = { definitions: {} };
    }
    context.DefinitionExtension.definitions[node.identifier] = {
      title: node.title,
      url: node.url,
    };
    return [];
  }

  public proseMirrorNodeToUnistNodes(): Array<Definition> {
    return [];
  }
}
