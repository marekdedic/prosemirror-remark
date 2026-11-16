# Design: adding and editing links

Status: accepted; implemented

## Problem

A `link` mark can only come from loaded Markdown, autolinks or pasted HTML. There's no way to add a link, change its URL or title, or remove it while editing, short of the app building its own UI ([#58](https://github.com/marekdedic/prosemirror-remark/issues/58)). As with the code block language ([#1182](https://github.com/marekdedic/prosemirror-remark/issues/1182)), a construct that can only be loaded, not edited, is half a feature.

## Goals

- Users can add a link, change its URL and title, and remove it, without the app building any UI.
- Apps can do the same from their own UI (a toolbar button, a menu, a command palette).
- Rendering follows `design/custom-ui.md`: a documented DOM contract, defaults in `style.css`, and a UI that apps can turn off and replace.

## Non-goals

- Editing the link's text in the UI. The text is document content and is edited in the editor, with one exception, text the popover inserts at a caret, see [Links whose text is their URL](#links-whose-text-is-their-url).
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

The selection is **in a link** when the caret is inside one link range, or when everything a non-empty selection covers that can be linked (as `addMark` decides) carries the same link mark. That can span several paragraphs, as a link added over a selection across paragraphs does, so the popover keeps editing the link it added. The range is found around the content that can be linked, not around the selection's ends, so a selection starting in a code block or at the end of a paragraph doesn't reach into the link before it. A caret right after a link isn't in it: the mark isn't `inclusive`, and text typed there isn't part of the link, so showing that link's popover there would be misleading. A caret right before a link isn't in it either, for symmetry. One helper, `linkAtSelection(state)`, finds the range and whether a link can be set at all, and the commands, the keymap and the popover all use it.

### Commands

```ts
export function setLink(attrs: { href: string; title?: string | null }): Command;
export function removeLink(): Command;
export function openLinkEditor(): Command;
```

- **`setLink`:** with the selection in a link, sets the attributes on the whole link range. Otherwise, with a non-empty selection, adds a link over it, replacing any links within it. An empty `href` adds no link: outside a link, the command doesn't apply, so a menu item for it is disabled. A link whose URL is cleared keeps its link. With an empty selection outside a link, inserts `href` as text with the link on it. Values are normalised as in [Fields](#fields). When nothing would change, it applies but dispatches nothing, so a toolbar doesn't create empty undo steps. It doesn't apply where no link can be set, such as in a code block. It never changes the link's text, except for the text it inserts at an empty caret.
- **`removeLink`:** removes the link range at the selection, or every link mark within a non-empty selection. Returns `false` if there's none.
- **`openLinkEditor`:** focuses the popover's URL field, see [Popover](#popover). Returns `false` where no link can be set, when the popover is turned off or the editor isn't editable. Called without a view, as menus do to decide whether to enable an item, it checks whether a link can be set and whether the editor state has the popover's plugin.

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

The plugin view inserts the popover right after `view.dom`, in `view.dom`'s parent, as `prosemirror-menu` does with its menu bar. An editor created without a place and put in the page later gets it on its next update. It never goes inside `view.dom`, whose content ProseMirror owns.

The default stylesheet makes the popover `position: absolute` without any offsets, so it stays at its static position, right below the editor, and takes it out of the flow. The view moves it above the line with the link's start, at the link's start, with margins from that position: it measures where the popover would be without them and passes the distances to CSS as `--prosemirror-remark-link-editor-x` (along the line, from the inline-start side) and `--prosemirror-remark-link-editor-y`, which `style.css` uses as `margin-inline-start` and `margin-top`. `design/custom-ui.md` allows custom properties for values that come from JavaScript, and this keeps inline styles out of the DOM.

- **No positioned container needed.** Offsets (`top`, `inset-inline-start`) would be relative to the popover's `offsetParent`, which the app would have to set up with `position: relative`. Margins from the static position work in any page. They also avoid `inset-inline-start`, which the browser target lacks (it needs Chrome and Edge 87).
- **Above the link.** Above, it covers the text the user has just read rather than the text they are about to read or type, and it doesn't cover the next lines of a link that wraps. When there isn't room for it above the link where it can be seen, as for a link at the top of an editor at the top of the page, it goes below the link's line instead. Where it can be seen ends at the viewport's top and at the top of every container around the popover that clips its content (any `overflow-y` other than `visible`), such as a scrolling panel.
- **Within the editor's width.** The popover starts at the link's start edge, unless it would then stick out past the editor's end edge, in which case it moves back towards the start, but never past the editor's start edge. A popover wider than the editor sticks out at the end.
- **Right-to-left text.** In a right-to-left popover, distances along the line are measured from the right and `margin-inline-start` is the right margin. The link's start edge follows the link's own text direction, which can differ from the popover's: under a right-to-left link in a left-to-right page, the popover ends at the link's right edge rather than starting there.
- **Updates.** The view recomputes the position on every update, on window resize, and on scrolling in any container (one capturing listener on the document, since `scroll` doesn't bubble), so it follows the link in an editor with its own scrollbar. While the link is scrolled out of the editor or a container around it, the popover hides, unless it has the focus, which hiding it would drop. It finds the link at the selection again only when the document or the selection changed.
- **Without the stylesheet,** the popover is a plain block after the editor, which is plain but works.

#### When it shows

- **Shown, unfocused,** whenever the editor has focus and the selection is in a link. Focus stays in the editor, so typing, arrow keys and shortcuts work as usual. It follows the caret from link to link and hides when the caret leaves.
- **Focused,** after `Mod-K`, or when the user clicks or tabs into it. `Mod-K` focuses the URL field with its text selected. It also works with a selection that isn't in a link, or an empty caret outside one, to add a link: the popover then shows at the selection with empty fields. It stays visible while focus is anywhere inside it.
- **Hidden** when focus leaves both the editor and the popover, and when the selection is no longer in a link (unless the popover has focus and is adding a link, see below). When no link can be set at the selection while the popover has the focus, as after an undo in the URL field moved the selection into a code block, the popover gives the focus back to the editor and hides: anything typed into it would be thrown away. It does that right after the update that found it, so that other plugin views don't see the focus move in the middle of one. An editor that isn't editable never shows it: it has no caret, and the popover has nothing to offer there except "Open", which the link itself does.

Whether to show is the view's own state, not plugin state, since only focus decides it. A blur of the editor whose `relatedTarget` is inside the popover doesn't hide it, so a click into a field doesn't close it on the way.

#### Fields

**Every edit is committed** with `setLink`, as in the code block fields, so the document is always current, there's a single undo history and `prosemirror-history` groups the keystrokes into one undo step. This applies to adding a link too:

- **Over a non-empty selection:** the first edit to the URL field adds the link over the selection, keeping the selection, so the selection is now in that link and later edits change it. Until the first edit, nothing is in the document, so `Mod-K` followed by `Escape` leaves no trace.
- **At an empty caret:** the first edit inserts the URL as the link's text, see [Links whose text is their URL](#links-whose-text-is-their-url).

The fields reuse what the code block fields do, through the parts of `CodeBlockField` that don't depend on code blocks, which move to a shared `ControlField` in `src/utils/`: committing every edit except during an IME composition (committed on blur when an input method ends it without `compositionend`), not overwriting a field during a composition, filtering typed and pasted text through `beforeinput` (dropped text is left to the browser, which removes line breaks from it in a one-line input, and to the stripping each field does as text arrives; whitespace left around a dropped URL isn't saved, as for a typed one), cancelling the input's own undo and redo and letting `Mod-Z`, `Mod-Shift-Z` and `Mod-Y` through to ProseMirror, ignoring the `Enter` that ends a composition (also in Safari), `readOnly` synced on focus and before every edit, `update()` setting a value only when it differs, and creating elements in `view.dom.ownerDocument` without `instanceof` checks. `ControlField` locates its node or mark through a callback rather than a node position, since a link is a range.

- **URL:** shows `href`, or empty for `null`. `dir="ltr"` regardless of the surrounding text, as URLs are left-to-right. `type="text"` with `inputmode="url"`, not `type="url"`, which would reject relative URLs and fragments like `#install` and has no use here, since the field never submits a form. Surrounding whitespace and line endings are never saved: whitespace around a URL isn't meant and comes with copied URLs, and line endings can't be part of a Markdown link destination. Line endings and leading whitespace are removed from the field as they arrive, and pasted text is trimmed whole. A typed trailing space stays in the field but isn't saved, so that a URL with a space (`[a](<b c>)`) can be typed: the field isn't overwritten while its value differs from the saved one only by what's trimmed away. Whether every other value round-trips through `mdast-util-to-markdown` (spaces, `<`, `>`, parentheses, which it writes in `<…>` form or escapes) is checked with a round-trip table in the tests, as for the code block info string. Clearing the field leaves a link with an empty `href`, which is valid Markdown (`[text]()`). Only "Remove" or `removeLink` removes a link, as clearing the code block language keeps the code block.
- **Title:** shows `title`, or empty for `null`. `dir="auto"`, since a title is natural-language text. An empty value becomes `null`. Editing it keeps the link's `href` as it is, including the `null` of an unresolved reference. A title can contain line endings, which an `<input>` can't show, so they're shown as spaces and kept until the title is edited, exactly like the code block `meta` field. It's always visible, but disabled while the selection isn't in a link, since only the URL field adds one. When that happens while it has the focus, as when undoing the link that was just added, the focus moves to the URL field first, so it isn't lost. That's done right after the update, like returning the focus to the editor below, and the field is disabled once the focus has moved. Titles are rare in practice, but they're the only optional part of a link, and a "more" toggle for one field adds a click and a state for little gain.
- **Open:** a link to `href`, so it opens with the browser's own handling (middle click, context menu, `target="_blank"`). Its `href` is set only for `http:`, `https:` and `mailto:` URLs and relative ones, resolved against the page as a browser would. For any other scheme, `javascript:` in particular, the `href` attribute is left out, which also makes the link inert and unfocusable, and `aria-disabled="true"` is set. Apps that resolve relative URLs differently replace the popover.
- **Remove:** runs `removeLink` and returns focus to the editor, with the caret where the link's selection was. The popover then hides, since the selection is no longer in a link. It applies whenever `removeLink` would, so also to a selection that only partly covers links.

#### Links whose text is their URL

A link whose text is exactly its `href` is how `<https://example.com>` autolinks and GFM's bare URLs are represented, and `mdast-util-to-markdown` writes it back as `<https://example.com>`. Autolinks show some URLs differently: an email autolink `<foo@bar.com>` has the `href` `mailto:foo@bar.com`, and GFM's `www.example.com` has `http://www.example.com`. Text in these forms counts as showing the URL too, but only a valid CommonMark email address counts for `mailto:`, since `mdast-util-to-markdown` writes any `[x](mailto:x)` as `<x>`, which doesn't read back as a link unless `x` is one.

**Editing the URL never changes the text,** in the popover or with `setLink`. Rewriting the text along with the URL would replace content the user selected whenever a half-typed URL happens to equal it: linking the word `README` by typing `README.md` would turn the word into `README.md`. Changing the URL of `<https://a.example>` gives `[https://a.example](https://b.example)`, which is what was asked for.

**Editing the text changes the URL,** in the same form: typing in `<https://a.example>` keeps it an autolink of the new text, and the same for an email address or a `www.` literal. A plugin does this with `appendTransaction`, whether or not the popover is on, so that the text of an autolink never claims one address while going to another. It applies only to the links `mdast-util-to-markdown` writes as autolinks: one whose URL has a scheme (`https:`, `mailto:`, …), and the email and `www.` forms. A link to a relative URL, such as `[README.md](README.md)`, is an ordinary link that happens to show its URL, and renaming its text to `README` mustn't break it. It applies to a link that, before the edit, showed its URL as plain text with the same marks throughout, and whose text changed (not only its marks). It stops when the text leaves the form: text with whitespace, which no URL contains, or with `<`, `>` or control characters, which `mdast-util-to-markdown` doesn't write in an autolink, text that no longer starts with a scheme, or an email address that's no longer valid keeps the old URL, and the link becomes `[text](…)`. It also leaves alone a run joined from several links, as when the text between two identical autolinks is deleted or a copy of one is pasted next to it, which isn't an edit of one link's text (typed text never gets a link at its edges, so linked content there comes from another link), the halves of a link split by unlinked content pasted into it, which would each get half of the URL, and the text the popover writes, which it marks with a transaction meta.

The one case where the popover writes the text is **inserting a link at an empty caret:** the first edit to the URL field inserts the URL as text with the link on it, as the address for a `mailto:` URL with a valid one (so typing `mailto:foo@bar.com` gives `<foo@bar.com>`). Later edits rewrite that text too, while the popover keeps the focus, since otherwise typing a URL would leave its first character as the text. Clearing the field removes the text, and the link with it. The caret stays where the link was and the popover keeps its focus and stays at the caret, so typing a new URL inserts a new link there.

The popover remembers the text it inserted, in its plugin state, mapped through every change, rather than recognising it by its text. The text can merge with an identical link right next to it, as two adjacent links with the same `href` and `title` are one link range (and one link in Markdown), and it keeps rewriting exactly that text: changing the URL splits it off again as its own link (`[x](a)<b>`), and setting a title, clearing the URL or "Remove" affects only it. When the popover loses the focus, it forgets the text, unless the whole page lost it, as when switching to another window, where the popover stays as it is and the browser gives the field its focus back. If the focus comes back somewhere else, as it can when the editor is in an iframe and the user went to the page around it, the popover ends editing when its window is focused again. From then on, the text is ordinary link text.

#### Keys

| Where | Key | Does |
|---|---|---|
| editor | `Mod-K` | focuses the URL field, with its text selected |
| a field | `Enter`, `Shift-Enter`, `Escape` | returns focus to the editor, with the selection it had |
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

drops the popover plugin and the `Mod-K` binding, keeping the commands. A binding to `openLinkEditor`, which can only return `false` then, would do nothing anyway. An app with its own link UI binds its own `Mod-K` and calls `setLink` and `removeLink`.

It's a constructor option rather than an override, because plugins, unlike node views, come in one list from `pmu.plugins()` that apps can't pick from. As with the DOM attribute hooks in `design/custom-ui.md`, passing a configured `LinkExtension` alongside a bundle needs [prosemirror-unified#1065](https://github.com/marekdedic/prosemirror-unified/issues/1065), until which it has to come after the bundle.

### Default stylesheet

`style.css` gives the popover what a small floating box needs: `position: absolute` at its static position with the margins described in [Placement](#placement), a `z-index`, and the controls in a row that wraps. It looks like the code block's tab: the same translucent grey, rounded corners, spacing, size and greyed labels, without a border. As it covers text, unlike the tab, the grey is laid over the system colour `Canvas` (with `CanvasText` for the text), which works on light and dark pages, and a faint shadow lifts it off the text under it. The fields use the code block fields' look: borderless, with an underline on the focused field, and their labels sit on the same baseline as their text. "Open" and "Remove" look like small buttons, in the popover's grey with a faint border, darker when pointed at, both the link and the button styled alike. The disabled title field is greyed like a label, and the inert "Open" link and the disabled "Remove" button are faded.

## Testing

- **Commands:** `setLink` adds, changes and keeps links over selections, inside links, across several links and at an empty caret, normalises values and dispatches nothing for an unchanged value. `removeLink` at a caret, over a selection, and with no link. `linkAtSelection` at link edges, across adjacent links with different URLs, and next to other marks.
- **URL following the text:** typing and deleting in the text of autolinks, email autolinks and `www.` literals, an email address becoming invalid, and a link whose text isn't its URL.
- **Round trip:** a table of awkward URLs and titles (spaces, `<`, `>`, parentheses, backslashes, `&`, line endings in titles, non-ASCII) survives `setLink` and a Markdown round trip.
- **Popover** (`renderNodeView` also exposes the `EditorView`, to focus the editor and reach the popover next to it): shows and hides with the caret and focus, adds a link over a selection and at a caret with live commits, `Escape` before any edit leaves the document unchanged, URLs typed over a selection or an autolink leaving the text alone, text inserted at a caret following the URL, also after merging with an identical link, clearing it and typing again, "Open" for allowed and disallowed schemes, "Remove", the keys in the table, undo from a field, and `editor: false`. IME composition is covered through the code block fields, which share `ControlField`.
- **Placement** can't be tested in jsdom, which has no layout. It was checked in Chromium, in left-to-right and right-to-left text.
- **Bundles:** `Mod-K` in the full `MarkdownExtension` and `GFMExtension`, on an autolink and on a bare GFM URL.

## Decisions

1. **A popover from a plugin view,** not a mark view, see [Why a popover, not a mark view](#why-a-popover-not-a-mark-view).
2. **On by default,** as the code block fields are, with `editor: false` to turn it off.
3. **Every edit is committed live,** when adding a link as well as when editing one, so there's one history and the document is always current. A link starts existing at the first edit, not at `Mod-K`.
4. **The popover shows whenever the caret is in a link,** without taking focus, as in Google Docs, so the URL can be seen without a click.
5. **The title field is always visible.** It's the only optional field, so a "more" toggle would hide just it.
6. **Clearing the URL keeps the link,** except for a link the popover has just inserted at a caret, which goes with its text.
7. **The URL follows the text of an autolink, not the other way round.** Editing the URL never rewrites text, apart from text the popover inserted itself, and editing an autolink's text updates its URL.
8. **"Open" is offered only for safe schemes.**
