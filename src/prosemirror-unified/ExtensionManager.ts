import type { Schema } from "prosemirror-model";
import type { Node as UnistNode } from "unist";

import type { Extension } from "./Extension";
import { MarkExtension } from "./MarkExtension";
import { NodeExtension } from "./NodeExtension";
import { SyntaxExtension } from "./SyntaxExtension";

function isSyntaxExtension(
  extension: Extension
): extension is SyntaxExtension<UnistNode> {
  return extension instanceof SyntaxExtension;
}

function isNodeExtension(
  extension: Extension
): extension is NodeExtension<UnistNode> {
  return extension instanceof NodeExtension;
}

function isMarkExtension(
  extension: Extension
): extension is MarkExtension<UnistNode> {
  return extension instanceof MarkExtension;
}

export class ExtensionManager {
  private readonly markExtensionList: Map<string, MarkExtension<UnistNode>>;
  private readonly nodeExtensionList: Map<string, NodeExtension<UnistNode>>;
  // TODO: This could probably be removed
  private readonly otherSyntaxExtensionList: Map<
    string,
    SyntaxExtension<UnistNode>
  >;
  private readonly otherExtensionList: Map<string, Extension>;

  public constructor(extensions: Array<Extension>) {
    this.markExtensionList = new Map();
    this.nodeExtensionList = new Map();
    this.otherSyntaxExtensionList = new Map();
    this.otherExtensionList = new Map();

    for (const extension of extensions) {
      this.add(extension);
    }
  }

  public setSchema(schema: Schema<string, string>): void {
    for (const extension of this.syntaxExtensions()) {
      extension.setProseMirrorSchema(schema);
    }
  }

  public extensions(): Array<Extension> {
    return (this.syntaxExtensions() as Array<Extension>).concat(
      Array.from(this.otherExtensionList.values())
    );
  }

  public markExtensions(): Array<MarkExtension<UnistNode>> {
    return Array.from(this.markExtensionList.values());
  }

  public nodeExtensions(): Array<NodeExtension<UnistNode>> {
    return Array.from(this.nodeExtensionList.values());
  }

  public syntaxExtensions(): Array<SyntaxExtension<UnistNode>> {
    return (this.nodeExtensions() as Array<SyntaxExtension<UnistNode>>).concat(
      this.markExtensions(),
      Array.from(this.otherSyntaxExtensionList.values())
    );
  }

  private add(extension: Extension): void {
    for (const dependency of extension.dependencies()) {
      this.add(dependency);
    }

    if (isMarkExtension(extension)) {
      this.markExtensionList.set(extension.constructor.name, extension);
      return;
    }
    if (isNodeExtension(extension)) {
      this.nodeExtensionList.set(extension.constructor.name, extension);
      return;
    }
    if (isSyntaxExtension(extension)) {
      this.otherSyntaxExtensionList.set(extension.constructor.name, extension);
      return;
    }
    this.otherExtensionList.set(extension.constructor.name, extension);
  }
}
