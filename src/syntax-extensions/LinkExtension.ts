import type { Link, PhrasingContent } from "mdast";
import type { InputRule } from "prosemirror-inputrules";
import type {
  DOMOutputSpec,
  Mark,
  MarkSpec,
  Node as ProseMirrorNode,
  Schema,
} from "prosemirror-model";
import type { Command, Plugin } from "prosemirror-state";

import { MarkExtension } from "prosemirror-unified";

import { addMarkToNodes } from "../utils/addMarkToNodes";
import { linkHrefSyncPlugin } from "../utils/linkHrefSync";
import { linkInputRule } from "../utils/linkInputRule";
import { linkPastePlugin } from "../utils/linkPaste";
import { linkAtSelection, linkAttrs } from "../utils/linkRange";
import {
  normaliseHref,
  normaliseTitle,
  removeLinkTransaction,
  setLinkTransaction,
} from "../utils/linkTransaction";
import {
  hasLinkEditor,
  linkEditorPlugin,
  LinkEditorView,
} from "./LinkEditorView";

export interface LinkExtensionOptions {
  /**
   * Whether to show the popover for editing the link at the selection.
   * Defaults to `true`.
   */
  editor?: boolean;
  /**
   * Whether pasting a URL over a selection links the selection instead of
   * replacing it. Defaults to `true`.
   */
  linkOnPaste?: boolean;
}

export class LinkExtension extends MarkExtension<Link> {
  private readonly editor: boolean;
  private readonly linkOnPaste: boolean;

  public constructor(options: LinkExtensionOptions = {}) {
    super();
    this.editor = options.editor ?? true;
    this.linkOnPaste = options.linkOnPaste ?? true;
  }

  public override processConvertedUnistNodes(
    convertedNodes: Array<PhrasingContent>,
    originalMark: Mark,
  ): Link {
    return {
      type: this.unistNodeName(),
      url: originalMark.attrs["href"] as string,
      ...(originalMark.attrs["title"] !== null && {
        title: originalMark.attrs["title"] as string,
      }),
      children: convertedNodes,
    };
  }

  public override proseMirrorInputRules(
    proseMirrorSchema: Schema<string, string>,
  ): Array<InputRule> {
    return [linkInputRule(proseMirrorSchema.marks[this.proseMirrorMarkName()])];
  }

  public override proseMirrorKeymap(): Record<string, Command> {
    return this.editor ? { "Mod-k": openLinkEditor() } : {};
  }

  public override proseMirrorMarkName(): string {
    return "link";
  }

  public override proseMirrorMarkSpec(): MarkSpec {
    return {
      attrs: { href: {}, title: { default: null } },
      inclusive: false,
      parseDOM: [
        {
          getAttrs: (
            dom: Node | string,
          ): {
            href: string | null;
            title: string | null;
          } => ({
            href: (dom as HTMLElement).getAttribute("href"),
            title: (dom as HTMLElement).getAttribute("title"),
          }),
          tag: "a[href]",
        },
      ],
      toDOM: (node: Mark): DOMOutputSpec => ["a", node.attrs, 0],
    };
  }

  public override proseMirrorPlugins(): Array<Plugin> {
    return [
      linkHrefSyncPlugin(),
      ...(this.editor ? [linkEditorPlugin()] : []),
      ...(this.linkOnPaste ? [linkPastePlugin()] : []),
    ];
  }

  public override unistNodeName(): "link" {
    return "link";
  }

  public override unistNodeToProseMirrorNodes(
    node: Link,
    proseMirrorSchema: Schema<string, string>,
    convertedChildren: Array<ProseMirrorNode>,
  ): Array<ProseMirrorNode> {
    return addMarkToNodes(
      convertedChildren,
      proseMirrorSchema.marks[this.proseMirrorMarkName()].create({
        href: node.url,
        title: node.title,
      }),
    );
  }
}

/**
 * Focuses the link popover's URL field, to edit the link at the selection or
 * add one. Doesn't apply where no link can be set, when the popover is turned
 * off or the editor isn't editable. Without a view, only whether a link can be
 * set is checked, as menus do.
 */
export function openLinkEditor(): Command {
  return (state, dispatch, view): boolean => {
    if (!linkAtSelection(state).applies) {
      return false;
    }
    if (view === undefined) {
      return dispatch === undefined && hasLinkEditor(state);
    }
    const editor = LinkEditorView.forView(view);
    if (!view.editable || editor === undefined) {
      return false;
    }
    return dispatch === undefined || editor.focus();
  };
}

/**
 * Removes the link at the selection, or every link in a non-empty selection.
 */
export function removeLink(): Command {
  return (state, dispatch): boolean => {
    const tr = removeLinkTransaction(state);
    if (tr === null) {
      return false;
    }
    dispatch?.(tr);
    return true;
  };
}

/**
 * Sets the URL and title of the link at the selection. Outside a link, adds a
 * link over a non-empty selection, or inserts the URL as a link at an empty
 * one. It never changes the text of an existing link. An empty URL doesn't
 * apply outside a link. A `title` left out keeps the link's current title.
 */
export function setLink(attrs: {
  href: string;
  title?: string | null;
}): Command {
  return (state, dispatch): boolean => {
    const link = linkAtSelection(state);
    const href = normaliseHref(attrs.href);
    const title =
      attrs.title === undefined
        ? linkAttrs(link.range).title
        : normaliseTitle(attrs.title);
    const set = setLinkTransaction(state, { href, title }, false, link);
    if (set === null) {
      return false;
    }
    if (set.tr.docChanged) {
      dispatch?.(set.tr);
    }
    return true;
  };
}
