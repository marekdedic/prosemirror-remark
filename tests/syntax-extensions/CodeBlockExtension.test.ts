import { describe, expect, test } from "vitest";

import { CodeBlockExtension } from "../../src/syntax-extensions/CodeBlockExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("CodeBlockExtension", () => {
  const fx = createExtensionFixture(new CodeBlockExtension());

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
  });

  test("input rule from four spaces", () => {
    expect(fx).toApplyBlockInputRule(
      "    Hello World!",
      "```\nHello World!\n```",
      (b) => [b.code_block("Hello World!")],
    );
  });

  describe("keymap", () => {
    test("`Mod-Shift-\\` wraps a paragraph", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.p("Hello")],
        3,
        "{Mod-Shift-\\\\}",
        (b) => [b.code_block("Hello")],
        "```\nHello\n```",
      );
    });

    test("`Mod-Shift-\\` wraps only the current paragraph", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.p("Hello"), b.p("World")],
        3,
        "{Mod-Shift-\\\\}",
        (b) => [b.code_block("Hello"), b.p("World")],
        "```\nHello\n```\n\nWorld",
      );
    });

    test("`Enter` inserts a newline", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.code_block("Hello")],
        4,
        "{Enter}",
        (b) => [b.code_block("Hel\nlo")],
        "```\nHel\nlo\n```",
      );
    });

    test("`Enter` at the end inserts a newline", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.code_block("Hello")],
        6,
        "{Enter}",
        (b) => [b.code_block("Hello\n")],
        "```\nHello\n\n```",
      );
    });

    test("`Enter` after one trailing newline inserts another", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.code_block("Hello\n")],
        6,
        "{Enter}",
        (b) => [b.code_block("Hello\n\n")],
        "```\nHello\n\n\n```",
      );
    });

    test("`Enter` after two trailing newlines exits the code block", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.code_block("Hello\n\n")],
        8,
        "{Enter}",
        (b) => [b.code_block("Hello"), b.p()],
        "```\nHello\n```\n",
      );
    });
  });

  test("parses DOM", () => {
    expect(fx).toParseDOM("<pre><code>Hello</code></pre>", (b) => [
      b.code_block("Hello"),
    ]);
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM(
      (b) => [b.code_block("Hello")],
      "<pre><code>Hello</code></pre>",
    );
  });
});
