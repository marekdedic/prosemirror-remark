# Extensions

Every Markdown construct is supported by its own extension. This page lists them all, with the ProseMirror node or mark each one provides, its input rules and keyboard shortcuts, and the HTML it renders in the editor.

The node and mark names are the ones in the schema returned by `pmu.schema()`, so you can use them with ProseMirror's commands, for example `toggleMark(schema.marks.strong)` or `setBlockType(schema.nodes.heading, { level: 2 })` from `prosemirror-commands` for a toolbar button.

In keyboard shortcuts, `Mod` is `Cmd` on macOS and `Ctrl` elsewhere.

Input rules that start a block (headings, lists, block quotes, …) work at the start of a paragraph, after up to three spaces, as in Markdown. Input rules for inline formatting apply once you type the character after the closing delimiter, so typing `**bold** ` makes the text bold when you type the space.

## Document structure

### `RootExtension`

The document itself. Every editor needs it.

- **ProseMirror node:** `doc`, containing one or more blocks.

### `ParagraphExtension`

Paragraphs. Every editor needs it in practice, and it [must come first](/guide/choosing-extensions#order).

- **ProseMirror node:** `paragraph`
- **HTML:** `<p>`

### `TextExtension`

Plain text. Every editor needs it.

- **ProseMirror node:** `text`

## Blocks

### `HeadingExtension`

ATX headings (`# Heading`) and setext headings (`Heading` underlined with `===` or `---`). Includes `ParagraphExtension` and `TextExtension`.

- **ProseMirror node:** `heading`, with the attribute `level` (1–6). Headings contain formatted text, but no images or line breaks.
- **HTML:** `<h1>`–`<h6>`
- **Input rules:** `# ` to `###### ` turns the paragraph into a heading of that level.
- **Keyboard shortcuts:**
  - `Shift-Mod-1` to `Shift-Mod-6` turn the current block into a heading of that level.
  - `Tab` and `Shift-Tab` increase and decrease the heading's level.
  - At the start of a heading, `#` increases its level and `Backspace` decreases it.
  - Decreasing the level of a level 1 heading turns it into a paragraph.

### `BlockquoteExtension`

Block quotes (`> quote`).

- **ProseMirror node:** `blockquote`, containing one or more blocks.
- **HTML:** `<blockquote>`
- **Input rules:** `> ` wraps the paragraph in a block quote.
- **Keyboard shortcuts:** `Mod->` wraps the selection in a block quote.

### `CodeBlockExtension`

Fenced (```` ``` ````, `~~~`) and indented code blocks. Includes `TextExtension`.

- **ProseMirror node:** `code_block`, with the attributes `lang` and `meta` (the language and the rest of a fenced code block's info string, ```` ```js title="a.js" ````, both `null` when absent). Code blocks contain text only, without formatting. The language never contains whitespace. Markdown can only write a `meta` after a language, so a code block without a language keeps its `meta` but leaves it out of the Markdown.
- **HTML:** `<pre class="prosemirror-remark-code-block" data-language="…" data-meta="…">` containing `<code class="language-…">`. `data-language` and the `language-*` class are left out when there's no language, and `data-meta` when there's no `meta`. Pasted HTML also takes the language from `data-lang` or a `language-*` or `lang-*` class on the `pre` or `code`, as other Markdown renderers and syntax highlighters write it, but never from the `lang` attribute, which is the text's natural language. Styled by the default stylesheet, `prosemirror-remark/style.css`.
- **Node view:** adds a non-editable tab, `<div class="prosemirror-remark-code-block-info">`, before the code, with two fields:
  - `<label class="prosemirror-remark-code-block-language">`, containing the text "Language:" (in a `<span class="prosemirror-remark-code-block-language-label">`) and an `<input>` for the language. Typing in it changes the language, and clearing it removes the language. It can't contain whitespace: a space typed at the end of a language moves to the `meta` field.
  - `<label class="prosemirror-remark-code-block-meta">`, containing the text "Meta:" (in a `<span class="prosemirror-remark-code-block-meta-label">`) and an `<input>` for the `meta`. Typing in it changes the `meta`, and clearing it removes the `meta`. Line endings in a `meta` are shown as spaces, and become spaces when it's edited. The default stylesheet greys out a `meta` in a code block without a language, which won't be saved to Markdown. `Backspace` at the start of the field moves to the end of the language field.

  `ArrowRight` at the end of the language field moves to the `meta` field, and at the end of the `meta` field to the start of the code. `ArrowLeft` at the start of the `meta` field moves to the language field, and at the start of the language field to the block above, if there is one. `Enter`, `Escape` and `ArrowDown` in either field go to the start of the code, and `ArrowUp` to the block above. In a right-to-left tab, `ArrowLeft` and `ArrowRight` swap. A field hidden by the app's styles is skipped. In a read-only editor, the fields are read-only. Pass `pmu.nodeViews()` to your `EditorView` to enable it. In a right-to-left editor, set the direction of code blocks on the `pre`, not the `code`: the tab follows the `pre`'s direction and the block's square corner the `code`'s.
- **Input rules:** ```` ``` ```` or `~~~`, optionally followed by a language, then a space turns the paragraph into a code block. Four spaces turn it into a code block without a language.
- **Keyboard shortcuts:**
  - `Enter` at the end of a paragraph containing only ```` ``` ```` or `~~~`, optionally followed by a language, turns it into a code block. Text after a space, such as a `meta`, makes the paragraph ordinary text, so pressing `Enter` after it just starts a new paragraph. The line is read as CommonMark reads an opening fence, including backslash escapes and character references (```` ```c\# ```` is the language `c#`).
  - While a paragraph is an opening fence, the inline formatting input rules don't apply in it, so a language like `foo_bar_baz` can be typed.
  - `Shift-Mod-\` turns the current block into a code block.
  - Pressing `Enter` three times at the end of a code block leaves it: the two empty lines are removed and a new paragraph starts below.
  - `ArrowLeft` at the very start of a code block (`ArrowRight` in right-to-left code) moves to its `meta` field, and `ArrowUp` on its first line to its language field, when the node view is enabled.
- **Commands:**
  - `setCodeBlockLanguage(lang)` sets the language of the code block containing the selection, for example from a toolbar. `null` or an empty string removes the language, keeping the `meta`.
  - `setCodeBlockMeta(meta)` sets the `meta` of the code block containing the selection, keeping the language. `null` or an empty string removes the `meta`. It works without a language too, but Markdown can only carry the `meta` after one. The `meta` is an opaque string: conventions like `title="…"` are left to the app.

### `HorizontalRuleExtension`

Horizontal rules, also called thematic breaks (`---`, `***`, `___`).

- **ProseMirror node:** `horizontal_rule`
- **HTML:** `<div><hr></div>`
- **Input rules:** `---`, `***` or `___` followed by `Enter` inserts a horizontal rule.
- **Keyboard shortcuts:** `Mod-_` inserts a horizontal rule.

## Lists

In Markdown, a list is either tight or loose: in a loose list, the items are separated by blank lines. Lists and list items keep this in their `spread` attribute, rendered as `data-spread="true"` or `"false"`, so that the Markdown keeps its layout.

All list items share the keyboard shortcuts:

- `Enter` starts a new item, or, in an empty nested item, moves it out to the outer list.
- `Tab` nests the item in the previous one.
- `Shift-Tab` moves the item out to the outer list, or out of the list if it isn't nested.

### `UnorderedListExtension`

Bullet lists (`- item`, `* item`, `+ item`). Includes `ListItemExtension`.

- **ProseMirror node:** `bullet_list`, with the attribute `spread`.
- **HTML:** `<ul data-spread="…">`
- **Input rules:** `- `, `* ` or `+ ` wraps the paragraph in a bullet list.
- **Keyboard shortcuts:** `Shift-Mod-8` wraps the selection in a bullet list.

### `OrderedListExtension`

Ordered lists (`1. item`, `1) item`). Includes `ListItemExtension`.

- **ProseMirror node:** `ordered_list`, with the attributes `start` (the first item's number) and `spread`.
- **HTML:** `<ol start="…" data-spread="…">`
- **Input rules:** a number followed by `. ` wraps the paragraph in an ordered list starting at that number. If it continues the numbering of the list just above, it's added to that list instead.
- **Keyboard shortcuts:** `Shift-Mod-9` wraps the selection in an ordered list.

### `ListItemExtension`

The items of both bullet and ordered lists. Included by `UnorderedListExtension` and `OrderedListExtension`.

- **ProseMirror node:** `regular_list_item`, with the attribute `spread`, containing one or more blocks. It's in the `list_item` group, together with `task_list_item`.
- **HTML:** `<li data-spread="…">`

## Inline formatting

### `BoldExtension`

Bold text, called strong emphasis in Markdown (`**bold**`, `__bold__`).

- **ProseMirror mark:** `strong`
- **HTML:** `<strong>`
- **Input rules:** `**text**` and `__text__`.
- **Keyboard shortcuts:** `Mod-b` toggles bold.

### `ItalicExtension`

Italic text, called emphasis in Markdown (`*italic*`, `_italic_`).

- **ProseMirror mark:** `em`
- **HTML:** `<em>`
- **Input rules:** `*text*` and `_text_`.
- **Keyboard shortcuts:** `Mod-i` toggles italic.

### `InlineCodeExtension`

Code spans (`` `code` ``).

- **ProseMirror mark:** `code`. Text typed right after a code span isn't code.
- **HTML:** `<code>`
- **Input rules:** `` `text` ``, or text between longer backtick runs of equal length to include backticks (```` ``a`b`` ````). When the text both starts and ends with a space, one space is removed from each side (``` `` ` `` ``` is code `` ` ``). The text that's left can't start or end with whitespace.
- **Keyboard shortcuts:** `` Ctrl-` `` toggles inline code.

### `LinkExtension`

Inline links (`[text](https://example.com "title")`) and autolinks (`<https://example.com>`).

- **ProseMirror mark:** `link`, with the attributes `href` and `title`. Text typed right after a link isn't part of it.
- **HTML:** `<a href="…" title="…">`

### `LinkReferenceExtension`

Reference-style links (`[text][id]`, `[text][]`, `[text]`), whose address is given by a definition elsewhere in the document. Includes `DefinitionExtension` and `LinkExtension`.

There's no ProseMirror mark of its own: references are resolved into ordinary `link` marks when parsing, and come back out as inline links. See [Markdown output](/guide/markdown-output#output-style).

### `BreakExtension`

Hard line breaks (a line ending with two spaces or a `\`).

- **ProseMirror node:** `hard_break`, an inline node.
- **HTML:** `<br>`
- **Keyboard shortcuts:** `Shift-Enter` and `Mod-Enter` (also `Ctrl-Enter` on macOS) insert a line break. In a code block, they leave the code block instead.

## Images

### `ImageExtension`

Images (`![alt](image.png "title")`). Includes `ParagraphExtension`.

- **ProseMirror node:** `image`, an inline node with the attributes `src`, `alt` and `title`. Images can be dragged.
- **HTML:** `<img src="…" alt="…" title="…">`

### `ImageReferenceExtension`

Reference-style images (`![alt][id]`), whose address is given by a definition elsewhere in the document. Includes `DefinitionExtension` and `ImageExtension`.

There's no ProseMirror node of its own: references are resolved into ordinary `image` nodes when parsing, and come back out as inline images.

### `DefinitionExtension`

Definitions (`[id]: https://example.com "title"`), for resolving reference-style links and images. Included by `LinkReferenceExtension` and `ImageReferenceExtension`.

There's no ProseMirror node: definitions aren't shown in the editor, and aren't written back out by `serialize`.

## GFM extensions

These are included in `GFMExtension`, but not in `MarkdownExtension`. See [GitHub Flavored Markdown](/guide/gfm).

### `StrikethroughExtension`

Strikethrough text (`~~text~~`, `~text~`).

- **ProseMirror mark:** `strikethrough`
- **HTML:** `<s>`
- **Input rules:** `~~text~~` and `~text~`.

### `TaskListItemExtension`

Task list items (`- [ ] task`, `- [x] done`). Use it together with `UnorderedListExtension` or `OrderedListExtension`.

- **ProseMirror node:** `task_list_item`, with the attributes `checked` and `spread`, containing a paragraph followed by any blocks. It's in the `list_item` group, so it can be mixed with regular items in one list.
- **HTML:** `<li class="prosemirror-remark-task-list-item" data-checked="…" data-spread="…">` containing a non-editable `<span class="prosemirror-remark-task-list-item-checkbox">` with an `<input type="checkbox" aria-labelledby="…">`, followed by a `<div class="prosemirror-remark-task-list-item-content" id="…">` with the content. The checkbox is labelled by the content, so screen readers announce the item's text with it; the `id` is generated and unique within the page. Styled by the default stylesheet, `prosemirror-remark/style.css`.
- **Node view:** makes the checkbox clickable. `ArrowDown` and `ArrowRight` on the checkbox go to the start of the item's text, and `ArrowUp` and `ArrowLeft` to the block above, if there is one (in right-to-left text, `ArrowLeft` goes to the text and `ArrowRight` to the block above). Pass `pmu.nodeViews()` to your `EditorView` to enable it.
- **Input rules:** `[ ] ` or `[] ` at the start of a list item turns it into an unchecked task item, and `[x] ` or `[X] ` into a checked one.
- **Keyboard shortcuts:**
  - The [list item shortcuts](#lists). `Enter` starts a new, unchecked task item.
  - `Backspace` at the start of a task item turns it back into a regular list item.
  - `ArrowLeft` at the very start of a task item (`ArrowRight` in right-to-left text) moves to its checkbox, where `Space` checks or unchecks it, when the node view is enabled.

### `ExtendedAutolinkExtension`

Links written without angle brackets (`www.example.com`, `https://example.com`, `contact@example.com`). Use it together with `LinkExtension`.

These become ordinary `link` marks, so there's no ProseMirror mark of its own. They come back out as inline links, see [Markdown output](/guide/markdown-output#output-style).
