import type { Node as UnistNode } from "unist";

import { EditorState } from "prosemirror-state";
import {
  type Extension,
  type NodeExtension,
  ProseMirrorUnified,
} from "prosemirror-unified";
import { DecorationSet, EditorView, type NodeView } from "prosemirror-view";

import { ParagraphExtension } from "../../src/syntax-extensions/ParagraphExtension";
import { RootExtension } from "../../src/syntax-extensions/RootExtension";
import { TextExtension } from "../../src/syntax-extensions/TextExtension";
import { ParserProviderExtension } from "./ParserProviderExtension";

export interface NodeViewTesterConfig {
  /**
   * Makes getPos() return undefined, as it does once the node has been removed
   * from the document.
   */
  detached?: boolean;
  markdown: string;
  otherExtensionsInTest?: Array<Extension>;
  /** The document position of the node the view is built for. */
  position?: number;
}

/**
 * Builds a node view the same way prosemirror-view does - by calling the
 * constructor returned from proseMirrorNodeView() with a real EditorView - and
 * exposes the rendered DOM alongside the markdown the editor currently holds.
 */
export class NodeViewTester<UNode extends UnistNode> {
  public get contentDOM(): HTMLElement {
    const { contentDOM } = this.view;
    if (contentDOM === null || contentDOM === undefined) {
      throw new Error("The node view has no content DOM");
    }
    return contentDOM;
  }

  public get dom(): HTMLElement {
    return this.view.dom;
  }

  /** The markdown the editor currently holds, without the trailing newline. */
  public get markdown(): string {
    return this.pmu.serialize(this.editorView.state.doc).trimEnd();
  }

  public get nodeView(): NodeView {
    return this.view;
  }

  private readonly editorView: EditorView;

  private readonly pmu: ProseMirrorUnified;

  private readonly view: NodeView;

  public constructor(
    extension: NodeExtension<UNode>,
    config: NodeViewTesterConfig,
  ) {
    this.pmu = new ProseMirrorUnified([
      new ParserProviderExtension(),
      new RootExtension(),
      new ParagraphExtension(),
      new TextExtension(),
      ...(config.otherExtensionsInTest ?? []),
      extension,
    ]);

    const doc = this.pmu.parse(config.markdown);
    const element = document.createElement("div");
    document.body.append(element);
    this.editorView = new EditorView(element, {
      state: EditorState.create({ doc }),
    });

    const position = config.position ?? 1;
    const node = doc.nodeAt(position);
    if (node === null) {
      throw new Error(`There is no node at position ${position.toString()}`);
    }

    const nodeViewConstructor = extension.proseMirrorNodeView();
    if (nodeViewConstructor === null) {
      throw new Error("The extension provides no node view");
    }

    this.view = nodeViewConstructor(
      node,
      this.editorView,
      config.detached === true
        ? (): undefined => undefined
        : (): number => position,
      [],
      DecorationSet.empty,
    );
  }

  /**
   * Clicks the element matching the selector, returning whether the node view
   * handled the click by calling preventDefault().
   */
  public click(selector: string): boolean {
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    this.element(selector).dispatchEvent(event);
    return event.defaultPrevented;
  }

  /** The element matching the selector within the node view's DOM. */
  public element(selector: string): HTMLElement {
    const element = this.dom.querySelector(selector);
    if (element === null) {
      throw new Error(`The node view rendered no "${selector}" element`);
    }
    return element as HTMLElement;
  }
}
