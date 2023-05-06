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
  private readonly markExtensionList: Record<string, MarkExtension<UnistNode>>;
  private readonly nodeExtensionList: Record<string, NodeExtension<UnistNode>>;
  private readonly otherSyntaxExtensionList: Record<
    string,
    SyntaxExtension<UnistNode>
  >;
  private readonly otherExtensionList: Record<string, Extension>;

  public constructor(extensions: Array<Extension>) {
    this.markExtensionList = {};
    this.nodeExtensionList = {};
    this.otherSyntaxExtensionList = {};
    this.otherExtensionList = {};

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
    return Object.values(this.otherExtensionList).concat(
      this.syntaxExtensions()
    );
  }

  public markExtensions(): Array<MarkExtension<UnistNode>> {
    return Object.values(this.markExtensionList);
  }

  public nodeExtensions(): Array<NodeExtension<UnistNode>> {
    return Object.values(this.nodeExtensionList);
  }

  public syntaxExtensions(): Array<SyntaxExtension<UnistNode>> {
    return Object.values(this.otherSyntaxExtensionList).concat(
      this.markExtensions(),
      this.nodeExtensions()
    );
  }

  private add(extension: Extension): void {
    for (const dependency of extension.dependencies()) {
      this.add(dependency);
    }

    if (isMarkExtension(extension)) {
      this.markExtensionList[extension.constructor.name] = extension;
      return;
    }
    if (isNodeExtension(extension)) {
      this.nodeExtensionList[extension.constructor.name] = extension;
      return;
    }
    if (isSyntaxExtension(extension)) {
      this.otherSyntaxExtensionList[extension.constructor.name] = extension;
      return;
    }
    this.otherExtensionList[extension.constructor.name] = extension;
  }
}
