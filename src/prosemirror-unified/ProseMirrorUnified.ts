import type { Root } from "mdast";
import type { Node as ProseMirrorNode, Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import type { Extension } from "./Extension";
import { ExtensionManager } from "./ExtensionManager";
import { InputRulesBuilder } from "./InputRulesBuilder";
import { KeymapBuilder } from "./KeymapBuilder";
import { ProseMirrorToUnistConverter } from "./ProseMirrorToUnistConverter";
import { SchemaBuilder } from "./SchemaBuilder";
import { UnifiedBuilder } from "./UnifiedBuilder";
import { UnistToProseMirrorConverter } from "./UnistToProseMirrorConverter";

export class ProseMirrorUnified {
  private readonly builtSchema: Schema<string, string>;
  private readonly inputRulesBuilder: InputRulesBuilder;
  private readonly keymapBuilder: KeymapBuilder;
  private readonly unistToProseMirrorConverter: UnistToProseMirrorConverter;
  private readonly proseMirrorToUnistConverter: ProseMirrorToUnistConverter;
  private readonly unified: Processor<UnistNode, UnistNode, UnistNode, string>;

  public constructor(extensions: Array<Extension> = []) {
    const extensionManager = new ExtensionManager(extensions);
    this.builtSchema = new SchemaBuilder(extensionManager).build();
    extensionManager.setSchema(this.schema());
    this.inputRulesBuilder = new InputRulesBuilder(extensionManager);
    this.keymapBuilder = new KeymapBuilder(extensionManager);
    this.unistToProseMirrorConverter = new UnistToProseMirrorConverter(
      extensionManager
    );
    this.proseMirrorToUnistConverter = new ProseMirrorToUnistConverter(
      extensionManager
    );
    this.unified = new UnifiedBuilder(extensionManager).build();
  }

  public parse(source: string): ProseMirrorNode | null {
    const unist = this.unified.runSync(this.unified.parse(source));
    // TODO: Fix remark-unwrap-images to not put text nodes in root
    (unist as Root).children = (unist as Root).children.filter(
      (child) => child.type !== "text"
    );
    const ret = this.unistToProseMirrorConverter.convert(unist);
    console.log(ret);
    return ret;
  }

  public schema(): Schema<string, string> {
    return this.builtSchema;
  }

  public plugins(): Array<Plugin> {
    return [this.inputRulesBuilder.build(), this.keymapBuilder.build()];
  }

  public serialize(doc: ProseMirrorNode): string {
    const unist = this.proseMirrorToUnistConverter.convert(doc);
    if (unist === null) {
      return "";
    }
    const source: string = this.unified.stringify(unist);
    console.log(unist);
    return source;
  }
}
