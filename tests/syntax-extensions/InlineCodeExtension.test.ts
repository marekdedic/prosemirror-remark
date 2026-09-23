import { describe, expect, test } from "vitest";

import { InlineCodeExtension } from "../../src/syntax-extensions/InlineCodeExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("InlineCodeExtension", () => {
  const fx = createExtensionFixture(new InlineCodeExtension(), []);

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
      expect(fx).toSupportKeymap(
        (b) => [b.p()],
        "start",
        "{Mod-`}",
        (b) => [b.p()],
        "",
      );
    });

    test("wraps the selection", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.p("abcdef")],
        { anchor: 3, head: 5 },
        "{Mod-`}",
        (b) => [b.p("ab", b.code("cd"), "ef")],
        "ab`cd`ef",
      );
    });
  });

  describe("input rules", () => {
    test("matches `Test`", () => {
      expect(fx).toApplyInlineInputRule("`Test`", "`Test`", "Test");
    });

    test("matches `Hello World`", () => {
      expect(fx).toApplyInlineInputRule(
        "`Hello World`",
        "`Hello World`",
        "Hello World",
      );
    });

    test("matches ` across a paragraph break", () => {
      expect(fx).toApplyInlineInputRule("`Test`{Enter}", "`Test`\n\n", (b) => [
        b.p(b.code("Test")),
        b.p(),
      ]);
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
