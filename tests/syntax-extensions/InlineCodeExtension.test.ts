import { describe, expect, test } from "vitest";

import { BreakExtension } from "../../src/syntax-extensions/BreakExtension";
import { ImageExtension } from "../../src/syntax-extensions/ImageExtension";
import { InlineCodeExtension } from "../../src/syntax-extensions/InlineCodeExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("InlineCodeExtension", () => {
  const fx = createExtensionFixture(new InlineCodeExtension(), [
    new BreakExtension(),
    new ImageExtension(),
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

    test("matches ` across a paragraph break", () => {
      expect(fx).toTransformInlineInput(
        "`Test`{Enter}",
        (b) => [b.code("Test")],
        "`Test`",
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
