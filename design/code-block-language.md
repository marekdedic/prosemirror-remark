# Design: code block language and meta

Status: accepted; implemented

## Problem

A fenced code block has an info string: a language and, after it, a `meta` (```` ```js title="a.js" ```` has the language `js` and the `meta` `title="a.js"`). The `code_block` node has to keep both, or they're lost when Markdown is parsed, ```` ```js ```` serializes as ```` ``` ```` ([#1119](https://github.com/marekdedic/prosemirror-remark/issues/1119)), and CommonMark spec examples 24, 34, 142, 143, 144 and 146 fail.

Keeping them isn't enough on its own. An info string that can only come from loaded Markdown is half a feature: users also need to add, change and remove the language and the `meta` while editing ([#1182](https://github.com/marekdedic/prosemirror-remark/issues/1182)).

## Goals

- `lang` and `meta` survive a parse/serialize round trip, and copy and paste inside the editor.
- Users can set, change and remove the language and the `meta` in the editor without the app building any UI.
- Users can type a language when creating a code block with ```` ``` ````.
- Apps can set the language and the `meta` from their own UI (a menu, a picker, a command palette).
- Rendering follows `design/custom-ui.md`: a documented DOM contract, defaults in `style.css`, and node views that apps can replace.

## Non-goals

- Syntax highlighting. It's a user node view or plugin, keyed on `data-language`.
- A list of known languages, validation against one, or autocomplete. Markdown accepts any word as a language.
- Understanding the `meta`. It's an opaque string, see [Meta](#meta).
- Typing a `meta` with the fence, see [Input rules](#input-rules).

## Design

### Schema

`code_block` has two attributes that mirror mdast:

```ts
attrs: { lang: { default: null }, meta: { default: null } }
```

Both are `string | null`. `null` means no value. Every write goes through one normalisation:

- `lang` loses leading whitespace and is cut at the first space, tab or line ending, the characters CommonMark splits an info string at. A language containing one would be read back as `lang` plus `meta`, so it can't round-trip. An empty result becomes `null`.
- `meta` loses leading spaces and tabs, which the parser drops. An empty result becomes `null`.
- `meta` is kept when `lang` is `null`, even though `mdast-util-to-markdown` writes `meta` only after a `lang`, so it's left out of the Markdown until a language is set. Clearing it instead would lose it whenever the language is retyped, which passes through an empty field. Keeping the two in agreement would need the node view to remember the `meta` outside the document, which loses it on blur, undo and redo, and misses changes an app makes in the meantime.

See [Info string: inputs and outputs](#info-string-inputs-and-outputs) for why exactly these rules, and how every path in and out of the document uses them.

### Conversion

- **unist → ProseMirror:** `lang` and `meta` are copied from the `code` node, with `undefined` becoming `null`.
- **ProseMirror → unist:** `lang` and `meta` go through the normalisation once more, as they do in `toDOM`, the node view and the commands, since apps can set the attributes directly (with `setNodeAttribute`) or load them from JSON, and are emitted only when they aren't `null`. A code block with a language is always written fenced; `MarkdownExtension` sets `fences: true`.

### DOM contract

`toDOM` mirrors the HTML that CommonMark itself renders for a code block (`<pre><code class="language-js">`), plus this package's class and state attributes:

```html
<pre class="prosemirror-remark-code-block" data-language="js" data-meta="title=a.js">
  <code class="language-js">…</code>
</pre>
```

- `data-language` and `data-meta` are omitted when the value is `null`.
- `language-*` on the `code` element is the convention that highlighters (Prism, highlight.js) and other editors look for. It makes the clipboard useful outside the editor. It isn't a `prosemirror-remark-` class because the default stylesheet doesn't select it.
- `data-meta` exists so that `meta` survives copy and paste. The default stylesheet doesn't select it.

`parseDOM` takes `lang` from the first of these that isn't empty after normalisation, so an empty or whitespace-only value doesn't hide the next one:

1. `data-language` on the `pre`.
2. `data-lang` on the `pre` or its `code` child (Hugo, Chroma).
3. A `language-*` or `lang-*` class on the `pre`, then on its `code` child (Prism, highlight.js, Prettify, other Markdown renderers). `language-none`, which Prism uses for a block without a language, means no language.

It never reads the `lang` attribute, which is the natural language of the content. It takes `meta` from `data-meta`, and both go through the normalisation above. The content is all the text in the `pre`: taking only a `code` child would silently drop code from HTML that has one `code` per line or text beside it. A separate rule ignores the node view's tab (`div.prosemirror-remark-code-block-info`), so its "Language:" and "Meta:" text doesn't end up in the code if an app parses the editor's own HTML.

### Node view

`CodeBlockExtension` ships a node view, as `TaskListItemExtension` does for its checkbox. It adds a tab with two fields before the code:

```html
<pre class="prosemirror-remark-code-block" data-language="js" data-meta="title=a.js">
  <div class="prosemirror-remark-code-block-info" contenteditable="false">
    <label class="prosemirror-remark-code-block-language">
      <span class="prosemirror-remark-code-block-language-label">Language:</span>
      <input type="text" value="js" placeholder="none" spellcheck="false" dir="auto">
    </label>
    <label class="prosemirror-remark-code-block-meta">
      <span class="prosemirror-remark-code-block-meta-label">Meta:</span>
      <input type="text" value="title=a.js" placeholder="none" spellcheck="false" dir="auto">
    </label>
  </div>
  <code class="language-js">…</code>  <!-- contentDOM -->
</pre>
```

Each field has its own `label`, since a `label` focuses only its first control. The visible "Language:" and "Meta:" texts describe the fields, give them their accessible names and focus them when clicked. "Meta" is the name mdast, remark and most Markdown tools use. Both texts are English; translating them is [#1180](https://github.com/marekdedic/prosemirror-remark/issues/1180). Apps that want other wording, or no text, hide it with CSS or replace the node view. Both fields are always shown, empty with the placeholder "none" when there's no value.

The tab is a control in the sense of `design/custom-ui.md`: it carries no document content, isn't part of any rendered Markdown, and so isn't in `toDOM`. Putting disabled inputs into every copied code block would leak editor UI into other apps. Apart from the tab, the node view renders the same elements, classes and `data-*` attributes as `toDOM`.

Apps that want a dropdown, a combobox with known languages, or highlighting replace the node view with `nodeViews: { ...pmu.nodeViews(), code_block: myView }`, as with the task list.

#### Both fields

`CodeBlockField` implements what the two fields share. Each field supplies its attribute, how its value is shown, its normalisation and its rules for what it can hold.

- **Every edit is committed** with the same transaction as the matching command (`setNodeAttribute` on `lang` or `meta`, which keeps the other attributes), not just the one on blur. The document, and anything the app autosaves from it, is then always current, and `prosemirror-history` groups the keystrokes into one undo step. Commits are skipped while an IME composition is in progress (a composition that some input methods end with a blur instead of `compositionend` is committed on blur), and a change from elsewhere during one (a collaborator editing the code) doesn't overwrite the field, which would cancel the composition. Clearing the language keeps `meta`, so retyping ```` ```js title="a.js" ```` as `ts` keeps the title.
- **What a field can't hold** is handled the same way in both: typed or pasted text arrives as a cancellable `beforeinput` (`insertText`, `insertFromPaste`) whose `data` is the text, in Chromium, Firefox and WebKit, and is replaced at the caret, so the rest of the field and the caret position are left alone. What arrives any other way (drag and drop, autocorrect) is removed wherever it is, keeping the caret in place. The field then always shows what will be saved.
- **Keys with a modifier** (Shift, Ctrl, Alt, Meta) are always left to the field, so Shift-`ArrowUp` selects within it instead of leaving it. The exception is undo and redo (`Mod-Z`, `Mod-Shift-Z`, `Mod-Y`, where `Mod` is Cmd on macOS and Ctrl elsewhere, recognised by the key's position on non-Latin layouts, as ProseMirror's keymap does): `stopEvent` lets them through to ProseMirror, so they undo the editor's history, which already holds every change to the fields, rather than the input's own history, which would diverge from it. The input's own undo and redo (`historyUndo`, `historyRedo`) are cancelled too, so that when the editor's history has nothing to undo, `Mod-Z` doesn't fall through to the field and create a new change in the middle of an undo.
- **`Enter`'s default** is always cancelled, with or without modifiers, since `Enter` in a lone input would submit an enclosing form. The `Enter` that confirms an IME composition is ignored, also in Safari, which reports it after the composition has ended with the key code 229.
- **`dir="auto"`:** each field's direction follows its own first strong character. Language names are left-to-right text, so in a right-to-left editor the language field stays left-to-right. A `meta` can hold natural-language text, such as a Hebrew `title`, and then is right-to-left.
- **In a read-only editor** (`view.editable === false`), the inputs are `readOnly`, so they look and are announced as read-only. A node view isn't updated when only the editor's `editable` prop changes, so a field syncs `readOnly` whenever it renders and whenever it gets focus, before it can be typed into or announced. Edits that get past that are still ignored.
- **`update(node)`** updates `data-language`, `data-meta` and the `language-*` class in place, from the same helper `toDOM` uses, so the two can't diverge, and sets each input's value only if it differs. Because the node view isn't re-created, the inputs keep their focus and caret while the user types.
- **`stopEvent`** returns `true` for events inside the tab, and **`ignoreMutation`** returns `true` for mutations inside it, so ProseMirror leaves the inputs alone.
- **Other windows:** the node view creates its elements in the editor's own document and checks events and nodes without `instanceof`, so it works in an iframe, where those come from another window than the global classes.

#### The language field

- **Whitespace can't be typed.** Of typed or pasted text that contains whitespace, such as predictive text or autocomplete inserting "python " or "objective c", only the first word is inserted. A paste of only whitespace changes nothing, rather than deleting the selected text. Whitespace means what the normalisation means: spaces, tabs and line endings, not a non-breaking space. Whitespace that arrives any other way is removed wherever it is, rather than cutting the field at it.
- **A typed space at the end of a language** moves to the start of the `meta` field, as in the info string. It's recognised as a `beforeinput` of type `insertText` whose `data` is a single space, not as a keydown, so on-screen keyboards that send no key events work too. A space anywhere else does nothing, and so does a space in an empty field: a `meta` typed after it wouldn't be saved without a language.

#### The `meta` field

- **Spaces and tabs can be typed and pasted.** Leading spaces and tabs, which the normalisation removes, are removed from the field as they arrive.
- **Line endings** can't be shown in an `<input>`, whose value drops them. The field shows each one as a space. A `meta` the user doesn't edit keeps its line endings, since the field only commits on an edit. An edit commits what the field shows, so the line endings become spaces. Pasted line endings become spaces too.
- **`Backspace`** without modifiers at the start of the field moves to the end of the language field without deleting anything, also when the field has text. Some Android keyboards don't report `Backspace` as a key; the backward arrow does the same there.

#### Moving between the fields and the code

"Forward" and "backward" for `ArrowLeft` and `ArrowRight` follow the tab's direction, as on the code side: in a right-to-left tab, `ArrowRight` goes backward. Which edge of a field's text a key leaves at follows the field's own direction. Using one direction for both would make `ArrowRight` bounce between left-to-right fields and right-to-left code.

| Where | Key | Goes to |
|---|---|---|
| Language field, at the end of its non-empty text, nothing selected | a typed space | `meta` field, at the start |
| Language field, at its forward edge | forward arrow | `meta` field, at its edge on that side |
| Language field, at its backward edge | backward arrow | block above, at its end |
| `meta` field, at the start of its text, nothing selected | `Backspace` | language field, at the end |
| `meta` field, at its backward edge | backward arrow | language field, at its edge on that side |
| `meta` field, at its forward edge | forward arrow | code, at the start |
| either field | `ArrowUp` | block above, at its end |
| either field | `ArrowDown`, `Enter`, `Escape` | code, at the start |
| code, at its very start | backward arrow | `meta` field, at its edge on that side |
| code, first line | `ArrowUp` | language field, at the end |

- **The caret, after an arrow key,** goes to the field's edge on the side the key comes from, which the field's own direction decides: the forward arrow in a left-to-right tab lands at the start of a left-to-right field, but at the end of a right-to-left one, such as a `meta` that starts with Hebrew text. Placing it by logical position would make the next arrow key leave a right-to-left field at once, so it couldn't be crossed. The keymap commands and the node view share one helper for this, `focusCodeBlockField`.
- **With no block above,** the keys that go there leave the focus where it is.
- **A field the app hides** with CSS can't take the focus, and is skipped: the forward arrow from the language field then goes to the code, and the backward arrow from the code to the language field.
- **From the code,** the field sits above the code and before it, so both keys go where the caret would naturally go next. The backward arrow lands in the `meta` field, the field next to the code. `ArrowUp` lands in the language field, so moving up through the document passes through the start of the tab on its way to the block above. The backward arrow is `ArrowLeft` in left-to-right code and `ArrowRight` in right-to-left code: ProseMirror's `view.endOfTextblock()` decides which, visually, so left-to-right code in a right-to-left editor works too. In an empty code block both keys would leave it, so there the code element's computed direction decides. "First line" means the first visual row: the command checks that no newline precedes the caret and that `view.endOfTextblock("up")` holds, so in a wrapped first line `ArrowUp` from its second row still moves within the code.
- **The keys from the code are one keymap command** per direction, which tries its fields in order: the `meta` field and then the language field for the backward arrow, and only the language field for `ArrowUp`. It finds a field through `findControlInput`, which takes a path of classes, one per level. It applies only with the node view enabled, the editor editable and a field able to take focus (focus is checked against `view.root`, so this works inside a shadow root); otherwise the keys behave as usual.

### Default stylesheet

```css
.prosemirror-remark-code-block > code {
  background: rgb(127 127 127 / 12%);
  border-radius: 0.375em;
  display: block;
  overflow-x: auto;
  padding: 0.75em 1em;
}

.prosemirror-remark-code-block-info + code {
  border-start-start-radius: 0;
}

.prosemirror-remark-code-block-info {
  background: rgb(127 127 127 / 12%);
  border-radius: 0.375em 0.375em 0 0;
  box-sizing: border-box;
  display: flex;
  font-size: 0.8em;
  line-height: 1;
  max-width: 100%;
  padding: 0 1.25em;
  width: max-content;
}

.prosemirror-remark-code-block-language,
.prosemirror-remark-code-block-meta {
  display: flex;
  padding: 0.5em 0 0.4em;
}

.prosemirror-remark-code-block-language {
  min-width: 0;
}

.prosemirror-remark-code-block-meta {
  flex: 0 1000 auto;
  margin-inline-start: 1.25em;
  min-width: 0;
}

.prosemirror-remark-code-block-language-label,
.prosemirror-remark-code-block-meta-label {
  flex: none;
  margin-inline-end: 0.5em;
  opacity: 0.55;
}

.prosemirror-remark-code-block-language > input,
.prosemirror-remark-code-block-meta > input {
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  min-width: 0;
  outline: none;
  padding: 0;
  text-align: -webkit-match-parent;
  text-align: match-parent;
}

.prosemirror-remark-code-block-language > input:not(:focus),
.prosemirror-remark-code-block-meta > input:not(:focus) {
  text-overflow: ellipsis;
}

.prosemirror-remark-code-block-language:focus-within,
.prosemirror-remark-code-block-meta:focus-within {
  box-shadow: inset 0 -2px rgb(127 127 127 / 50%);
}

.prosemirror-remark-code-block:not([data-language])
  .prosemirror-remark-code-block-meta
  > input {
  opacity: 0.55;
}
```

The tab is attached to the block's top corner on its start side (top-left in left-to-right text), so it's clearly tied to its code block however wide the block is. A tab in the top-right corner would end up far from short code in a wide editor, and it wouldn't be clear which block it belongs to.

The `code` element, not the `pre`, draws the block: a background and padding, so it's visible as a block. The tab sits above it inside the `pre`, in normal flow, with the same background. Being in flow, the tab makes its own room, so it can't cover the content above. Placing the tab outside the block with `position: absolute` would instead need the `pre` to reserve room for it with a top margin, applied only when the tab is there through `:has()`, so browsers without `:has()` (Firefox before 121) would let the tab overlap the content above. The block's top-left corner is square only when the tab is right before it (`.prosemirror-remark-code-block-info + code`), so the fields read as part of the block rather than as a line of text above it, and code blocks rendered without the node view, such as `toDOM` output in a read-only preview, get an ordinary rounded block.

- **Layout:** the tab lays the two fields out in a row and is only as wide as its content (`width: max-content`), and never wider than the block. A tab as wide as the block, with the `meta` field taking the rest of the line, would make every tab as wide as the block, losing the corner tab's tie to short code.
- **Field width:** each field is sized to its content by the node view, through the input's `size` attribute (`field-sizing: content` isn't supported everywhere).
- **Long values:** the `meta` field shrinks first, and the language field only once the `meta` field can't, through their shrink factors. While a field isn't focused, a value too long for the space left ends with an ellipsis; while it's focused, the input scrolls as inputs do, so the whole value can be edited.
- **Focus:** the inputs' own focus outline is replaced by an underline on the focused field's `label`, so it shows which field has focus.
- **A `meta` that won't be saved is greyed out:** in a block without a language, the `meta` input has a lower opacity. It relies on `data-language`, so the DOM contract needs no attribute of its own for it. Greying reads as "not in effect", where striking through would read as deleted. It's visual only; telling screen reader users too would need an attribute the node view keeps up to date.
- **Colours:** the background is a translucent grey, so it works on light and dark pages alike. A page that styles `pre` with a background shows it behind the tab as well.
- **Scrolling:** the `code` scrolls horizontally, so a line that can't wrap (an unbreakable word, or any line when a page sets `white-space: pre`) stays within the block instead of running out of it. Since the `code` is both the block and the scroll container, scrolled text runs up to the block's edge rather than stopping at its padding.
- **Always visible:** the tab is shown also without a language, when it reads "Language: none". A tab shown only while the block is hovered would make the fields undiscoverable and impossible to reach on touch screens.
- **Without the stylesheet,** the tab is a plain block, so both fields sit on their own line above the code. That's plain, but it works.

**Right-to-left text.** The tab sits at the `pre`'s start side: on the right in a right-to-left editor. The square corner (`border-start-start-radius`) and the gaps between the fields and after the labels (`margin-inline-start`, `margin-inline-end`) are logical properties, so they follow it. The corner follows the `code`'s direction and the tab the `pre`'s, so an app that changes the direction of code blocks has to set it on the `pre`, not the `code`. A left-to-right field in a right-to-left tab has its value aligned to the tab's start (`text-align: match-parent`, preceded by `-webkit-match-parent` for Chrome and Edge, which only support the prefixed value), next to its label. The direction of the code itself is left to the app; browsers render left-to-right code in a right-to-left `pre` with its punctuation at the wrong end, which apps usually fix with `direction: ltr` on the `pre`.

### Input rules

A paragraph turns into a code block when its whole text is an opening fence followed by:

- **a space:** an input rule like `textblockTypeInputRule`, which fires when the space follows a fence and a language with no whitespace in between, at the end of the paragraph.
- **`Enter`:** a keymap command, chained before `liftOutOfCodeBlock`, which runs at the end of a paragraph that is a fence line.

Whether the text is a fence line, and what its language is, is decided by the CommonMark parser, see [Fence lines: use the parser](#fence-lines-use-the-parser). Both triggers apply only where a code block may replace the paragraph (not, for example, in the first paragraph of a task list item). They apply only in paragraphs: as in CommonMark, `# ```` ` is a heading, so a heading whose text is a fence stays a heading. `prosemirror-unified` does pass `Enter` to input rules as `"\n"`, but the key then still reaches the keymap and inserts a newline into the new code block, so the input rule matches a space only.

So ```` ``` ```` followed by space or `Enter` makes a code block without a language, and ```` ```js ```` followed by space or `Enter` makes a `js` one, for `~~~` fences and longer fences too. ```` ``` ```` alone doesn't convert: converting on the third backtick would leave no way to type a language.

A `meta`, or spaces between the fence and the language, can't be typed, since the first space already converts the paragraph. So both triggers only accept a fence followed by at most one word, with no space or tab after the fence: a paragraph like ```` ``` is how you open a fence ```` is prose, even though CommonMark would read it as a fence with a `meta`. Converting such paragraphs on `Enter`, for pasted fence lines with a `meta`, would turn existing prose into code blocks when the user only means to start a new paragraph. Tiptap's code block input rule works the same way. The `meta` field is how a `meta` is added.

Since the fence converts only after the language, the mark input rules get to see a half-typed fence first. A guard rule keeps them out, see [Fence lines: keep mark input rules out](#fence-lines-keep-mark-input-rules-out). The inline code and strikethrough patterns are also strict: their content can't start or end with a backtick (respectively a tilde), which is what CommonMark requires of a single-delimiter code span or strikethrough, since such a delimiter would just make the run longer. Tests type the fences into the full `MarkdownExtension` and `GFMExtension`, so these interactions are covered.

The four-space rule applies only in a paragraph, like the fence triggers, so a heading stays a heading. It matches exactly four spaces (or non-breaking spaces, which browsers may produce for a typed space when input is read back from the DOM, as on Android; the space trigger accepts one too), not any four whitespace characters, so three spaces + `Enter` (passed to the input rules as `"\n"`) don't make a code block. Indented code has no info string.

### Commands

```ts
export function setCodeBlockLanguage(lang: string | null): Command;
export function setCodeBlockMeta(meta: string | null): Command;
```

Each applies to the code block that contains the selection, or a selected code block, and returns `false` when the selection isn't in a single code block. Each normalises its value as above, where `null` or a value that's empty after normalisation removes it, and keeps the other attribute and any others, such as ones an app's subclass adds. When the normalised value wouldn't change, a command applies but dispatches nothing, so a toolbar doesn't create empty undo steps. `setCodeBlockMeta` works whether or not the block has a language. They're what an app's menu calls, and they share their transactions with the node view's fields. No default keybindings.

The names follow `prosemirror-commands`' naming (`setBlockType`, `toggleMark`), and the commands are usable without access to the extension instance. There's no combined `setCodeBlockInfo(lang, meta)`: an app that sets both runs both commands, which `prosemirror-history` groups into one undo step when they follow each other closely.

### Meta

The `meta` is an opaque string. Tools disagree on what it contains: Docusaurus reads `title="…"` and `{1,3-5}`, Shiki and the rehype plugins use their own forms (`showLineNumbers`, `mark=…`). Understanding one convention would get the others wrong, so the package only stores, edits and writes the string. Apps parse `meta` or `data-meta` themselves.

### Info string: inputs and outputs

Every way into or out of the document reads or writes the info string with the same model and the same parser. Separate hand-written approximations of CommonMark per path disagree on the corner cases (tilde fences, backticks in `meta`, non-breaking spaces, character references, delimiters picked up by mark input rules), and fixing one path leaves the others.

#### The paths

| Path | Direction | Syntax |
|---|---|---|
| Markdown loaded with `pmu.parse` | in | Markdown |
| Markdown written with `pmu.serialize` | out | Markdown |
| A fence typed or pasted into a paragraph, then space or `Enter` | in | Markdown |
| The node view's fields: typing, paste, drop, autocorrect, IME | in | literal |
| `setCodeBlockLanguage`, `setCodeBlockMeta`, `setNodeAttribute`, JSON, collaboration | in | literal |
| Copy (`toDOM` → clipboard HTML) | out | literal |
| Paste of HTML from this editor or elsewhere (`parseDOM`) | in | literal |

#### Model

- **The attributes hold literal values:** `lang` and `meta` are what the info string *means*, never Markdown source. `a&b` is the three characters `a`, `&`, `b`. This is what mdast holds too.
- **Markdown-syntax inputs are decoded exactly as CommonMark decodes them:** a fence line, whether loaded from a file or typed into a paragraph, means what a CommonMark parser says it means, including backslash escapes and character references (```` ```c\# ```` is language `c#`).
- **Literal inputs are taken as they are:** the fields, the commands, attributes and HTML `data-*` attributes. Typing `\#` in the language field gives a language containing a backslash.
- **Output must round-trip:** for any attributes, serializing to Markdown and parsing back gives the same attributes, and so does `toDOM` followed by `parseDOM`.

#### One normalisation

A value is normalised on every read and write, by `codeBlockAttrs`. It defines exactly the values Markdown can represent, and nothing stricter:

- `lang` is cut at the first space, tab or line ending. These are the characters CommonMark splits the info string at. A non-breaking space doesn't split (```` ```js x ```` is the language `js x`), so cutting at any Unicode whitespace would be wrong. The empty string becomes `null`.
- `meta` loses leading spaces and tabs, which the parser would drop. The empty string becomes `null`. Trailing spaces and line endings stay: the parser keeps the former and the serializer encodes the latter as `&#xA;`, so both round-trip.
- `meta` without a `lang` is kept.

The fields' own rules use the same definitions: the language field removes whitespace wherever it's typed, dropped or pasted, and the `meta` field removes leading spaces and tabs with the same helper as the normalisation.

#### Fence lines: use the parser

`fenceOnEnter` and the space input rule don't match their own patterns. A helper checks that the text is a fence followed by at most one word, then parses it with remark (`unified().use(remarkParse)`, created once) and accepts it only if the result is a single fenced `code` node:

```ts
function parseFenceLine(text: string): CodeBlockAttrs | null;
```

- **Fenced versus indented:** an unclosed fence parses to a `code` node with an empty value. Indented code (four spaces or a tab) parses to a `code` node whose value is the line, so it's rejected.
- **The text is read with `textBetween(…, "￼")`:** an image or hard break becomes a placeholder that stops the line from being a fence.
- **Space trigger:** fires when the typed text ends in a space (it may be longer, e.g. "js " inserted by autocomplete), the cursor is at the end of the paragraph's text, the text before it has no whitespace after the fence's indent, and `parseFenceLine` accepts it. The language comes from the parser.
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

#### Serialization: escape `&`

CommonMark decodes character references in an info string, so an unescaped `&` would turn a value containing something that looks like a reference into something else when read back (`title="&lt;x"` would become `title="<x"`). From version 2.2.1, `mdast-util-to-markdown` escapes `&` in the four info-string constructs (`codeFencedLangGraveAccent`, `codeFencedLangTilde`, `codeFencedMetaGraveAccent`, `codeFencedMetaTilde`) whenever a `#` or a letter follows, so `a&amp;b` becomes `a\&amp;b`, and `a&b` becomes `a\&b` too. Checked against the parser:

| Value | Written | Read back |
|---|---|---|
| `a&amp;b` | `a\&amp;b` | `a&amp;b` |
| `a&b` | `a\&b` | `a&b` |
| `meta` `title="&lt;x"` | `title="\&lt;x"` | `title="&lt;x"` |
| `a\_b` | `a\\_b` | `a\_b` |
| `a`b` | `a&#x60;b` | `a`b` |
| `meta` `a↵b` | `a&#xA;b` | `a↵b` |

#### HTML

- **Copy:** `toDOM` writes literal values, the browser encodes the HTML, and `parseDOM` reads literal values back, so the editor-to-editor round trip is exact.
- **Paste from elsewhere:** `parseDOM` reads the language from the first usable source: `data-language`, `data-lang` (Hugo, Chroma), then a `language-*` or `lang-*` class (Prism, highlight.js, Prettify) on the `pre` or its `code`. Each candidate goes through the normalisation and is skipped if it comes out empty.
- **Never the `lang` attribute:** HTML's `lang` is the natural language of the content (`lang="en"`), so reading it would turn English prose into an `en` code block.
- **`meta` only comes from `data-meta`:** no other source has one.

#### Not covered

- **Plain-text clipboard:** copying a code block puts only the code on the clipboard as plain text, and pasting plain text inserts it as it is, without reading Markdown. A Markdown clipboard in both directions would carry the info string, but it belongs in `prosemirror-unified`, for every construct.
- **Highlighter markup without a language:** HTML from GitHub, VS Code and similar tools marks the language in its own structure, or not at all. Such pastes give a code block without a language.

## Testing

`toTransformCommand` joins the declarative matchers in `tests/utils/matchers.ts` for commands. `renderNodeView` installs the input-rule and keymap plugins so that node view tests can exercise the keys that move between the code and the fields. jsdom has no layout, so `endOfTextblock` is always `true` there; the newline check is what the tests cover. Tests set directions with inline styles.

- **Differential:** for every opening fence line in the CommonMark spec's fenced code examples, plus the cases above, `Enter` gives the attributes the parser gives if the line is a fence followed by at most one word, and doesn't convert otherwise.
- **Round trip:** a table of awkward values (`&` with and without a reference, backslashes, backticks, tildes, NBSP, line endings and trailing spaces in `meta`, non-ASCII) survives Markdown and `toDOM`/`parseDOM`.
- **Guard:** in the full `MarkdownExtension` and `GFMExtension`, typing ```` ```a*b*c ````, ```` ```foo_bar_baz ````, ```` ```a**b** ````, `~~~a~b~c` and `~~~a`b`c` then space or `Enter` keeps the language intact, and `Enter` inserts exactly one line break.
- **Paste:** HTML with each language source, with `lang="en"`, with empty or whitespace-only values, and the editor's own HTML, whose tab is ignored.
- **Commands:** both commands set, change and remove their value, with and without the other one, normalise it, keep other attributes, and dispatch nothing for an unchanged value.
- **Fields:** typing, pasting (whitespace, tabs, leading whitespace, line endings), IME composition, read-only mode, undo and redo, and a `meta` with line endings that isn't edited staying as it is.
- **Navigation:** the rows of the table above, in a left-to-right and a right-to-left tab, with a right-to-left `meta`, and with a hidden `meta` field.

## Decisions

1. **Space after a language converts**, as in Tiptap. A `meta` can't be typed with the fence, but this is what users of other editors expect, and the `meta` field covers adding one.
2. **A typed fence line decodes escapes and character references**, because it's Markdown syntax: ```` ```c\# ```` is the language `c#`, as in a Markdown file. Taking it literally would need a second parser path and give different results for the same text depending on how it got into the document.
3. **`parseDOM` reads the sources listed above.** GitHub's `highlight-source-*` classes on a wrapping `div` name grammars (`source-shell`), not languages, so they're left out.
4. **A `meta` without a language stays in the document,** and is only left out of the Markdown, so nothing outside the document has to remember it.
5. **Two always visible fields** rather than one field for the whole info string. One field would mix two values under one label, and normalisation would fight the user: `js ` reads back as `js`, so the space would disappear as it's typed.
6. **One wrapper for the tab,** since two controls can't share one `label`.
7. **Two commands,** no combined one.
8. **The `meta` is opaque.**
