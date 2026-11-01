# Design: list looseness

Status: proposed; implementation waits for [prosemirror-unified#1087](https://github.com/marekdedic/prosemirror-unified/issues/1087)

## Problem

In Markdown, a list is either tight or loose. Rendered, a loose list wraps each item's text in a paragraph with its margins, and a tight one doesn't. Since [#1120](https://github.com/marekdedic/prosemirror-remark/issues/1120), lists and list items keep mdast's `spread` in a ProseMirror attribute, but the editor gives no way to see or change it ([#1143](https://github.com/marekdedic/prosemirror-remark/issues/1143)):

- Nothing styles `data-spread`, so loose and tight lists look the same.
- No command changes it, and new lists and items get it implicitly.
- The user only finds out when the document is serialized, where it decides whether items are separated by blank lines.

Storing mdast's flags as they are also doesn't give one value that could be displayed. mdast has two flags with different jobs:

- **`list.spread`:** whether there's a blank line between items.
- **`listItem.spread`:** whether there's a blank line between the item's own children.

CommonMark only knows one property: a list is loose if any of its items are separated by blank lines, or if any item directly contains two blocks with a blank line between them. That's `list.spread || list.children.some((item) => item.spread)`, which is also what `mdast-util-to-hast` renders. Either flag alone gets one of these wrong:

| Markdown | `list.spread` | items' `spread` | CommonMark |
|---|---|---|---|
| `- a\n\n  b\n- c` | `false` | `true`, `false` | loose |
| `- a\n- b\n\n- c` | `true` | `false`, `false`, `false` | loose |

CSS can't combine them without `:has()`, which is Baseline 2023, newer than the `browserslist` target.

Some content also can't be tight. In the tight list `- a\n- b`, `Backspace` at the start of `b` (`joinBackward`) joins the items into `regular_list_item(paragraph("a"), paragraph("b"))`, which serializes as `- a\n\n  b`, a loose list. Pasting two paragraphs into an item does the same. The editor shows the list as tight, but the Markdown says loose.

## Goals

- Tight and loose lists look different in the editor, as they do in rendered Markdown.
- What the editor shows matches what the Markdown says, including after edits that make a list loose by their content.
- Apps can show and change whether a list is loose from their own UI (a menu, a toolbar, a command palette).
- Looseness survives a parse/serialize round trip, and copy and paste inside the editor.
- Rendering follows `design/custom-ui.md`: a documented DOM contract, defaults in `style.css`, no inline styles.

## Non-goals

- Keeping the exact blank lines of the source. Markdown that differs only in which blank lines it has, but renders the same, may serialize differently, see [Model](#model).
- Built-in UI to change looseness: no node-view control and no default keybinding, see [UI](#ui).
- Looseness of a whole list tree. Each list is tight or loose on its own, as in CommonMark: a loose list can contain a tight one and vice versa.

## Design

### Model

Looseness is one attribute on the list, meaning CommonMark looseness:

```ts
attrs: { spread: { default: false } } // bullet_list; ordered_list also has `start`
```

List items have no `spread` attribute. `regular_list_item` and `task_list_item` lose theirs.

This doesn't keep Markdown whose blank lines aren't uniform: `- a\n\n  b\n- c` comes back as `- a\n\n  b\n\n- c`. Both render the same HTML, so the CommonMark and GFM spec tests, which compare HTML, aren't affected. In return, there's one value to display and to change, and it's the one every Markdown renderer shows.

### Conversion

- **unist → ProseMirror:** a list's `spread` is `list.spread || list.children.some((item) => item.spread === true)`. Items' `spread` is otherwise dropped. This already covers lists made loose only by something the editor drops, such as a link reference definition between paragraphs: the item is `spread`, so the list is loose.
- **ProseMirror → unist:** the list's `spread` is written to the list and to each of its items. `mdast-util-to-markdown` decides blank lines between an item's children from the item's own `spread`, so writing it to the items too makes a loose list's blocks all separated by blank lines, not only its items. `isListSpread` goes away, since items no longer have a `spread` of their own that could disagree with the list.

Serialization doesn't check for [forced looseness](#forced-looseness). When a tight list has content that can't be tight, `mdast-util-to-markdown` still writes the blank line it needs, and the Markdown parses back as a loose list. The output is correct either way: what can be out of date is only the editor's display, which the normalisation plugin keeps up to date.

### Forced looseness

#### Which content forces it

Within a list item, `mdast-util-to-markdown` separates two children with a blank line even in a tight list when writing them without one would change the document. With `MarkdownExtension`'s stringify options (`fences: true`, `rule: "-"`, ATX headings), these are the pairs, checked against the parser:

| Left | Right | Without a blank line |
|---|---|---|
| paragraph | paragraph | one paragraph |
| paragraph | horizontal rule | a setext heading, since `rule` is `-` |
| paragraph | ordered list not starting at 1 | the list can't interrupt a paragraph, so it continues it |
| blockquote or list whose last block, recursively through blockquotes, lists and items, is a paragraph | paragraph | the paragraph is a lazy continuation of the left one |
| blockquote | blockquote | one blockquote |

Everything else, such as a heading, a code block or a horizontal rule followed by anything, a paragraph followed by a code block, a blockquote or a list starting at 1, and a blockquote ending in a code block followed by a paragraph, can be tight.

A list is forced loose if any of its items has such a pair as consecutive children. This is one internal function, `isLoosenessForced(list)`, used by the normalisation plugin and by `setListSpread`. It copies rules that are private to `mdast-util-to-markdown` (its `join`), so it can drift when remark changes. A differential test keeps it honest, see [Testing](#testing).

Blocks from other extensions don't force looseness. A wrong "no" leaves the display out of date, as without the plugin; a wrong "yes" would stop users making the list tight at all.

An app that changes the stringify options (see "Changing the Markdown output" in the docs) changes which pairs force looseness, e.g. `rule: "*"` removes the horizontal rule row and `setext: true` adds paragraph followed by heading. The check follows `MarkdownExtension`'s options only; with other options, the display can be out of date in the same way.

#### Normalisation

`ListItemExtension` contributes an `appendTransaction` plugin through the hook proposed in prosemirror-unified#1087. Both list extensions depend on `ListItemExtension`, so the plugin is added once. After a transaction that changes the document, it finds the lists that the changed ranges touch (the lists inside the ranges and their ancestor lists) and sets `spread` to `true` on each tight list that `isLoosenessForced` reports, with `setNodeAttribute`, in one appended transaction.

- **It only ever sets `true`.** When the content that forced the list loose is removed again, the list stays loose. The plugin can't tell whether the user wants it loose, and a list that turns tight on its own when a paragraph is deleted would be surprising. `setListSpread(false)` makes it tight again.
- **Undo:** `prosemirror-history` adds appended transactions to the event of the transaction that caused them, so one undo reverts both the edit and the change of looseness.
- **Collaboration:** each client normalises its own transactions. The steps set an attribute to `true`, so two clients doing the same thing converge.
- **Loaded documents:** `pmu.parse()` already gives lists with forced content `spread: true`, since the Markdown has the blank line. A document from JSON or from another editor's HTML can be inconsistent until it's edited near the list. Normalising the whole document when the state is created would need `EditorState.create` to dispatch, which it can't.
- **Without the plugin:** an app that doesn't add `pmu.plugins()` gets today's behaviour: the Markdown is still correct, and only the display can be out of date.

### DOM contract

```html
<ul class="prosemirror-remark-bullet-list" data-spread="false">
  <li>…</li>
</ul>
<ol class="prosemirror-remark-ordered-list" start="3" data-spread="true">
  <li class="prosemirror-remark-task-list-item" data-checked="true">…</li>
</ol>
```

- `UnorderedListExtension` adds the class `prosemirror-remark-bullet-list` to its `ul`, and `OrderedListExtension` adds `prosemirror-remark-ordered-list` to its `ol`. Both keep `data-spread`.
- `li` elements lose `data-spread`, both in `toDOM` and in the task list item's node view.
- `parseDOM` for lists reads `data-spread="true"` on the list or on any of its `li` children, so HTML copied from an editor running an earlier version keeps looseness that only its items carried. Lists without `data-spread` (pasted from elsewhere) are tight. Inferring looseness from `li > p` isn't done: rendered Markdown uses it for loose lists, but Google Docs and Word put a `p` in every `li`, so their lists would always be loose.

### Default stylesheet

Tight lists look like rendered Markdown, with no margins on the paragraphs directly in their items:

```css
.prosemirror-remark-bullet-list[data-spread="false"] > li > p,
.prosemirror-remark-ordered-list[data-spread="false"] > li > p,
.prosemirror-remark-bullet-list[data-spread="false"]
  > li
  > .prosemirror-remark-task-list-item-content
  > p,
.prosemirror-remark-ordered-list[data-spread="false"]
  > li
  > .prosemirror-remark-task-list-item-content
  > p {
  margin: 0;
}
```

- **Only paragraphs directly in an item,** as in CommonMark, where tightness only drops the `p` around an item's own paragraphs. Paragraphs in a blockquote inside the item keep their margins, and so do other blocks such as code blocks.
- **Nested lists** have their own `data-spread`, and the child combinators stop a tight list's rule from reaching into a loose nested list.
- **Task list items** have their paragraphs inside `.prosemirror-remark-task-list-item-content`, which is part of their documented DOM contract, so the stylesheet can rely on it.

### Commands

```ts
export function setListSpread(spread: boolean): Command;
export function listSpreadAt(state: EditorState): boolean | null;
```

Both apply to the innermost list that contains the whole selection (found as `$from.blockRange($to, isList)` does), or a selected list. A list is a node whose content is in the `list_item` group, as `listItemKeymap` recognises items by the group, so subclasses with other node names work too.

- `setListSpread` sets the list's `spread` with `setNodeAttribute`, keeping its other attributes (`start`, and any an app's subclass adds). It only changes that list, not nested ones.
- It returns `false` outside a list, and `setListSpread(false)` also returns `false` when `isLoosenessForced` reports the list, since the normalisation plugin would make it loose again straight away. A toolbar can use `setListSpread(false)(state)` to disable a "tight" button.
- When the value wouldn't change, it applies but dispatches nothing, so a toolbar doesn't create empty undo steps, as for the code block commands.
- `listSpreadAt` returns the list's `spread`, or `null` outside a list, so a toolbar can show the current state.

Both are exported from `src/index.ts`. No default keybinding.

### UI

There's no built-in control. Once tight lists render tight, the list shows its state, and changing it is rare enough to belong in an app's menu. There's little prior art: word processors have no looseness, only a paragraph spacing setting in a menu, and Markdown's own gesture, a blank line between items, has no equivalent in the editor. A node-view control would also need:

- a wrapper element around the list, since a `ul` or `ol` may only contain `li`, which changes the DOM contract;
- a control per list, which clutters documents with nested lists;
- to know which list the selection is in, to show only that list's control, which needs decorations.

### Editing

- **New lists** are tight: input rules (`- `, `1. `), `Shift-Mod-8`/`Shift-Mod-9` and `Tab`, which nests an item in a new list. An ordered list input rule that continues the list above, and `Tab` into an item that already has a nested list, add to that list and keep its value.
- **`Enter`** splits items, which have no attribute to copy any more. The task list item's input rule and `Backspace`, which convert between regular and task list items, no longer copy `spread`.
- **Joining two lists** keeps the first list's value; the normalisation plugin then makes it loose if the joined content forces it.

### Breaking changes

- `regular_list_item` and `task_list_item` lose the `spread` attribute, and their `li` loses `data-spread`.
- ProseMirror drops attributes a node type doesn't have when creating nodes, so JSON saved by an earlier version loads without errors, but a list made loose only by its items' `spread` loads as tight. An app can fold the items' value into the list before `Node.fromJSON`; the migration guide will show how.
- Subclasses that read or write the items' `spread` have to move to the list's.
- Apps have to add `pmu.plugins()` (or keep adding the plugins themselves) to get the normalisation.

## Testing

- **Differential:** for every ordered pair of the blocks above (paragraph, ATX heading, code block, horizontal rule, blockquote ending in a paragraph and in a code block, bullet list and ordered list ending in a paragraph and in a code block, ordered list starting at 1 and at 3), as children of a regular and of a task list item, in `MarkdownExtension` and `GFMExtension`: `isLoosenessForced` reports the list exactly when serializing it as tight and parsing it back gives a loose list.
- **Conversion:** the two rows of the table in [Problem](#problem) parse as loose; lists made loose by a definition only (the existing tests); nested lists keep their own value; loose lists serialize with blank lines between all items and their children, tight ones without.
- **DOM:** `toRenderDOM` and `toParseDOM` for both list classes, `data-spread`, items without it, and HTML from an earlier version with `data-spread="true"` only on an `li`.
- **Commands:** both values, unchanged values dispatching nothing, `start` kept, the innermost of nested lists, a selected list, a selection across two lists or outside any, and `setListSpread(false)` refusing a forced list. `listSpreadAt` for the same selections.
- **Normalisation:** `Backspace` at the start of the second item, pasting two paragraphs into an item, typing `---` after a paragraph in an item, joining two lists, one undo reverting the edit and the looseness together, a forced nested list leaving its parent alone, and nothing ever being set to `false`.
- **Spec:** the CommonMark and GFM spec round trips keep passing without new known failures.

## Decisions

1. **One attribute on the list, CommonMark looseness,** rather than mdast's two flags. Exact blank lines aren't kept, but there's one value to show and change, and it's the one renderers show.
2. **Items' `spread` is removed,** not kept and ignored, so the schema doesn't carry an attribute that does nothing.
3. **Forced looseness is normalised in the editor,** through prosemirror-unified#1087, rather than displayed by a node view that computes it. A computed display would disagree with the attribute, so `setListSpread(false)` would visibly do nothing and a toolbar would show the wrong state.
4. **Normalisation only sets `true`.**
5. **The forced looseness check copies `mdast-util-to-markdown`'s rules,** guarded by a differential test, rather than serializing and parsing on every change. Blocks it doesn't know don't force looseness.
6. **Serialization doesn't use the check;** `mdast-util-to-markdown` already writes the blank lines that keep the output correct.
7. **One command and one query,** `setListSpread(spread)` and `listSpreadAt(state)`, no toggle: a toolbar knows which value it sets, and a toggle is `setListSpread(!listSpreadAt(state))`.
8. **No built-in UI or keybinding.**
9. **No looseness inferred from pasted HTML** without `data-spread`.
10. **Rendering, commands and normalisation ship together,** once prosemirror-unified#1087 is resolved, so that the display is never out of date in a released version.
