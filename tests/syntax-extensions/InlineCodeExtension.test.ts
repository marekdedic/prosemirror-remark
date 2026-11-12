import { describe, expect, test } from "vitest";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { BreakExtension } from "../../src/syntax-extensions/BreakExtension";
import { ImageExtension } from "../../src/syntax-extensions/ImageExtension";
import { InlineCodeExtension } from "../../src/syntax-extensions/InlineCodeExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { StrikethroughExtension } from "../../src/syntax-extensions/StrikethroughExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("InlineCodeExtension", () => {
  const fx = createExtensionFixture(new InlineCodeExtension(), [
    new BreakExtension(),
    new ImageExtension(),
  ]);

  const fxWithMarks = createExtensionFixture(new InlineCodeExtension(), [
    new ItalicExtension(),
    new BoldExtension(),
    new StrikethroughExtension(),
  ]);

  test("handles the `inlineCode` unist node", () => {
    expect(fx).toHandleUnistNode("inlineCode");
  });

  test("provides the `code` ProseMirror mark", () => {
    expect(fx).toProvideMark("code");
  });

  describe("matches unist nodes", () => {
    test("matches empty `inlineCode`", () => {
      expect(fx).toMatchUnistNode({ type: "inlineCode", value: "" });
    });

    test("matches `inlineCode` with value", () => {
      expect(fx).toMatchUnistNode({ type: "inlineCode", value: "Test" });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  test("converts unist -> ProseMirror", () => {
    expect(fx).toConvertUnistNode(
      {
        type: "inlineCode",
        value: "Hello World!",
      },
      (b) => [b.code("Hello World!")],
    );
  });

  test("matches the `code` mark", () => {
    expect(fx).toMatchProseMirrorMark((b) => b.schema.mark("code"));
  });

  test("converts ProseMirror -> unist", () => {
    expect(fx).toConvertProseMirrorNode(
      (b) => b.code("Hello World!"),
      [{ type: "inlineCode", value: "Hello World!" }],
    );
  });

  describe("keymap {Mod-`}", () => {
    test("no-op on empty selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "start",
        "{Mod-`}",
        (b) => [b.p()],
        "",
      );
    });

    test("wraps the selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("ab<from>cd<to>ef")],
        { anchor: "from", head: "to" },
        "{Mod-`}",
        (b) => [b.p("ab", b.code("cd"), "ef")],
        "ab`cd`ef",
      );
    });

    test("does not mark a hard break in the selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("a<from>b", b.br(), "c<to>d")],
        { anchor: "from", head: "to" },
        "{Mod-`}",
        (b) => [b.p("a", b.code("b"), b.br(), b.code("c"), "d")],
        "a`b`\\\n`c`d",
      );
    });

    test("does not mark an image in the selection", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.p("a<from>b", b.img({ alt: "x", src: "https://i.test" }), "c<to>d"),
        ],
        { anchor: "from", head: "to" },
        "{Mod-`}",
        (b) => [
          b.p(
            "a",
            b.code("b"),
            b.img({ alt: "x", src: "https://i.test" }),
            b.code("c"),
            "d",
          ),
        ],
        "a`b`![x](https://i.test)`c`d",
      );
    });
  });

  describe("input rules", () => {
    test.each([
      ["```js", "\\`\\`\\`js"],
      ["````js", "\\`\\`\\`\\`js"],
    ])("does not match the code fence %j", (input, markdown) => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "start",
        input,
        (b) => [b.p(input)],
        markdown,
      );
    });

    test("does not match the code fence ``` followed by Enter", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "start",
        "```{Enter}",
        (b) => [b.p("```"), b.p()],
        "\\`\\`\\`\n",
      );
    });

    test("matches `Test`", () => {
      expect(fx).toTransformInlineInput(
        "`Test`",
        (b) => [b.code("Test")],
        "`Test`",
      );
    });

    test("matches `Hello World`", () => {
      expect(fx).toTransformInlineInput(
        "`Hello World`",
        (b) => [b.code("Hello World")],
        "`Hello World`",
      );
    });

    test.each([
      ["``a`", "\\`\\`a\\`"],
      ["`a``", "\\`a\\`\\`"],
    ])("does not match the unbalanced code span %j", (input, markdown) => {
      expect(fx).toTransformInlineInput(input, () => [input], markdown);
    });

    test.each([
      ["``a`b``", "a`b", "``a`b``"],
      ["```a``b```", "a``b", "`a``b`"],
      ["``a```b``", "a```b", "`a```b`"],
      ["`a``b`", "a``b", "`a``b`"],
      ["``Test``", "Test", "`Test`"],
    ])("matches the code span %j", (input, code, markdown) => {
      expect(fx).toTransformInlineInput(input, (b) => [b.code(code)], markdown);
    });

    test.each([
      ["`` ` ``", "`", "`` ` ``"],
      ["`` `a ``", "`a", "`` `a ``"],
      ["` a `", "a", "`a`"],
      ["`` a ``", "a", "`a`"],
    ])("matches the padded code span %j", (input, code, markdown) => {
      expect(fx).toTransformInlineInput(input, (b) => [b.code(code)], markdown);
    });

    test.each([
      ["``a```", "\\`\\`a\\`\\`\\`"],
      ["```a``", "\\`\\`\\`a\\`\\`"],
      ["` a`", "\\` a\\`"],
      ["`a `", "\\`a \\`"],
      ["``  a  ``", "\\`\\`  a  \\`\\`"],
      ["`` ``", "\\`\\` \\`\\`"],
    ])("does not match the code span %j", (input, markdown) => {
      expect(fx).toTransformInlineInput(input, () => [input], markdown);
    });

    test("matches ` across a paragraph break", () => {
      expect(fx).toTransformInlineInput(
        "`Test`{Enter}",
        (b) => [b.code("Test")],
        "`Test`",
      );
    });
  });

  describe("Markdown inside inline code", () => {
    test.each([
      ["*a* ", "`x*a* y`"],
      ["**a** ", "`x**a** y`"],
      ["~a~ ", "`x~a~ y`"],
      ["`a` ", "``x`a` y``"],
    ])("typing %j stays text", (input, markdown) => {
      expect(fxWithMarks).toTransformInput(
        (b) => [b.p(b.code("x<cursor>y"))],
        "cursor",
        input,
        (b) => [b.p(b.code(`x${input}y`))],
        markdown,
      );
    });

    test("a delimiter inside inline code with the other one outside stays text", () => {
      expect(fxWithMarks).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "`x*y` z* ",
        (b) => [b.p(b.code("x*y"), " z* ")],
        "`x*y` z\\*&#x20;",
      );
    });

    test("a closing delimiter inside inline code stays text", () => {
      expect(fxWithMarks).toTransformInput(
        (b) => [b.p("*a ", b.code("b*"), "<cursor>")],
        "cursor",
        " ",
        (b) => [b.p("*a ", b.code("b*"), " ")],
        "\\*a `b*`&#x20;",
      );
    });

    test("bold can still be typed around it", () => {
      expect(fxWithMarks).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "**`x`** ",
        (b) => [b.p(b.strong(b.code("x")), " ")],
        "**`x`**&#x20;",
      );
    });

    test("italic can still be typed around it", () => {
      expect(fxWithMarks).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "*a `b` c* ",
        (b) => [b.p(b.em("a ", b.code("b"), " c"), " ")],
        "*a `b` c*&#x20;",
      );
    });

    test.each([
      ["*a*", "`x*a*y`"],
      ["**a** b", "`x**a** by`"],
    ])("pasting %j stays text", (text, markdown) => {
      expect(fxWithMarks).toTransformPaste(
        (b) => [b.p(b.code("x<cursor>y"))],
        "cursor",
        text,
        (b) => [b.p(b.code(`x${text}y`))],
        markdown,
      );
    });
  });

  test("parses DOM", () => {
    expect(fx).toParseDOM("<p><code>Hello</code></p>", (b) => [
      b.p(b.code("Hello")),
    ]);
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM(
      (b) => [b.p(b.code("Hello"))],
      "<p><code>Hello</code></p>",
    );
  });
});
