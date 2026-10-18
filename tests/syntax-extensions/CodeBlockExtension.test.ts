import type { NodeSpec, Node as ProseMirrorNode } from "prosemirror-model";

import { EditorState, NodeSelection, TextSelection } from "prosemirror-state";
import { describe, expect, test, vi } from "vitest";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { BreakExtension } from "../../src/syntax-extensions/BreakExtension";
import {
  CodeBlockExtension,
  setCodeBlockLanguage,
} from "../../src/syntax-extensions/CodeBlockExtension";
import { HeadingExtension } from "../../src/syntax-extensions/HeadingExtension";
import { ImageExtension } from "../../src/syntax-extensions/ImageExtension";
import { InlineCodeExtension } from "../../src/syntax-extensions/InlineCodeExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { LinkExtension } from "../../src/syntax-extensions/LinkExtension";
import { ListItemExtension } from "../../src/syntax-extensions/ListItemExtension";
import { StrikethroughExtension } from "../../src/syntax-extensions/StrikethroughExtension";
import { TaskListItemExtension } from "../../src/syntax-extensions/TaskListItemExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("CodeBlockExtension", () => {
  const fx = createExtensionFixture(new CodeBlockExtension());
  const fxInContext = createExtensionFixture(new CodeBlockExtension(), [
    new BreakExtension(),
    new HeadingExtension(),
    new ImageExtension(),
    new ListItemExtension(),
    new TaskListItemExtension(),
    new UnorderedListExtension(),
  ]);
  const fxMarksFirst = createExtensionFixture(new CodeBlockExtension(), [
    new BoldExtension(),
    new InlineCodeExtension(),
    new ItalicExtension(),
    new LinkExtension(),
    new StrikethroughExtension(),
  ]);

  test("handles the `code` unist node", () => {
    expect(fx).toHandleUnistNode("code");
  });

  test("provides the `code_block` ProseMirror node", () => {
    expect(fx).toProvideNode("code_block");
  });

  describe("matches unist nodes", () => {
    test("matches `code`", () => {
      expect(fx).toMatchUnistNode({ type: "code", value: "Hello World!" });
    });

    test("matches `code` with a language", () => {
      expect(fx).toMatchUnistNode({
        lang: "ts",
        type: "code",
        value: "Hello World!",
      });
    });

    test("matches `code` with a language and meta", () => {
      expect(fx).toMatchUnistNode({
        lang: "ts",
        meta: "startline=2",
        type: "code",
        value: "Hello World!",
      });
    });

    test("does not match `code_block`", () => {
      expect(fx).not.toMatchUnistNode({ type: "code_block" });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("empty", () => {
      expect(fx).toConvertUnistNode({ type: "code", value: "" }, (b) => [
        b.code_block(),
      ]);
    });

    test("empty with a language", () => {
      expect(fx).toConvertUnistNode(
        { lang: "ts", type: "code", value: "" },
        (b) => [b.code_block({ lang: "ts" })],
      );
    });

    test("plain", () => {
      expect(fx).toConvertUnistNode(
        { type: "code", value: "Hello World!" },
        (b) => [b.code_block("Hello World!")],
      );
    });

    test("with a language", () => {
      expect(fx).toConvertUnistNode(
        { lang: "ts", type: "code", value: "Hello World!" },
        (b) => [b.code_block({ lang: "ts" }, "Hello World!")],
      );
    });

    test("with a language and meta", () => {
      expect(fx).toConvertUnistNode(
        {
          lang: "ts",
          meta: "startline=2",
          type: "code",
          value: "Hello World!",
        },
        (b) => [
          b.code_block({ lang: "ts", meta: "startline=2" }, "Hello World!"),
        ],
      );
    });

    test("with meta without a language", () => {
      expect(fx).toConvertUnistNode(
        { meta: "startline=2", type: "code", value: "Hello" },
        (b) => [b.code_block({ meta: "startline=2" }, "Hello")],
      );
    });
  });

  describe("matches ProseMirror nodes", () => {
    test("empty", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.code_block());
    });

    test("with content", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.code_block("Hello World!"));
    });

    test("with a language", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.code_block({ lang: "ts" }, "Hello World!"),
      );
    });

    test("with a language and meta", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.code_block({ lang: "ts", meta: "startline=2" }, "Hello World!"),
      );
    });
  });

  describe("converts ProseMirror -> unist", () => {
    test("empty", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.code_block(),
        [{ type: "code", value: "" }],
      );
    });

    test("with content", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.code_block("Hello World!"),
        [{ type: "code", value: "Hello World!" }],
      );
    });

    test("with a language", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.code_block({ lang: "ts" }, "Hello World!"),
        [{ lang: "ts", type: "code", value: "Hello World!" }],
      );
    });

    test("with a language and meta", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) =>
          b.code_block({ lang: "ts", meta: "startline=2" }, "Hello World!"),
        [
          {
            lang: "ts",
            meta: "startline=2",
            type: "code",
            value: "Hello World!",
          },
        ],
      );
    });

    test("with meta without a language", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.code_block({ meta: "x=1" }, "Hello"),
        [{ meta: "x=1", type: "code", value: "Hello" }],
      );
    });
  });

  describe("normalises the language when converting to unist", () => {
    test("cuts the language at whitespace", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.code_block({ lang: "foo bar" }, "Hello"),
        [{ lang: "foo", type: "code", value: "Hello" }],
      );
    });
  });

  describe("normalises the language", () => {
    test("drops an empty language", () => {
      expect(fx).toConvertUnistNode(
        { lang: "", type: "code", value: "Hello" },
        (b) => [b.code_block("Hello")],
      );
    });

    test("cuts the language at whitespace", () => {
      expect(fx).toConvertUnistNode(
        { lang: " ts x ", type: "code", value: "Hello" },
        (b) => [b.code_block({ lang: "ts" }, "Hello")],
      );
    });
  });

  describe("input rules", () => {
    test("``` followed by a space", () => {
      expect(fx).toTransformBlockInput(
        "``` Hello",
        (b) => [b.code_block("Hello")],
        "```\nHello\n```",
      );
    });

    test("``` followed by Enter", () => {
      expect(fx).toTransformBlockInput(
        "```{Enter}Hello",
        (b) => [b.code_block("Hello")],
        "```\nHello\n```",
      );
    });

    test("``` with a language followed by a space", () => {
      expect(fx).toTransformBlockInput(
        "```js Hello",
        (b) => [b.code_block({ lang: "js" }, "Hello")],
        "```js\nHello\n```",
      );
    });

    test("``` with a language followed by Enter", () => {
      expect(fx).toTransformBlockInput(
        "```js{Enter}Hello",
        (b) => [b.code_block({ lang: "js" }, "Hello")],
        "```js\nHello\n```",
      );
    });

    test("~~~ with a language containing a backtick", () => {
      expect(fx).toTransformBlockInput(
        "~~~j`s Hello",
        (b) => [b.code_block({ lang: "j`s" }, "Hello")],
        "```j&#x60;s\nHello\n```",
      );
    });

    test("a longer ``` fence with a language", () => {
      expect(fx).toTransformBlockInput(
        "````js Hello",
        (b) => [b.code_block({ lang: "js" }, "Hello")],
        "```js\nHello\n```",
      );
    });

    test.each(["~~~~ Hello", "~~~~{Enter}Hello"])(
      "a longer ~~~ fence %j has no language",
      (input) => {
        expect(fx).toTransformBlockInput(
          input,
          (b) => [b.code_block("Hello")],
          "```\nHello\n```",
        );
      },
    );

    test.each(["~~~~js Hello", "~~~~js{Enter}Hello"])(
      "a longer ~~~ fence %j with a language",
      (input) => {
        expect(fx).toTransformBlockInput(
          input,
          (b) => [b.code_block({ lang: "js" }, "Hello")],
          "```js\nHello\n```",
        );
      },
    );

    test("a fence indented by a tab does not convert on space", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("\t```js<cursor>")],
        "cursor",
        " ",
        (b) => [b.p("\t```js ")],
        "&#x9;\\`\\`\\`js&#x20;",
      );
    });

    test("a fence does not convert on space with text after the cursor", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("```js<cursor>hello")],
        "cursor",
        " ",
        (b) => [b.p("```js hello")],
        "\\`\\`\\`js hello",
      );
    });

    test("a fence followed by a non-breaking space converts", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("```js<cursor>")],
        "cursor",
        "\u00a0",
        (b) => [b.code_block({ lang: "js" })],
        "```js\n```",
      );
    });

    test("four non-breaking spaces convert", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "\u00a0\u00a0\u00a0\u00a0",
        (b) => [b.code_block()],
        "```\n```",
      );
    });

    test("three spaces followed by Enter do not convert", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "   {Enter}Hello",
        (b) => [b.p("   "), b.p("Hello")],
        "&#x20; &#x20;\n\nHello",
      );
    });

    test.each([
      ["```foo_bar_baz Hello", "foo_bar_baz", "```foo_bar_baz"],
      ["```a*b*{Enter}Hello", "a*b*", "```a*b*"],
      ["```a**b**c Hello", "a**b**c", "```a**b**c"],
      ["~~~a~b~{Enter}Hello", "a~b~", "```a~b~"],
      ["~~~a`b`c Hello", "a`b`c", "```a&#x60;b&#x60;c"],
    ])(
      "with the mark extensions listed first, %j keeps the language",
      (input, lang, fence) => {
        expect(fxMarksFirst).toTransformBlockInput(
          input,
          (b) => [b.code_block({ lang }, "Hello")],
          `${fence}\nHello\n\`\`\``,
        );
      },
    );

    test("``` alone does not convert", () => {
      expect(fx).toTransformBlockInput(
        "```js",
        (b) => [b.p("```js")],
        "\\`\\`\\`js",
      );
    });

    test("four spaces", () => {
      expect(fx).toTransformBlockInput(
        "    Hello World!",
        (b) => [b.code_block("Hello World!")],
        "```\nHello World!\n```",
      );
    });
  });

  describe("setCodeBlockLanguage", () => {
    test("sets the language", () => {
      expect(fx).toTransformCommand(
        (b) => [b.code_block("He<cursor>llo")],
        "cursor",
        setCodeBlockLanguage("js"),
        (b) => [b.code_block({ lang: "js" }, "Hello")],
        "```js\nHello\n```",
      );
    });

    test("changes the language and keeps the meta", () => {
      expect(fx).toTransformCommand(
        (b) => [b.code_block({ lang: "ts", meta: "x=1" }, "He<cursor>llo")],
        "cursor",
        setCodeBlockLanguage("js"),
        (b) => [b.code_block({ lang: "js", meta: "x=1" }, "Hello")],
        "```js x=1\nHello\n```",
      );
    });

    test("removes the language and keeps the meta", () => {
      expect(fx).toTransformCommand(
        (b) => [b.code_block({ lang: "ts", meta: "x=1" }, "He<cursor>llo")],
        "cursor",
        setCodeBlockLanguage(null),
        (b) => [b.code_block({ meta: "x=1" }, "Hello")],
        "```\nHello\n```",
      );
    });

    test("treats an empty language as none", () => {
      expect(fx).toTransformCommand(
        (b) => [b.code_block({ lang: "ts" }, "He<cursor>llo")],
        "cursor",
        setCodeBlockLanguage(" "),
        (b) => [b.code_block("Hello")],
        "```\nHello\n```",
      );
    });

    test("applies to a selected code block", () => {
      expect(fx).toTransformCommand(
        (b) => [b.code_block("Hello"), b.p("World")],
        "start",
        (state, dispatch) =>
          setCodeBlockLanguage("js")(
            state.apply(
              state.tr.setSelection(NodeSelection.create(state.doc, 0)),
            ),
            dispatch,
          ),
        (b) => [b.code_block({ lang: "js" }, "Hello"), b.p("World")],
        "```js\nHello\n```\n\nWorld",
      );
    });

    test("keeps other attributes of the code block", () => {
      class WrappingCodeBlockExtension extends CodeBlockExtension {
        public override proseMirrorNodeSpec(): NodeSpec {
          const spec = super.proseMirrorNodeSpec();
          return {
            ...spec,
            attrs: { ...spec.attrs, wrap: { default: false } },
          };
        }
      }

      expect(
        createExtensionFixture(new WrappingCodeBlockExtension()),
      ).toTransformCommand(
        (b) => [b.code_block({ lang: "js", wrap: true }, "He<cursor>llo")],
        "cursor",
        setCodeBlockLanguage("ts"),
        (b) => [b.code_block({ lang: "ts", wrap: true }, "Hello")],
        "```ts\nHello\n```",
      );
    });

    test("does not dispatch when nothing changes", () => {
      const doc = fx.b.doc(
        fx.b.code_block({ lang: "js", meta: "x=1" }, "Hello"),
      ) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        selection: TextSelection.create(doc, 2),
      });
      const dispatch = vi.fn();

      expect(setCodeBlockLanguage(" js ")(state, dispatch)).toBe(true);
      expect(dispatch).not.toHaveBeenCalled();
    });

    test("does not apply outside a code block", () => {
      expect(fx).not.toTransformCommand(
        (b) => [b.p("He<cursor>llo")],
        "cursor",
        setCodeBlockLanguage("js"),
        (b) => [b.p("Hello")],
        "Hello",
      );
    });
  });

  describe("keymap", () => {
    test("`Mod-Shift-\\` wraps a paragraph", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("He<cursor>llo")],
        "cursor",
        "{Mod-Shift-\\\\}",
        (b) => [b.code_block("Hello")],
        "```\nHello\n```",
      );
    });

    test("`Mod-Shift-\\` wraps only the current paragraph", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("He<cursor>llo"), b.p("World")],
        "cursor",
        "{Mod-Shift-\\\\}",
        (b) => [b.code_block("Hello"), b.p("World")],
        "```\nHello\n```\n\nWorld",
      );
    });

    test("`Enter` inserts a newline", () => {
      expect(fx).toTransformInput(
        (b) => [b.code_block("Hel<cursor>lo")],
        "cursor",
        "{Enter}",
        (b) => [b.code_block("Hel\nlo")],
        "```\nHel\nlo\n```",
      );
    });

    test("`Enter` at the end inserts a newline", () => {
      expect(fx).toTransformInput(
        (b) => [b.code_block("Hello<cursor>")],
        "cursor",
        "{Enter}",
        (b) => [b.code_block("Hello\n")],
        "```\nHello\n\n```",
      );
    });

    test("`Enter` after one trailing newline inserts another", () => {
      expect(fx).toTransformInput(
        (b) => [b.code_block("Hello<cursor>\n")],
        "cursor",
        "{Enter}",
        (b) => [b.code_block("Hello\n\n")],
        "```\nHello\n\n\n```",
      );
    });

    test("`Enter` after two trailing newlines exits the code block", () => {
      expect(fx).toTransformInput(
        (b) => [b.code_block("Hello\n\n<cursor>")],
        "cursor",
        "{Enter}",
        (b) => [b.code_block("Hello"), b.p()],
        "```\nHello\n```\n",
      );
    });
  });

  test.each([
    "``` js",
    "```  js  ",
    "```js title=a.js",
    "~~~js a`b",
    "``` is how you open a fence",
  ])(
    "`Enter` after %j, with a space after the fence, does not convert it",
    (text) => {
      expect(fx).toReportKeymapApplicability(
        (b) => [b.p(`${text}<cursor>`)],
        "cursor",
        "Enter",
        false,
      );
    },
  );

  test("inline formatting works in prose that starts with a fence", () => {
    expect(fxMarksFirst).toTransformInput(
      (b) => [b.p("``` is the fence and <cursor>")],
      "cursor",
      "**this** ",
      (b) => [b.p("``` is the fence and ", b.strong("this"), " ")],
      "\\`\\`\\` is the fence and **this**&#x20;",
    );
  });

  test("`Enter` after a backtick fence with a backtick in the meta does not apply", () => {
    expect(fxInContext).toReportKeymapApplicability(
      (b) => [b.p("```js a`b<cursor>")],
      "cursor",
      "Enter",
      false,
    );
  });

  test("`Enter` after a fence in a heading does not convert it", () => {
    expect(fxInContext).toReportKeymapApplicability(
      (b) => [b.heading({ level: 1 }, "```js<cursor>")],
      "cursor",
      "Enter",
      false,
    );
  });

  test("four spaces in a heading do not convert it", () => {
    expect(fxInContext).toTransformInput(
      (b) => [b.heading({ level: 1 }, "<cursor>Hello")],
      "cursor",
      "    ",
      (b) => [b.heading({ level: 1 }, "    Hello")],
      "# &#x20;   Hello",
    );
  });

  test("a space after a fence in a heading does not convert it", () => {
    expect(fxInContext).toTransformInput(
      (b) => [b.heading({ level: 1 }, "```js<cursor>")],
      "cursor",
      " ",
      (b) => [b.heading({ level: 1 }, "```js ")],
      "# \\`\\`\\`js&#x20;",
    );
  });

  describe("reports keymap applicability", () => {
    test("`Enter` after a fence where a code block isn't allowed does not apply", () => {
      expect(fxInContext).toReportKeymapApplicability(
        (b) => [b.ul(b.task_list_item(b.p("```js<cursor>")))],
        "cursor",
        "Enter",
        false,
      );
    });

    test("`Enter` after a fence following an image does not apply", () => {
      expect(fxInContext).toReportKeymapApplicability(
        (b) => [b.p(b.img({ src: "a.png" }), "```js<cursor>")],
        "cursor",
        "Enter",
        false,
      );
    });

    test("`Enter` after a fence following a hard break does not apply", () => {
      expect(fxInContext).toReportKeymapApplicability(
        (b) => [b.p(b.br(), "```js<cursor>")],
        "cursor",
        "Enter",
        false,
      );
    });

    test.each([
      ["a tab", "\t"],
      ["a non-breaking space", "\u00a0"],
      ["four spaces", "    "],
    ])("`Enter` after a fence indented by %s does not apply", (_, indent) => {
      expect(fxInContext).toReportKeymapApplicability(
        (b) => [b.p(`${indent}\`\`\`js<cursor>`)],
        "cursor",
        "Enter",
        false,
      );
    });

    test("`Enter` after a fence indented by three spaces applies", () => {
      expect(fxInContext).toReportKeymapApplicability(
        (b) => [b.p("   ```js<cursor>")],
        "cursor",
        "Enter",
        true,
      );
    });

    test("`Enter` after a fence in a paragraph applies", () => {
      expect(fxInContext).toReportKeymapApplicability(
        (b) => [b.p("```js<cursor>")],
        "cursor",
        "Enter",
        true,
      );
    });

    test("`Enter` applies after two trailing newlines", () => {
      expect(fx).toReportKeymapApplicability(
        (b) => [b.code_block("Hello\n\n<cursor>")],
        "cursor",
        "Enter",
        true,
      );
    });

    test("`Enter` does not apply without two trailing newlines", () => {
      expect(fx).toReportKeymapApplicability(
        (b) => [b.code_block("Hello\n<cursor>")],
        "cursor",
        "Enter",
        false,
      );
    });
  });

  describe("parses DOM", () => {
    test("without a language", () => {
      expect(fx).toParseDOM("<pre><code>Hello</code></pre>", (b) => [
        b.code_block("Hello"),
      ]);
    });

    test("with a language and meta", () => {
      expect(fx).toParseDOM(
        '<pre data-language="js" data-meta="x=1"><code>Hello</code></pre>',
        (b) => [b.code_block({ lang: "js", meta: "x=1" }, "Hello")],
      );
    });

    test("with a language class on the code", () => {
      expect(fx).toParseDOM(
        '<pre><code class="hljs language-js">Hello</code></pre>',
        (b) => [b.code_block({ lang: "js" }, "Hello")],
      );
    });

    test("with a language class on the pre", () => {
      expect(fx).toParseDOM(
        '<pre class="language-js"><code>Hello</code></pre>',
        (b) => [b.code_block({ lang: "js" }, "Hello")],
      );
    });

    test("prefers data-language over a class", () => {
      expect(fx).toParseDOM(
        '<pre data-language="ts"><code class="language-js">Hello</code></pre>',
        (b) => [b.code_block({ lang: "ts" }, "Hello")],
      );
    });

    test("with an empty data-language and a language class", () => {
      expect(fx).toParseDOM(
        '<pre data-language=""><code class="language-js">Hello</code></pre>',
        (b) => [b.code_block({ lang: "js" }, "Hello")],
      );
    });

    test("with a whitespace-only data-language and a language class", () => {
      expect(fx).toParseDOM(
        '<pre data-language=" "><code class="language-js">Hello</code></pre>',
        (b) => [b.code_block({ lang: "js" }, "Hello")],
      );
    });

    test("skipping a bare language- class", () => {
      expect(fx).toParseDOM(
        '<pre><code class="language- language-js">Hello</code></pre>',
        (b) => [b.code_block({ lang: "js" }, "Hello")],
      );
    });

    test.each([
      ['<pre><code class="language-js" data-lang="js">Hello</code></pre>'],
      ['<pre data-lang="js"><code>Hello</code></pre>'],
      ['<pre><code data-lang="js">Hello</code></pre>'],
      ['<pre class="prettyprint lang-js"><code>Hello</code></pre>'],
      ['<pre><code class="lang-js">Hello</code></pre>'],
      [
        '<pre data-language="" data-lang=" "><code class="lang-js">Hello</code></pre>',
      ],
    ])("with the language from %s", (html) => {
      expect(fx).toParseDOM(html, (b) => [
        b.code_block({ lang: "js" }, "Hello"),
      ]);
    });

    test("from the node view's own HTML, without the language field", () => {
      expect(fx).toParseDOM(
        '<pre class="prosemirror-remark-code-block" data-language="js"><label class="prosemirror-remark-code-block-language" contenteditable="false"><span class="prosemirror-remark-code-block-language-label">Language:</span><input type="text" value="js"></label><code class="language-js">Hello</code></pre>',
        (b) => [b.code_block({ lang: "js" }, "Hello")],
      );
    });

    test.each([
      ["<pre><code>Hello</code>\n<code>World</code></pre>", "Hello\nWorld"],
      ["<pre>Hello <code>World</code></pre>", "Hello World"],
    ])("with all the text of %s", (html, text) => {
      expect(fx).toParseDOM(html, (b) => [b.code_block(text)]);
    });

    test("from a pre without a code element", () => {
      expect(fx).toParseDOM("<pre>Hello</pre>", (b) => [b.code_block("Hello")]);
    });

    test("without a language from Prism's language-none", () => {
      expect(fx).toParseDOM(
        '<pre class="language-none"><code class="language-none">Hello</code></pre>',
        (b) => [b.code_block("Hello")],
      );
    });

    test("ignoring the lang attribute", () => {
      expect(fx).toParseDOM(
        '<pre lang="en"><code lang="en">Hello</code></pre>',
        (b) => [b.code_block("Hello")],
      );
    });

    test("with meta without a language", () => {
      expect(fx).toParseDOM(
        '<pre data-meta="x=1"><code>Hello</code></pre>',
        (b) => [b.code_block({ meta: "x=1" }, "Hello")],
      );
    });
  });

  describe("renders DOM", () => {
    test("without a language", () => {
      expect(fx).toRenderDOM(
        (b) => [b.code_block("Hello")],
        '<pre class="prosemirror-remark-code-block"><code>Hello</code></pre>',
      );
    });

    test("with a language set without normalisation", () => {
      expect(fx).toRenderDOM(
        (b) => [b.code_block({ lang: "foo bar", meta: "x=1" }, "Hello")],
        '<pre class="prosemirror-remark-code-block" data-language="foo" data-meta="x=1"><code class="language-foo">Hello</code></pre>',
      );
    });

    test("with meta without a language", () => {
      expect(fx).toRenderDOM(
        (b) => [b.code_block({ meta: "x=1" }, "Hello")],
        '<pre class="prosemirror-remark-code-block" data-meta="x=1"><code>Hello</code></pre>',
      );
    });

    test("with a language and meta", () => {
      expect(fx).toRenderDOM(
        (b) => [b.code_block({ lang: "js", meta: "x=1" }, "Hello")],
        '<pre class="prosemirror-remark-code-block" data-language="js" data-meta="x=1"><code class="language-js">Hello</code></pre>',
      );
    });
  });
});
