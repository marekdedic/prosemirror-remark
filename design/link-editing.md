# Design: adding and editing links

Status: proposed

## Problem

A `link` mark can only come from loaded Markdown, autolinks or pasted HTML. There's no way to add a link, change its URL or title, or remove it while editing, short of the app building its own UI ([#58](https://github.com/marekdedic/prosemirror-remark/issues/58)). As with the code block language ([#1182](https://github.com/marekdedic/prosemirror-remark/issues/1182)), a construct that can only be loaded, not edited, is half a feature.

## Goals

- Users can add a link, change its URL and title, and remove it, without the app building any UI.
- Apps can do the same from their own UI (a toolbar button, a menu, a command palette).
- Rendering follows `design/custom-ui.md`: a documented DOM contract, defaults in `style.css`, and a UI that apps can turn off and replace.

## Non-goals

- Editing the link's text in the UI. The text is document content and is edited in the editor, with one exception, see [Links whose text is their URL](#links-whose-text-is-their-url).
- URL validation, autocomplete or link previews. Markdown accepts any destination, relative ones included.
- Reference-style links and definitions as such. References are already resolved into ordinary `link` marks when parsed and written back as inline links, so editing them works as for any link.
- An input rule for typing `[text](url)` ([#1252](https://github.com/marekdedic/prosemirror-remark/issues/1252)), and turning a pasted URL into a link over the selection ([#1253](https://github.com/marekdedic/prosemirror-remark/issues/1253)). Both are separate features.
- Images. Their `src`, `alt` and `title` could later reuse the same popover ([#1254](https://github.com/marekdedic/prosemirror-remark/issues/1254)).

## Why a popover, not a mark view

The code block's controls live in its node view. A link is a mark, and that doesn't carry over:

- `prosemirror-unified` collects node views (`pmu.nodeViews()`), not mark views.
- A mark view wraps inline text. A control inside it (a `contenteditable="false"` island in the middle of a line) breaks caret movement and selection across the link, and ProseMirror recreates mark views on most edits to the text around them, which would lose a focused field's focus and caret.

So the UI is a **popover**, drawn by a plugin view next to the editor, not inside its content. That also means it's never in `toDOM` output or on the clipboard, and needs no `parseDOM` `ignore` rule.

## Design

### Schema and conversion

Unchanged. `link` keeps its attributes `href` and `title`. An unresolved reference keeps `href: null`.

### The link at the selection

A **link range** is a maximal run of inline content carrying the same `link` mark (the same `href` and `title`), as ProseMirror's mark equality defines it. Two adjacent links with different URLs are two ranges.

The selection is **in a link** when both its ends are within, or at the edges of, one link range, with the caret inside the range or the selection covering part of it. A caret right after a link isn't in it: the mark isn't `inclusive`, and text typed there isn't part of the link, so showing that link's popover there would be misleading. A caret right before a link isn't in it either, for symmetry. One helper, `linkRangeAt(state)`, finds the range, and the commands, the keymap and the popover all use it.

### Commands

```ts
export function setLink(attrs: { href: string; title?: string | null }): Command;
export function removeLink(): Command;
export function openLinkEditor(): Command;
```

- **`setLink`:** with the selection in a link, sets the attributes on the whole link range. Otherwise, with a non-empty selection, adds a link over it, replacing any links within it. With an empty selection outside a link, inserts `href` as text with the link on it. Values are normalised as in [Fields](#fields). When nothing would change, it applies but dispatches nothing, so a toolbar doesn't create empty undo steps.
- **`removeLink`:** removes the link range at the selection, or every link mark within a non-empty selection. Returns `false` if there's none.
- **`openLinkEditor`:** focuses the popover's URL field, see [Popover](#popover). Returns `false` when the popover is turned off or the editor isn't editable.

The names follow `prosemirror-commands` (`toggleMark`, `setBlockType`). The commands work without the extension instance.

### Keymap

`Mod-K` runs `openLinkEditor`. It's the shortcut for links in Google Docs, Word, Notion, Slack and GitHub, so users expect it.

### Popover

`LinkExtension` ships a plugin whose view draws the popover. It's on by default, see [Turning it off](#turning-it-off).

```html
<div class="prosemirror-remark-link-editor" role="group" aria-label="Link">
  <label class="prosemirror-remark-link-editor-href">
    <span class="prosemirror-remark-link-editor-href-label">URL:</span>
    <input type="text" inputmode="url" placeholder="none" spellcheck="false" autocomplete="off" dir="ltr">
  </label>
  <label class="prosemirror-remark-link-editor-title">
    <span class="prosemirror-remark-link-editor-title-label">Title:</span>
    <input type="text" placeholder="none" autocomplete="off" dir="auto">
  </label>
  <a class="prosemirror-remark-link-editor-open" href="…" target="_blank" rel="noopener noreferrer">Open</a>
  <button type="button" class="prosemirror-remark-link-editor-remove">Remove</button>
</div>
```

The popover is a control in the sense of `design/custom-ui.md`: it carries no document content, isn't part of any rendered Markdown, and changes the document only through transactions. Unlike a node view's control, it lives outside the editable content, so it doesn't need `contenteditable="false"`, `stopEvent` or `ignoreMutation`.

#### Placement

The plugin view inserts the popover right after `view.dom`, in `view.dom`'s parent, as `prosemirror-menu` does with its menu bar. It never goes inside `view.dom`, whose content ProseMirror owns.

The view computes the anchor from `view.coordsAtPos()` at the link's start, below its first line, relative to the popover's `offsetParent`, and passes it to CSS as `--prosemirror-remark-link-editor-x` and `--prosemirror-remark-link-editor-y`. `design/custom-ui.md` allows custom properties for values that come from JavaScript, and this keeps inline styles out of the DOM. `style.css` positions the popover with them. Without the stylesheet, the popover is a plain block after the editor, which is plain but works. The app must give the editor's container `position: relative` (or any other positioning) for the popover to be placed next to the link. The docs say so, and the editor example in [#1250](https://github.com/marekdedic/prosemirror-remark/issues/1250) shows it. The view recomputes the anchor on every update and on window resize.

In right-to-left text, the anchor is the link's start edge on the right. The custom properties carry a position from the inline-start side, and `style.css` uses `inset-inline-start`.

#### When it shows

- **Shown, unfocused,** whenever the editor has focus and the selection is in a link. Focus stays in the editor, so typing, arrow keys and shortcuts work as usual. It follows the caret from link to link and hides when the caret leaves.
- **Focused,** after `Mod-K`, or when the user clicks or tabs into it. `Mod-K` focuses the URL field with its text selected. It also works with a selection that isn't in a link, or an empty caret outside one, to add a link: the popover then shows at the selection with empty fields. It stays visible while focus is anywhere inside it.
- **Hidden** when focus leaves both the editor and the popover, and when the selection is no longer in a link (unless the popover has focus and is adding a link, see below). An editor that isn't editable never shows it: it has no caret, and the popover has nothing to offer there except "Open", which the link itself does.

Whether to show is the view's own state, not plugin state, since only focus decides it. A blur of the editor whose `relatedTarget` is inside the popover doesn't hide it, so a click into a field doesn't close it on the way.

#### Fields

**Every edit is committed** with `setLink`, as in the code block fields, so the document is always current, there's a single undo history and `prosemirror-history` groups the keystrokes into one undo step. This applies to adding a link too:

- **Over a non-empty selection:** the first edit to the URL field adds the link over the selection, keeping the selection, so the selection is now in that link and later edits change it. Until the first edit, nothing is in the document, so `Mod-K` followed by `Escape` leaves no trace.
- **At an empty caret:** the first edit inserts the URL as the link's text, see [Links whose text is their URL](#links-whose-text-is-their-url).

The fields reuse what the code block fields do, through the parts of `CodeBlockField` that don't depend on code blocks, which move to a shared `ControlField` in `src/utils/`: committing every edit except during an IME composition (committed on blur when an input method ends it without `compositionend`), not overwriting a field during a composition, filtering typed, pasted and dropped text through `beforeinput`, cancelling the input's own undo and redo and letting `Mod-Z`, `Mod-Shift-Z` and `Mod-Y` through to ProseMirror, ignoring the `Enter` that ends a composition (also in Safari), `readOnly` synced on focus and before every edit, `update()` setting a value only when it differs, and creating elements in `view.dom.ownerDocument` without `instanceof` checks. `ControlField` locates its node or mark through a callback rather than a node position, since a link is a range.

- **URL:** shows `href`, or empty for `null`. `dir="ltr"` regardless of the surrounding text, as URLs are left-to-right. `type="text"` with `inputmode="url"`, not `type="url"`, which would reject relative URLs and fragments like `#install` and has no use here, since the field never submits a form. Leading and trailing whitespace and line endings are removed as they arrive: they can't be meant, they come with copied URLs, and line endings can't be part of a Markdown link destination. Whether every other value round-trips through `mdast-util-to-markdown` (spaces, `<`, `>`, parentheses, which it writes in `<…>` form or escapes) is checked with a round-trip table in the tests, as for the code block info string. Clearing the field leaves a link with an empty `href`, which is valid Markdown (`[text]()`). Only "Remove" or `removeLink` removes a link, as clearing the code block language keeps the code block.
- **Title:** shows `title`, or empty for `null`. `dir="auto"`, since a title is natural-language text. An empty value becomes `null`. A title can contain line endings, which an `<input>` can't show, so they're shown as spaces and kept until the title is edited, exactly like the code block `meta` field. It's always visible. Titles are rare in practice, but they're the only optional part of a link, and a "more" toggle for one field adds a click and a state for little gain.
- **Open:** a link to `href`, so it opens with the browser's own handling (middle click, context menu, `target="_blank"`). Its `href` is set only for `http:`, `https:` and `mailto:` URLs and relative ones, resolved against the page as a browser would. For any other scheme, `javascript:` in particular, the `href` attribute is left out, which also makes the link inert and unfocusable, and `aria-disabled="true"` is set. Apps that resolve relative URLs differently replace the popover.
- **Remove:** runs `removeLink` and returns focus to the editor, with the caret where the link's selection was. The popover then hides, since the selection is no longer in a link.

#### Links whose text is their URL

A link whose text is exactly its `href` is how `<https://example.com>` autolinks and GFM's bare URLs are represented, and `mdast-util-to-markdown` writes it back as `<https://example.com>`. For such a link, **editing the URL changes the text along with it**, in the same transaction. Changing only the URL would turn `<https://a.example>` into `[https://a.example](https://b.example)`, a link whose visible text claims one address and goes to another.

The same rule covers inserting a link at an empty caret: the first edit to the URL field inserts the URL as text with the link on it, and later edits change both, since the text is still the URL. Clearing the field removes the text, and the link with it. The caret stays where the link was and the popover keeps its focus and stays at the caret, so typing a new URL inserts a new link there.

The rule applies only to a link whose text, before the edit, is exactly its `href` as plain text, all in one link range and with no other inline content (such as an image). Once the user edits the text in the editor, it no longer follows the URL. The title doesn't affect it.

#### Keys

| Where | Key | Does |
|---|---|---|
| editor | `Mod-K` | focuses the URL field, with its text selected |
| a field | `Enter`, `Escape` | returns focus to the editor, with the selection it had |
| a field | `Mod-K` | same as `Enter` |
| URL field | `ArrowDown` | focuses the title field |
| title field | `ArrowUp` | focuses the URL field |
| any control | `Tab`, `Shift-Tab` | moves between the controls, in DOM order, as the browser does |

- **No arrow keys from the editor into the popover.** Unlike the code block's fields, the popover isn't in the text flow, so no arrow key naturally leads to it. Taking `ArrowDown` or `ArrowLeft` at a link's edge would break moving through text. `Mod-K` is the way in from the keyboard, and the popover's accessible name (and the docs) make it findable.
- **`Tab` out of the last control** goes wherever the browser takes it next, since the popover sits right after the editor in the DOM. It's not trapped: the popover isn't modal.
- **Keys with modifiers** other than the ones above are left to the field, except undo and redo, as in the code block fields.
- **Returning focus** restores the selection the editor had. When the popover has just added a link over a selection, that selection is now in the link.

#### Accessibility

The popover is a `group` named "Link", not a `dialog`: it doesn't take focus when it appears, isn't modal and doesn't trap focus. Each field is named by its visible label. When the popover appears unfocused, screen reader users aren't told: a live region announcing every link the caret passes would be noise. `Mod-K` on a link focuses the URL field, which is announced with its label and value. Whether to announce the shortcut in the link itself (`aria-keyshortcuts` on the `a` in `toDOM`) is left open, since it would be part of the DOM contract and the clipboard. The visible texts are hard-coded English, see [#1180](https://github.com/marekdedic/prosemirror-remark/issues/1180).

### Turning it off

```ts
new LinkExtension({ editor: false });
```

drops the popover plugin, keeping the commands and the `Mod-K` keymap. `openLinkEditor` then returns `false`, so `Mod-K` falls through to whatever else is bound to it. An app with its own link UI binds its own `Mod-K` before `pmu.keymap()` and calls `setLink` and `removeLink`.

It's a constructor option rather than an override, because plugins, unlike node views, come in one list from `pmu.plugins()` that apps can't pick from. As with the DOM attribute hooks in `design/custom-ui.md`, passing a configured `LinkExtension` alongside a bundle needs [prosemirror-unified#1065](https://github.com/marekdedic/prosemirror-unified/issues/1065), until which it has to come after the bundle.

### Default stylesheet

`style.css` gives the popover what a small floating box needs: `position: absolute` at the anchor (`inset-inline-start: var(--prosemirror-remark-link-editor-x)`, `top: var(--prosemirror-remark-link-editor-y)`), a `z-index`, a background and border that work on light and dark pages (as the code block tab's translucent grey does, but opaque, since it covers text), padding, the controls in a row that wraps, and a `max-width` of the container's width. The fields use the code block fields' look: borderless, with the label greyed and an underline on the focused field.

## Testing

- **Commands:** `setLink` adds, changes and keeps links over selections, inside links, across several links and at an empty caret, normalises values and dispatches nothing for an unchanged value. `removeLink` at a caret, over a selection, and with no link. `linkRangeAt` at link edges, across adjacent links with different URLs, and next to other marks.
- **Round trip:** a table of awkward URLs and titles (spaces, `<`, `>`, parentheses, backslashes, `&`, line endings in titles, non-ASCII) survives `setLink` and a Markdown round trip.
- **Popover** (a `renderPluginView` helper next to `renderNodeView`): shows and hides with the caret and focus, adds a link over a selection and at a caret with live commits, `Escape` before any edit leaves the document unchanged, the URL-following text of autolinks, clearing such a URL and typing again, "Open" for allowed and disallowed schemes, "Remove", the keys in the table, IME composition, undo and redo from a field, and `editor: false`.
- **Bundles:** `Mod-K` in the full `MarkdownExtension` and `GFMExtension`, on an autolink and on a bare GFM URL.

## Decisions

1. **A popover from a plugin view,** not a mark view, see [Why a popover, not a mark view](#why-a-popover-not-a-mark-view).
2. **On by default,** as the code block fields are, with `editor: false` to turn it off.
3. **Every edit is committed live,** when adding a link as well as when editing one, so there's one history and the document is always current. A link starts existing at the first edit, not at `Mod-K`.
4. **The popover shows whenever the caret is in a link,** without taking focus, as in Google Docs, so the URL can be seen without a click.
5. **The title field is always visible.** It's the only optional field, so a "more" toggle would hide just it.
6. **Clearing the URL keeps the link,** except for a link whose text is its URL, which goes with its text.
7. **"Open" is offered only for safe schemes.**
