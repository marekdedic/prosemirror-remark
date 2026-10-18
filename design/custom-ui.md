# Design: customisable editor UI

Status: draft

## Problem

Some extensions render more than a bare HTML tag, and they hard-code how it looks. `TaskListItemExtension` puts inline styles on the `li`, the checkbox wrapper and the content wrapper, both in `toDOM` and in its node view. Inline styles beat any stylesheet rule unless it uses `!important`, so users can't make the editor match their design.

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

`toDOM` and the node view (if any) must produce the same classes and attributes; the node view may differ only in behaviour, such as making the checkbox clickable. `toDOM` output is what ends up on the clipboard and is read back by `parseDOM`, so it must round-trip.

The DOM contract is public API. Changing it is a breaking change.

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

  .prosemirror-remark-bullet-list[data-spread="false"] > li > p {
    margin: 0;
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

## Applying the design

### Task list items (first implementation)

```html
<li class="prosemirror-remark-task-list-item" data-checked="true" data-spread="false">
  <span class="prosemirror-remark-task-list-item-checkbox" contenteditable="false">
    <input type="checkbox" checked>
  </span>
  <div class="prosemirror-remark-task-list-item-content">…</div>
</li>
```

The inline styles in `TaskListItemExtension.ts` (`itemStyle`, `checkboxContainerStyle`, `contentStyle`, and the node view checkbox's `cursor: pointer`) move into the stylesheet.

### Future cases

- **Tight/loose lists.** Lists get the classes `prosemirror-remark-bullet-list` and `prosemirror-remark-ordered-list`. The default stylesheet uses them with the existing `data-spread` attribute to remove paragraph margins in tight lists, so they look like rendered Markdown. A toggle is a command, not a rendering concern.
- **Code block info.** The info string's language goes into `data-language` on the `pre`. Syntax highlighting or a language picker is a user node view.
- **Links.** Extra attributes come from a DOM attribute hook if anyone asks for one. Showing or editing the `href` is a user mark view or editor plugin.