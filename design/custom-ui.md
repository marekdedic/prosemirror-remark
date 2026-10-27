# Design: customisable editor UI

Status: accepted; implemented for task list items and code blocks

## Problem

Some extensions render more than a bare HTML tag. `TaskListItemExtension` used to hard-code how it looked, with inline styles on the `li`, the checkbox wrapper and the content wrapper, both in `toDOM` and in its node view. Inline styles beat any stylesheet rule unless it uses `!important`, so users couldn't make the editor match their design.

The same question will come up for every construct that needs more than a plain tag: links, tables, code block info strings, tight/loose lists, and so on. We want one approach that all of them follow.

## Goals

- Users can restyle everything this package renders using plain CSS, without `!important` and without forking extensions.
- The package ships sane defaults, so the editor looks reasonable out of the box. The defaults work with the default ProseMirror styles.
- The editor still works, if plainly, when the defaults aren't loaded.
- Users can replace structure and behaviour (not just appearance) where CSS isn't enough.
- One convention, applied the same way by every extension.

## Non-goals

- A theming system or design tokens.
- Styling ProseMirror itself (selection, gap cursor, etc.); that belongs to the ProseMirror packages.
- Editor chrome such as menus or toolbars.

## Prior art: ProseMirror

- **Schemas output plain, unstyled HTML.** `prosemirror-schema-basic` and `prosemirror-schema-list` output bare tags with only meaningful attributes (`href`, `src`, `start`, …), with no classes and no inline styles.
- **Styling ships as separate CSS files that users choose to import.** These are `prosemirror-view/style/prosemirror.css`, `prosemirror-gapcursor/style/gapcursor.css` and `prosemirror-tables/style/tables.css`. They're listed in `exports` and `sideEffects` and never injected at runtime.
- **CSS custom properties only carry values from JavaScript.** `TableView` sets `--default-cell-min-width` from the `defaultCellMinWidth` option, and `tables.css` reads it.
- **Structure and behaviour are replaced through options and views.** `columnResizing({ View })` takes a node view class, or `null` for none. `tableNodes({ cellAttributes })` adds stored cell attributes together with how they're read from and written to the DOM. At the view level, the `nodeViews`/`markViews` props override how any node or mark is rendered.

## Design

There are three layers. Each one handles what the previous one can't.

### 1. DOM contract

Every extension renders a fixed, documented DOM structure:

- **The element that matches the construct** (`li`, `pre`, `a`, …).
- **No inline styles,** except for values that come from the document itself rather than from styling, such as a table column width the user set.
- **Classes prefixed with `prosemirror-remark-`** on every element that the default stylesheet needs to select. Elements it doesn't style (`p`, `strong`, `blockquote`, …) get no class. Names are the ProseMirror node or mark name in kebab case, plus a suffix for each part, e.g. `prosemirror-remark-task-list-item` and `prosemirror-remark-task-list-item-checkbox`.
- **`data-*` attributes for state,** with values `"true"`/`"false"` for booleans: `data-checked`, `data-spread`, `data-language`.

`toDOM` mirrors the construct's rendered HTML. The node view (if any) must produce the same elements, classes and `data-*` attributes and may otherwise differ only in behaviour, with one exception: it may add **controls** that carry no document content, wrapped in a `contenteditable="false"` element with a `prosemirror-remark-` class. For example, the task list checkbox is part of GFM's rendered HTML, so it's in both, `disabled` in `toDOM` output and clickable in the node view. The code block's language field isn't part of any rendered Markdown, so only the node view has it. `toDOM` output is what ends up on the clipboard and is read back by `parseDOM`, so it must round-trip.

The DOM contract is public API, documented per extension in the docs site's extension reference (`docs/reference/extensions.md`). Changing it is a breaking change.

### 2. Default stylesheet

The package ships one stylesheet, `prosemirror-remark/style.css`, which users import if they want the defaults:

```ts
import "prosemirror-remark/style.css";
```

- **One file for all extensions.** Rules for extensions a user doesn't use never match anything, and the file is small, so splitting it gains little. Per-extension files would make every path public API, and rules that span two extensions have no clear home. They can be added later without breaking anyone, with `style.css` kept as their concatenation.
- **Shipped as a plain file, not built.** It lives at `style/style.css` in the repository, and `package.json` lists it in `files` (`["dist", "style"]`), maps it in `exports` (`"./style.css": "./style/style.css"`) and names it in `sideEffects` (`["./style/style.css"]`). `sideEffects` can't stay `false`, or bundlers may drop the import. It's never injected at runtime, which keeps the package compatible with Content Security Policy (CSP), server-side rendering and multiple editors on one page.
- **Every selector starts from one of this package's classes,** without `.ProseMirror` in front, and is kept as short as possible:

  ```css
  .prosemirror-remark-task-list-item {
    list-style: none;
  }

  .prosemirror-remark-task-list-item-checkbox > input:not(:disabled) {
    cursor: pointer;
  }
  ```

  Rules never match elements this package didn't render. They're weak enough that users override them with a rule of at least the same specificity loaded after ours, and strong enough to beat element-only rules such as CSS resets.
- **No CSS custom properties by default.** Users override values by writing their own rules. A variable is added only when a value is shared by several rules that must stay in sync, or when it carries a value from JavaScript into CSS. Variables are named `--prosemirror-remark-<node>-<property>`.

### 3. Structure and behaviour overrides

- **Node views.** Users already pass `pmu.nodeViews()` (where `pmu` is their `ProseMirrorUnified` instance) to `EditorView` themselves, so overriding or removing one is plain object spreading. No extension options are needed for this:

  ```ts
  new EditorView(element, {
    nodeViews: { ...pmu.nodeViews(), task_list_item: myTaskListItemView },
    // ...
  });
  ```

- **DOM attribute hooks.** When users need extra attributes that CSS can't provide (e.g. `target`/`rel` on links, `loading="lazy"` on images), the extension takes a constructor option: a function from the node or mark to the attributes to add to what `toDOM` emits:

  ```ts
  new LinkExtension({
    domAttributes: (mark) => ({ target: "_blank", rel: "noopener noreferrer" }),
  });
  ```

  - **Write-only and presentational.** Nothing the hook emits is stored in the document. Unlike `cellAttributes`, it adds no node attribute and no `parseDOM` rule; a new stored attribute is a schema change, not a hook.
  - **It may add attributes, never override the ones the extension emits** (`href`, `src`, classes, `data-*` state, …). `toDOM` output goes to the clipboard and is read back by `parseDOM` on paste, so an overridden attribute would end up in the document and the Markdown.
  - **It applies to `toDOM`,** so it affects the clipboard as well as the editor. A node view that renders the same element must call the hook too.
  - **Rewriting values for display only,** such as resolving a relative `href` or image `src` against a base URL, belongs in a node or mark view, which doesn't affect the clipboard.

  Hooks are added only when a concrete case needs one, not up front. Many apparent cases are CSS, e.g. an icon on external links is `a[href^="http"]::after`.

Configuring an extension that a bundle (`MarkdownExtension`, `GFMExtension`) depends on means passing your own instance alongside the bundle. For that to work regardless of order, [prosemirror-unified#1065](https://github.com/marekdedic/prosemirror-unified/issues/1065) must be resolved first. Until then, the user's instance has to come after the bundle.

Visual options (colours, spacing, icons) are never added as constructor options; CSS covers them.

### Controls in node views

A control that a node view adds (see the DOM contract) is part of the editor, so it has to fit how ProseMirror works:

- **Ignored when parsing.** The control is in the editor's DOM, so `parseDOM` has an `ignore` rule for its wrapper's class. Otherwise its text (such as a label) ends up in the content when the editor's own HTML is pasted back.
- **Edits are transactions.** The control changes the document only by dispatching transactions and keeps no state of its own, so undo, collaborative editing and `filterTransaction` work as for any other edit. A text field's native undo and redo are cancelled (`beforeinput` with `historyUndo`/`historyRedo`) and the undo keys left to ProseMirror, so there's a single history. `update()` redraws the control from the node, so changes made elsewhere, such as an undo, show up in it.
- **Read-only editors.** The control respects `view.editable`. A node view isn't updated when only the `editable` prop changes, so it's checked again on focus and before every edit, not only when drawing.
- **Form field pitfalls.** `Enter` in the control doesn't submit an enclosing form. Key handling skips keys that belong to an input method composition (`isComposing`, or the key code 229 Safari reports after it), and a composition is committed on `blur`, since some input methods end one without `compositionend`. `stopEvent` and `ignoreMutation` cover the whole control.
- **Keyboard access.** The arrow keys move between the content and the control in both directions, using `endOfTextblock` to find the content's edges, so the control can be reached without a mouse.
- **Right-to-left text.** Arrow key handling follows the computed direction, not the key name: which edge of a field the caret leaves at follows the field's own direction, and where it goes follows the surrounding text's. The default stylesheet uses logical properties (`margin-inline-end`, `border-start-start-radius`, …) rather than `left`/`right`.
- **Any document.** Elements are created with `view.dom.ownerDocument` and checked without `instanceof`, so the control works in iframes and shadow roots.
- **Styling without the node view.** The default stylesheet makes `toDOM` output look complete on its own, and node-view-only controls attach to it (e.g. with a sibling selector such as `label + code`), not the other way round. The clipboard HTML and editors without the node views then still look right.
- **Text and accessibility.** The control has an accessible name, for example by being wrapped in a `<label>`, or with `aria-labelledby` pointing at document content, which needs no text of its own. Its visible text is currently hard-coded English; how to make it translatable is open ([#1180](https://github.com/marekdedic/prosemirror-remark/issues/1180)).

## Applying the design

### Task list items (implemented)

```html
<li class="prosemirror-remark-task-list-item" data-checked="true" data-spread="false">
  <span class="prosemirror-remark-task-list-item-checkbox" contenteditable="false">
    <input type="checkbox" aria-labelledby="prosemirror-remark-task-list-item-content-1" checked>
  </span>
  <div class="prosemirror-remark-task-list-item-content" id="prosemirror-remark-task-list-item-content-1">…</div>
</li>
```

The checkbox takes its accessible name from the content with `aria-labelledby`, so it needs no visible or translatable text. Both `toDOM` and the node view give the content `div` an `id` from a counter, unique within the page; `parseDOM` ignores it.

The default stylesheet hides the list marker and positions the checkbox where the marker would be. The checkbox wrapper is absolutely positioned against the `li` without any offsets, so it stays at the `li`'s start edge in either direction. It's a zero-width flex container with `justify-content: flex-end`, so its content overflows outwards, past that edge. A zero-width space in `::after` is a second flex item: with `align-items: baseline` it lines the checkbox up with the first line of text, and its `flex-basis` is the gap between the checkbox and the text. This needs no logical properties, which older browsers lack (`inset-inline-end` needs Chrome and Edge 87). The stylesheet also gives the node view's enabled checkbox a pointer cursor.

The arrow keys move between the checkbox and the item's text ([#1187](https://github.com/marekdedic/prosemirror-remark/issues/1187)), and `Space` toggles the focused checkbox natively. At the very start of the item's first paragraph, with an empty selection, the key that leaves the text on the checkbox's side focuses it: `ArrowLeft` in left-to-right text, `ArrowRight` in right-to-left text, decided by `view.endOfTextblock()`, and in an empty paragraph by the checkbox wrapper's computed direction, since that's the side the checkbox is on. There's no `ArrowUp` from the text, since the checkbox is on the first line, not above it. On the checkbox, the horizontal key towards the text and `ArrowDown` put the caret at the text's start, and the other horizontal key and `ArrowUp` move to the end of the block above, so moving through the document passes each checkbox once and the checkbox never traps vertical movement. The keys are keymap commands, so they apply only with the node view enabled, the editor editable and the checkbox able to take focus. A toggle command or shortcut isn't provided: a toolbar button toggling the item at the selection is no more useful than the checkbox in the content, and a shortcut would need a free key and an announcement, since the checkbox wouldn't get focus.

In a read-only editor, the node view's checkbox is disabled and clicking it does nothing. A disabled checkbox gets no focus or clicks, and the node view isn't updated when only the `editable` prop changes, so the node view follows the prop through the `contenteditable` attribute ProseMirror keeps on the editor's DOM.

### Code blocks (implemented)

See `design/code-block-language.md`.

### Future cases

- **Tight/loose lists.** Lists get the classes `prosemirror-remark-bullet-list` and `prosemirror-remark-ordered-list`. The default stylesheet uses them with the existing `data-spread` attribute to remove paragraph margins in tight lists, so they look like rendered Markdown. The rule must also reach task list items, whose paragraphs sit inside the content `div` rather than directly in the `li`. A toggle is a command, not a rendering concern.
- **Links.** Extra attributes come from a DOM attribute hook if anyone asks for one. Showing or editing the `href` is a user mark view or editor plugin.