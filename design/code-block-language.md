# Design: code block language

Status: accepted; implemented

## Problem

The info string of a fenced code block is lost ([#1119](https://github.com/marekdedic/prosemirror-remark/issues/1119)). The `code_block` node has no attributes, so `code.lang` and `code.meta` are dropped when Markdown is parsed, and ```` ```js ```` serializes as ```` ``` ````. This also makes CommonMark spec examples 24, 34, 142, 143, 144 and 146 fail.

Preserving the info string fixes the bug. But a language that can only come from loaded Markdown is half a feature: users also need to add, change and remove it while editing.

## Goals

- `lang` and `meta` survive a parse/serialize round trip, and copy and paste inside the editor.
- Users can set, change and remove the language in the editor without the app building any UI.
- Users can type a language when creating a code block with ```` ``` ````.
- Apps can set the language from their own UI (a menu, a picker, a command palette).
- Rendering follows `design/custom-ui.md`: a documented DOM contract, defaults in `style.css`, and node views that apps can replace.

## Non-goals

- Syntax highlighting. It's a user node view or plugin, keyed on `data-language`.
- A list of known languages, validation against one, or autocomplete. Markdown accepts any word as a language.
- Editing `meta` in the default UI. It's kept as is, and apps can change it with `setNodeAttribute`.

## Design

### Schema

`code_block` gets two attributes that mirror mdast:

```ts
attrs: { lang: { default: null }, meta: { default: null } }
```

Both are `string | null`. `null` means no value. Every write goes through one normalisation:

- `lang` is trimmed, and anything from the first whitespace character on is dropped. A language containing whitespace would be read back as `lang` plus `meta`, so it can't round-trip. An empty result becomes `null`.
- If `lang` is `null`, `meta` is `null` too. `mdast-util-to-markdown` writes `meta` only after a `lang`, so a `meta` without a `lang` would be silently lost on save. Clearing it straight away keeps the document and its Markdown in agreement.

Backticks need no special handling: the serializer encodes them as character references, and the parser decodes them back.

### Conversion

- **unist → ProseMirror:** `lang` and `meta` are copied from the `code` node, with `undefined` becoming `null`.
- **ProseMirror → unist:** `lang` and `meta` are emitted only when they aren't `null`. A code block with a language is always written fenced; `MarkdownExtension` already sets `fences: true`.

### DOM contract

`toDOM` mirrors the HTML that CommonMark itself renders for a code block (`<pre><code class="language-js">`), plus this package's class and state attributes:

```html
<pre class="prosemirror-remark-code-block" data-language="js" data-meta="title=a.js">
  <code class="language-js">…</code>
</pre>
```

- `data-language` and `data-meta` are omitted when the value is `null`.
- `language-*` on the `code` element is the convention that highlighters (Prism, highlight.js) and other editors look for. It makes the clipboard useful outside the editor. It isn't a `prosemirror-remark-` class because the default stylesheet doesn't select it.
- `data-meta` exists only so that `meta` survives copy and paste. It isn't meant for styling.

`parseDOM` takes `lang` from the first of these that's present:

1. `data-language` on the `pre`.
2. A `language-*` class on the `pre` or on its `code` child, which covers HTML pasted from other Markdown renderers.

It takes `meta` from `data-meta`, and both go through the normalisation above.

### Node view

`CodeBlockExtension` ships a node view, as `TaskListItemExtension` does for its checkbox:

```html
<pre class="prosemirror-remark-code-block" data-language="js">
  <span class="prosemirror-remark-code-block-language" contenteditable="false">
    <input type="text" value="js" placeholder="language" aria-label="Code block language" spellcheck="false">
  </span>
  <code class="language-js">…</code>  <!-- contentDOM -->
</pre>
```

Behaviour:

- **Every edit is committed** with `setNodeAttribute`, not just the one on blur. The document, and anything the app autosaves from it, is then always current, and `prosemirror-history` groups the keystrokes into one undo step. Commits are skipped while an IME composition is in progress.
- **Whitespace can't be typed** (`beforeinput` is cancelled), and pasted text is normalised as above. This means the field always shows what will be saved.
- **`Enter`, `Escape` and `ArrowDown`** move focus back into the code, at its start. **`ArrowUp`** moves to the end of the block above (or to the start of the code if there's none).
- **`ArrowUp` at the very start of the code** focuses the field. This is a keymap command, so it works only with the node view enabled; without it, the command doesn't apply and `ArrowUp` behaves as usual. Starting from the first line elsewhere, `ArrowUp` still goes to the block above, so moving up through the document isn't interrupted.
- **`stopEvent`** returns `true` for events inside the language element, and **`ignoreMutation`** returns `true` for mutations inside it, so ProseMirror leaves the input alone.
- **`update(node)`** updates `data-language`, `data-meta` and the `language-*` class in place, and sets the input's value only if it differs. Because the node view isn't re-created, the input keeps its focus and caret while the user types.
- **In a read-only editor** (`view.editable === false`), edits in the input are ignored.

This is the one place where the node view isn't just `toDOM` with behaviour added. `custom-ui.md` requires that both "produce the same elements"; the task list checkbox satisfies this because GFM's rendered HTML contains a checkbox. A language input isn't part of any rendered Markdown, and putting a disabled input into every copied code block would leak editor UI into other apps. The rule is therefore amended:

> `toDOM` mirrors the construct's rendered HTML. A node view may add **controls** that carry no document content, wrapped in a `contenteditable="false"` element with a `prosemirror-remark-` class. Apart from those, it renders the same elements, classes and `data-*` attributes as `toDOM`.

Apps that want a dropdown, a combobox with known languages, or highlighting replace the node view with `nodeViews: { ...pmu.nodeViews(), code_block: myView }`, as with the task list.

### Default stylesheet

```css
.prosemirror-remark-code-block {
  position: relative;
}

.prosemirror-remark-code-block-language {
  position: absolute;
  right: 0.5em;
  top: 0.25em;
}

.prosemirror-remark-code-block-language > input {
  background: transparent;
  border: none;
  font: inherit;
  opacity: 0.6;
  text-align: right;
  width: 8em;
}

.prosemirror-remark-code-block-language > input:placeholder-shown:not(:focus) {
  opacity: 0;
}

.prosemirror-remark-code-block:hover .prosemirror-remark-code-block-language > input {
  opacity: 0.6;
}
```

The empty field stays invisible until the code block is hovered or the field is focused, so code blocks without a language don't show a stray "language" placeholder. Without the stylesheet, the input sits inline before the first line of code. That's plain, but it works.

### Input rules

The ```` ``` ```` rule no longer fires on the third backtick. A paragraph turns into a code block when its whole text is an opening fence followed by:

- **a space:** `textblockTypeInputRule(/^\s{0,3}```([^\s`]*) $/u, …)`, with `lang` taken from the capture group.
- **`Enter`:** a keymap command, chained before `liftOutOfCodeBlock`, which runs when the cursor is at the end of a paragraph whose text matches `/^\s{0,3}```([^\s`]*)$/u`. `prosemirror-unified` does pass `Enter` to input rules as `"\n"`, but the key then still reaches the keymap and inserts a newline into the new code block, so the input rule matches a space only.

So ```` ``` ```` followed by space or `Enter` makes a code block without a language, and ```` ```js ```` followed by space or `Enter` makes a `js` one. The same two triggers are added for `~~~` fences, whose language may contain backticks (`/^\s{0,3}~~~(\S*)…/u`). Tiptap's code block input rule works the same way.

This changes behaviour: ```` ``` ```` alone no longer converts straight away. That's the cost of being able to type a language at all; the alternative is a ```` ``` ```` that can never take one.

The four-space rule is unchanged; indented code has no info string.

### Command

A new public export:

```ts
export function setCodeBlockLanguage(lang: string | null): Command;
```

It applies to the code block that contains the selection, normalises `lang` as above (so `null` also clears `meta`), and returns `false` when the selection isn't in a single code block. It's what an app's menu calls, and it shares its transaction with the node view. No default keybinding.

This is the first command the package exports. `setCodeBlockLanguage(lang)` follows `prosemirror-commands`' naming (`setBlockType`, `toggleMark`) and keeps the command usable without access to the extension instance.

## Testing

`toTransformCommand` joins the declarative matchers in `tests/utils/matchers.ts` for commands. `renderNodeView` installs the input-rule and keymap plugins so that node view tests can exercise `ArrowUp`.

## Follow-ups

- **A long first line** can run under the absolutely positioned field. Padding the `pre` on the right only matters when the line is that long, so it's left for later.
