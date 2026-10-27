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

- `lang` loses leading whitespace and is cut at the first space, tab or line ending, the characters CommonMark splits an info string at. A language containing one would be read back as `lang` plus `meta`, so it can't round-trip. An empty result becomes `null`.
- `meta` loses leading spaces and tabs, which the parser drops. An empty result becomes `null`.
- `meta` is kept when `lang` is `null`, even though `mdast-util-to-markdown` writes `meta` only after a `lang`, so it's left out of the Markdown until a language is set again. Clearing it instead would lose it whenever the language is retyped, which passes through an empty field, and keeping the two in agreement took state in the node view that was harder to get right than the mismatch is worth.

See [Info string: inputs and outputs](#info-string-inputs-and-outputs) for why exactly these rules, and how every path in and out of the document uses them.

### Conversion

- **unist → ProseMirror:** `lang` and `meta` are copied from the `code` node, with `undefined` becoming `null`.
- **ProseMirror → unist:** `lang` and `meta` go through the normalisation once more, as they do in `toDOM` and the node view, since apps can set the attributes directly (e.g. `meta` with `setNodeAttribute`) or load them from JSON, and are emitted only when they aren't `null`. A code block with a language is always written fenced; `MarkdownExtension` already sets `fences: true`.

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

`parseDOM` takes `lang` from the first of these that isn't empty after normalisation, so an empty or whitespace-only value doesn't hide the next one:

1. `data-language` on the `pre`.
2. `data-lang` on the `pre` or its `code` child (Hugo, Chroma).
3. A `language-*` or `lang-*` class on the `pre`, then on its `code` child (Prism, highlight.js, Prettify, other Markdown renderers). `language-none`, which Prism uses for a block without a language, means no language.

It never reads the `lang` attribute, which is the natural language of the content. The content is all the text in the `pre`: taking only a `code` child would silently drop code from HTML that has one `code` per line or text beside it. A separate rule ignores the node view's language field (`label.prosemirror-remark-code-block-language`), so its "Language:" text doesn't end up in the code if an app parses the editor's own HTML. It takes `meta` from `data-meta`, and both go through the normalisation above.

### Node view

`CodeBlockExtension` ships a node view, as `TaskListItemExtension` does for its checkbox:

```html
<pre class="prosemirror-remark-code-block" data-language="js">
  <label class="prosemirror-remark-code-block-language" contenteditable="false">
    <span class="prosemirror-remark-code-block-language-label">Language:</span>
    <input type="text" value="js" placeholder="none" spellcheck="false">
  </label>
  <code class="language-js">…</code>  <!-- contentDOM -->
</pre>
```

The visible "Language:" text describes the field, gives it its accessible name and focuses it when clicked, because the container is a `label`. Apps that want other wording, or no text, hide it with CSS or replace the node view.

Behaviour:

- **Every edit is committed** with the same transaction as `setCodeBlockLanguage` (`setNodeAttribute` on `lang`, which keeps `meta` and any other attributes), not just the one on blur. The document, and anything the app autosaves from it, is then always current, and `prosemirror-history` groups the keystrokes into one undo step. Commits are skipped while an IME composition is in progress (a composition that some input methods end with a blur instead of `compositionend` is committed on blur), and a change from elsewhere during one (a collaborator editing the code) doesn't overwrite the field, which would cancel the composition. Clearing the language keeps `meta`, so retyping ```` ```js title="a.js" ```` as `ts` keeps the title.
- **Whitespace can't be typed** (`beforeinput` is cancelled). Of typed or pasted text that contains whitespace, such as predictive text or autocomplete inserting "python " or "objective c", only the first word is inserted, at the caret, so the rest of the field and the caret position are left alone. Both arrive as a cancellable `beforeinput` (`insertText`, `insertFromPaste`) whose `data` is the text, in Chromium, Firefox and WebKit. The `Enter` that confirms an IME composition is ignored, also in Safari, which reports it after the composition has ended with the key code 229. Whitespace here means what the normalisation means: spaces, tabs and line endings, not a non-breaking space. A paste of only whitespace changes nothing, rather than deleting the selected text. Whitespace that arrives any other way (drag and drop, autocorrect) is removed wherever it is, keeping the caret in place, rather than cutting the field at it. This means the field always shows what will be saved.
- **Keys with a modifier** (Shift, Ctrl, Alt, Meta) are always left to the field, so Shift-`ArrowUp` selects within it instead of leaving it. The exception is undo and redo (`Mod-Z`, `Mod-Shift-Z`, `Mod-Y`, where `Mod` is Cmd on macOS and Ctrl elsewhere, recognised by the key's position on non-Latin layouts, as ProseMirror's keymap does): `stopEvent` lets them through to ProseMirror, so they undo the editor's history, which already holds every change to the language, rather than the input's own history, which would diverge from it. The input's own undo and redo (`historyUndo`, `historyRedo`) are cancelled too, so that when the editor's history has nothing to undo, `Mod-Z` doesn't fall through to the field and create a new change in the middle of an undo.
- **`Enter`, `Escape` and `ArrowDown`** move focus back into the code, at its start, and so does **`ArrowRight`** at the end of the field's text. **`ArrowUp`** moves to the end of the block above, and so does **`ArrowLeft`** at the start of the field's text. With no block above, both leave the focus in the field. With `ArrowLeft` and `ArrowRight`, which edge of the field's text the caret is at follows the field's own direction (usually left-to-right, see below), but where leaving goes follows the tab's direction, as on the code side: in a right-to-left tab, `ArrowRight` goes backward, to the block above, and `ArrowLeft` forward, into the code. Using one direction for both made `ArrowRight` bounce between left-to-right fields and right-to-left code. `Enter`'s default is always cancelled, with or without modifiers, since `Enter` in a lone input would submit an enclosing form.
- **`ArrowUp` anywhere on the first line of the code, and the arrow key that leaves the code at its very start,** focus the field: `ArrowLeft` in left-to-right code, `ArrowRight` in right-to-left code. ProseMirror's `view.endOfTextblock()` decides which, visually, so left-to-right code in a right-to-left editor works too. In an empty code block both keys would leave it, so there the code element's computed direction decides. The caret goes to the end of the field's text. The field sits above the code and before it, so both keys go where the caret would naturally go next, and moving up through the document passes through the field on its way to the block above. "First line" means the first visual row: the command checks that no newline precedes the caret and that `view.endOfTextblock("up")` holds, so in a wrapped first line `ArrowUp` from its second row still moves within the code. These are keymap commands, so they work only with the node view enabled, the editor editable and the field able to take focus (an app may hide it with CSS; focus is checked against `view.root`, so this works inside a shadow root); otherwise they don't apply and the keys behave as usual.
- **`stopEvent`** returns `true` for events inside the language element, and **`ignoreMutation`** returns `true` for mutations inside it, so ProseMirror leaves the input alone.
- **Other windows:** the node view creates its elements in the editor's own document and checks events and nodes without `instanceof`, so it works in an iframe, where those come from another window than the global classes.
- **`update(node)`** updates `data-language`, `data-meta` and the `language-*` class in place, from the same helper `toDOM` uses, so the two can't diverge, and sets the input's value only if it differs. Because the node view isn't re-created, the input keeps its focus and caret while the user types.
- **In a read-only editor** (`view.editable === false`), the input is `readOnly`, so it looks and is announced as read-only. A node view isn't updated when only the editor's `editable` prop changes, so the field syncs `readOnly` whenever it renders and whenever it gets focus, before it can be typed into or announced. Edits that get past that are still ignored.

This is the one place where the node view isn't just `toDOM` with behaviour added. `custom-ui.md` requires that both "produce the same elements"; the task list checkbox satisfies this because GFM's rendered HTML contains a checkbox. A language input isn't part of any rendered Markdown, and putting a disabled input into every copied code block would leak editor UI into other apps. The rule is therefore amended:

> `toDOM` mirrors the construct's rendered HTML. A node view may add **controls** that carry no document content, wrapped in a `contenteditable="false"` element with a `prosemirror-remark-` class. Apart from those, it renders the same elements, classes and `data-*` attributes as `toDOM`.

Apps that want a dropdown, a combobox with known languages, or highlighting replace the node view with `nodeViews: { ...pmu.nodeViews(), code_block: myView }`, as with the task list.

### Default stylesheet

```css
.prosemirror-remark-code-block > code {
  background: rgb(127 127 127 / 12%);
  border-radius: 0.375em;
  display: block;
  overflow-x: auto;
  padding: 0.75em 1em;
}

.prosemirror-remark-code-block-language + code {
  border-start-start-radius: 0;
}

.prosemirror-remark-code-block-language {
  background: rgb(127 127 127 / 12%);
  border-radius: 0.375em 0.375em 0 0;
  display: table;
  font-size: 0.8em;
  line-height: 1;
  padding: 0.5em 1.25em 0.4em;
}

.prosemirror-remark-code-block-language-label {
  margin-inline-end: 0.5em;
  opacity: 0.55;
}

.prosemirror-remark-code-block-language > input {
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  outline: none;
  padding: 0;
  text-align: -webkit-match-parent;
  text-align: match-parent;
}

.prosemirror-remark-code-block-language:focus-within {
  box-shadow: inset 0 -2px rgb(127 127 127 / 50%);
}
```

The field is a tab attached to the block's top corner on its start side (top-left in left-to-right text), so it's clearly tied to its code block however wide the block is. A field in the top-right corner was tried first, but in a wide editor it ended up far from short code and it wasn't clear which block it belonged to.

The `code` element, not the `pre`, draws the block: a background and padding, so it's visible as a block. The tab sits above it inside the `pre`, in normal flow, as a shrink-to-fit block (`display: table`) with the same background. Being in flow, the tab makes its own room, so it can't cover the content above. The block's top-left corner is square only when the tab is right before it (`label + code`), so the language reads as part of the block rather than as a line of text above it, and code blocks rendered without the node view, such as `toDOM` output in a read-only preview, get an ordinary rounded block. An earlier version drew the block on the `pre` and placed the tab outside it with `position: absolute`. That needed the `pre` to reserve room for the tab with a top margin, applied only when the tab was there through `:has()`, so browsers without `:has()` (Firefox before 121) let the tab overlap the content above.

The background is a translucent grey, so it works on light and dark pages alike. The tab's text lines up with the code. The field is sized to its content by the node view, through the input's `size` attribute (`field-sizing: content` isn't supported everywhere), so the tab is only as wide as "Language: …". The input's own focus outline is replaced by an underline on the whole tab. The `code` scrolls horizontally, so a line that can't wrap (an unbreakable word, or any line when a page sets `white-space: pre`) stays within the block instead of running out of it. Since the `code` is both the block and the scroll container, scrolled text runs up to the block's edge rather than stopping at its padding. A page that styles `pre` with a background shows it behind the tab as well.

**Right-to-left text.** The tab is a shrink-to-fit block, so it sits at the `pre`'s start side: on the right in a right-to-left editor. The square corner (`border-start-start-radius`) and the gap after the label (`margin-inline-end`) are logical properties, so they follow it. The corner follows the `code`'s direction and the tab the `pre`'s, so an app that changes the direction of code blocks has to set it on the `pre`, not the `code`. The field has `dir="auto"`: language names are left-to-right text, so in a right-to-left editor the field is still left-to-right, with the value aligned to the tab's start (`text-align: match-parent`, preceded by `-webkit-match-parent` for Chrome and Edge, which only support the prefixed value) next to the label. The direction of the code itself is left to the app; browsers render left-to-right code in a right-to-left `pre` with its punctuation at the wrong end, which apps usually fix with `direction: ltr` on the `pre`.

The tab is always visible, also without a language, when it reads "Language: none". Hiding the empty tab until the block was hovered was tried first, but it made the field undiscoverable and impossible to reach on touch screens. Without the stylesheet, the input sits inline before the first line of code. That's plain, but it works.

### Input rules

The ```` ``` ```` rule no longer fires on the third backtick. A paragraph turns into a code block when its whole text is an opening fence followed by:

- **a space:** an input rule like `textblockTypeInputRule`, which fires when the space follows a fence and a language with no whitespace in between, at the end of the paragraph.
- **`Enter`:** a keymap command, chained before `liftOutOfCodeBlock`, which runs at the end of a paragraph that is a fence line.

Whether the text is a fence line, and what its language and `meta` are, is decided by the CommonMark parser, see [Fence lines: use the parser](#fence-lines-use-the-parser). Both triggers apply only where a code block may replace the paragraph (not, for example, in the first paragraph of a task list item). They apply only in paragraphs: as in CommonMark, `# ```` ` is a heading, so a heading whose text is a fence stays a heading. `prosemirror-unified` does pass `Enter` to input rules as `"\n"`, but the key then still reaches the keymap and inserts a newline into the new code block, so the input rule matches a space only.

So ```` ``` ```` followed by space or `Enter` makes a code block without a language, and ```` ```js ```` followed by space or `Enter` makes a `js` one, for `~~~` fences and longer fences too. A `meta`, or spaces between the fence and the language, can't be typed, since the first space already converts the paragraph. So both triggers only accept a fence followed by at most one word, with no space or tab after the fence: a paragraph like ```` ``` is how you open a fence ```` is prose, even though CommonMark would read it as a fence with a `meta`. An earlier version also converted such paragraphs on `Enter`, for pasted fence lines with a `meta`, but that turned existing prose into code blocks when the user only meant to start a new paragraph. Typing or pasting a `meta` is part of #1182. Tiptap's code block input rule works the same way.

Because the fence now converts only after the language, the mark input rules get to see a half-typed fence first. A guard rule keeps them out, see [Fence lines: keep mark input rules out](#fence-lines-keep-mark-input-rules-out). The inline code and strikethrough patterns are also stricter: their content can't start or end with a backtick (respectively a tilde), which is what CommonMark requires of a single-delimiter code span or strikethrough, since such a delimiter would just make the run longer. Tests type the fences into the full `MarkdownExtension` and `GFMExtension`, so these interactions are covered.

This changes behaviour: ```` ``` ```` alone no longer converts straight away. That's the cost of being able to type a language at all; the alternative is a ```` ``` ```` that can never take one.

The four-space rule applies only in a paragraph, like the fence triggers, so a heading stays a heading. It matches exactly four spaces (or non-breaking spaces, which browsers may produce for a typed space when input is read back from the DOM, as on Android; the space trigger accepts one too). It used to match any four whitespace characters, so three spaces + `Enter` (passed to the input rules as `"\n"`) made a code block. Indented code has no info string.

### Command

A new public export:

```ts
export function setCodeBlockLanguage(lang: string | null): Command;
```

It applies to the code block that contains the selection, normalises `lang` as above and keeps `meta`, and returns `false` when the selection isn't in a single code block. It keeps the code block's other attributes, such as ones an app's subclass adds. When the language and `meta` wouldn't change, it applies but dispatches nothing, so a toolbar doesn't create empty undo steps. It's what an app's menu calls, and it shares its transaction with the node view. No default keybinding.

This is the first command the package exports. `setCodeBlockLanguage(lang)` follows `prosemirror-commands`' naming (`setBlockType`, `toggleMark`) and keeps the command usable without access to the extension instance.

### Info string: inputs and outputs

Six review rounds found a bug in the info string handling nearly every time: tilde fences, backticks in `meta`, non-breaking spaces, character references, delimiters picked up by mark input rules. They have one root cause. Each way into or out of the document parses or writes the info string with its own rules, and the rules are a hand-written approximation of CommonMark. Each fix patched one path and left the rest, and several fixes introduced the next bug. This section replaces the approximations with one model and one parser.

#### The paths

| Path | Direction | Syntax |
|---|---|---|
| Markdown loaded with `pmu.parse` | in | Markdown |
| Markdown written with `pmu.serialize` | out | Markdown |
| A fence typed or pasted into a paragraph, then space or `Enter` | in | Markdown |
| The language field: typing, paste, drop, autocorrect, IME | in | literal |
| `setCodeBlockLanguage`, `setNodeAttribute`, JSON, collaboration | in | literal |
| Copy (`toDOM` → clipboard HTML) | out | literal |
| Paste of HTML from this editor or elsewhere (`parseDOM`) | in | literal |

#### Model

- **The attributes hold literal values:** `lang` and `meta` are what the info string *means*, never Markdown source. `a&b` is the three characters `a`, `&`, `b`. This is what mdast holds too.
- **Markdown-syntax inputs are decoded exactly as CommonMark decodes them:** a fence line, whether loaded from a file or typed into a paragraph, means what a CommonMark parser says it means, including backslash escapes and character references (```` ```c\# ```` is language `c#`).
- **Literal inputs are taken as they are:** the language field, the command, attributes and HTML `data-*` attributes. Typing `\#` in the field gives a language containing a backslash.
- **Output must round-trip:** for any attributes, serializing to Markdown and parsing back gives the same attributes, and so does `toDOM` followed by `parseDOM`.

#### One normalisation

A value is normalised once, on every read and write, by `codeBlockAttrs`. It defines exactly the values Markdown can represent, and nothing stricter:

- `lang` is cut at the first space, tab or line ending. These are the characters CommonMark splits the info string at. A non-breaking space doesn't split (```` ```js x ```` is the language `js x`), which is why an earlier cut at any Unicode whitespace was wrong. The empty string becomes `null`.
- `meta` loses leading spaces and tabs, which the parser would drop. The empty string becomes `null`. Trailing spaces and line endings stay: the parser keeps the former and the serializer encodes the latter as `&#xA;`, so both round-trip.
- `meta` without a `lang` is kept, as before.

The language field's own rule, which removes whitespace wherever it's typed, dropped or pasted, uses the same definition of whitespace.

#### Fence lines: use the parser

`fenceOnEnter` and the space input rule stop matching their own patterns. A helper checks that the text is a fence followed by at most one word, then parses it with remark (`unified().use(remarkParse)`, both already dependencies, created once) and accepts it only if the result is a single fenced `code` node:

```ts
function parseFenceLine(text: string): CodeBlockAttrs | null;
```

- **Fenced versus indented:** an unclosed fence parses to a `code` node with an empty value. Indented code (four spaces or a tab) parses to a `code` node whose value is the line, so it's rejected.
- **The text is read with `textBetween(…, "￼")`:** an image or hard break becomes a placeholder that stops the line from being a fence. That replaces the "contains only text" check.
- **Space trigger:** fires when the typed text ends in a space (it may be longer, e.g. "js " inserted by autocomplete), the cursor is at the end of the paragraph's text, the text before it has no whitespace after the fence's indent, and `parseFenceLine` accepts it. So ```` ```js ```` + space converts as now, and the language comes from the parser.
- **`Enter` trigger:** fires at the end of a paragraph that `parseFenceLine` accepts. Since that's a fence followed by at most one word, there's never a `meta`.

The two triggers can't disagree about what a fence is, and every corner case CommonMark defines comes for free:

| Text | Result |
|---|---|
| ```` ```js ````, `~~~~js`, ```` ````js ```` | `js` |
| `~~~~` | a fence without a language (the fence takes every tilde) |
| ```` ```a&amp;b ````, ```` ```a\_b ```` | `a&b`, `a_b` |
| ```` ```js x ```` | `js x` (NBSP isn't a separator) |
| ```` ``` a`b ````, ```` ```js ``` ```` | not a fence (a backtick in a backtick fence's info string) |
| ```` ``` js ````, `~~~ ~foo bar`, ```` ```js title=a.js ```` | prose: a space after the fence |
| four spaces or a tab before ```` ``` ```` | not a fence |

Parsing one line costs microseconds, and it only happens when the line starts with a fence.

#### Fence lines: keep mark input rules out

While a paragraph's text is a fence line, typing in it must not trigger the inline code, emphasis, strong or strikethrough input rules, which would strip delimiters from the language before the fence converts (`~~~a~b~c`, ```` ```foo_bar_baz ````).

`CodeBlockExtension` adds a guard input rule after its own fence rules. When the paragraph's text so far plus the typed text is a fence line according to `parseFenceLine`, the guard inserts the typed text itself and returns that transaction (with `undoable: false`). The typed text may be longer than one character, e.g. from autocomplete; a line ending (`Enter`) is handled as described below. It does so only if the document up to the cursor is exactly what the input rules saw before the typed text: an input method that replaces a range (autocorrect, spellcheck, Android keyboards) breaks that, and its input is left to the default handling, so the guard can't reproduce it wrongly. Input rules run in order and the first one that returns a transaction wins, so the mark rules never see it. A line that stops being a fence, e.g. ```` ``` a`b ````, isn't guarded, so inline code works there as CommonMark says it should.

- **Line endings:** `prosemirror-unified` passes `Enter` to the input rules as `"\n"` and then runs the keymap too. Only `Enter` at the end of the paragraph, where it converts the fence, is guarded, so `Enter` elsewhere doesn't dispatch an extra transaction. A guard that inserted `"\n"` would insert two line breaks, and a guard that ignored it would let a mark rule fire on a closing delimiter at the end of the language (```` ```a*b* ```` + `Enter` would become the language `ab`). So for `"\n"` the guard returns an empty transaction: the input counts as handled, so the mark rules don't run, and the keymap then converts the fence.
- **Order:** this relies on the guard running before the mark extensions' input rules. `prosemirror-unified` always runs node extensions' input rules before mark extensions', whatever order the extensions are listed in, so it holds for every extension list, `LinkExtension` included. A test lists the mark extensions first to make sure.
- **Keep the stricter inline code and strikethrough patterns:** they stay. They're correct CommonMark anyway.

#### Serialization: escape `&`

CommonMark decodes character references in an info string, so an unescaped `&` would turn a value containing something that looks like a reference into something else when read back (`title="&lt;x"` would become `title="<x"`). Since version 2.2.1, `mdast-util-to-markdown` escapes `&` in the four info-string constructs (`codeFencedLangGraveAccent`, `codeFencedLangTilde`, `codeFencedMetaGraveAccent`, `codeFencedMetaTilde`) whenever a `#` or a letter follows, so `a&amp;b` becomes `a\&amp;b`, and `a&b` becomes `a\&b` too. Checked against the parser:

| Value | Written | Read back |
|---|---|---|
| `a&amp;b` | `a\&amp;b` | `a&amp;b` |
| `a&b` | `a\&b` | `a&b` |
| `meta` `title="&lt;x"` | `title="\&lt;x"` | `title="&lt;x"` |
| `a\_b` | `a\\_b` | `a\_b` (already handled) |
| `a`b` | `a&#x60;b` | `a`b` (already handled) |
| `meta` `a↵b` | `a&#xA;b` | `a↵b` (already handled) |

#### HTML

- **Copy:** `toDOM` writes literal values, the browser encodes the HTML, and `parseDOM` reads literal values back, so the editor-to-editor round trip is exact.
- **Paste from elsewhere:** `parseDOM` reads the language from the first usable source: `data-language`, `data-lang` (Hugo, Chroma), then a `language-*` or `lang-*` class (Prism, highlight.js, Prettify) on the `pre` or its `code`. Each candidate goes through the normalisation and is skipped if it comes out empty.
- **Never the `lang` attribute:** HTML's `lang` is the natural language of the content (`lang="en"`), so reading it would turn English prose into an `en` code block.
- **`meta` only comes from `data-meta`:** no other source has one.

#### Not covered

- **Plain-text clipboard:** copying a code block puts only the code on the clipboard as plain text, and pasting plain text inserts it as it is, without reading Markdown. A Markdown clipboard in both directions would carry the info string, but it belongs in `prosemirror-unified`, for every construct.
- **Highlighter markup without a language:** HTML from GitHub, VS Code and similar tools marks the language in its own structure, or not at all. Such pastes give a code block without a language.

#### Testing

- **Differential:** for every opening fence line in the CommonMark spec's fenced code examples, plus the cases above, `Enter` gives the attributes the parser gives if the line is a fence followed by at most one word, and doesn't convert otherwise.
- **Round trip:** a table of awkward values (`&` with and without a reference, backslashes, backticks, tildes, NBSP, line endings and trailing spaces in `meta`, non-ASCII) survives Markdown and `toDOM`/`parseDOM`.
- **Guard:** in the full `MarkdownExtension` and `GFMExtension`, typing ```` ```a*b*c ````, ```` ```foo_bar_baz ````, ```` ```a**b** ````, `~~~a~b~c` and `~~~a`b`c` then space or `Enter` keeps the language intact, and `Enter` inserts exactly one line break.
- **Paste:** HTML with each language source, with `lang="en"`, and with empty or whitespace-only values.

#### Decisions

1. **Space after a language still converts**, as in Tiptap. A `meta` can't be typed, but it's rarely typed, and this is what users of other editors expect.
2. **A typed fence line decodes escapes and character references**, because it's Markdown syntax: ```` ```c\# ```` is the language `c#`, as in a Markdown file. Taking it literally would need a second parser path and give different results for the same text depending on how it got into the document.
3. **`parseDOM` reads the sources listed above.** GitHub's `highlight-source-*` classes on a wrapping `div` name grammars (`source-shell`), not languages, so they're left out.

## Testing

`toTransformCommand` joins the declarative matchers in `tests/utils/matchers.ts` for commands. `renderNodeView` installs the input-rule and keymap plugins so that node view tests can exercise `ArrowUp` and `ArrowLeft`. jsdom has no layout, so `endOfTextblock` is always `true` there; the newline check is what the tests cover.
