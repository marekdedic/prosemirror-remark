import { describe, expect, test } from "vitest";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("BoldExtension", () => {
  const fx = createExtensionFixture(new BoldExtension(), [
    new ItalicExtension(),
  ]);

  test("handles the `strong` unist node", () => {
    expect(fx).toHandleUnistNode("strong");
  });

  test("provides the `strong` ProseMirror mark", () => {
    expect(fx).toProvideMark("strong");
  });

  describe("matches unist nodes", () => {
    test("matches `strong`", () => {
      expect(fx).toMatchUnistNode({ children: [], type: "strong" });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  test("converts unist -> ProseMirror", () => {
    expect(fx).toConvertUnistNode(
      { children: [{ type: "text", value: "Hello World!" }], type: "strong" },
      (b) => [b.strong("Hello World!")],
    );
  });

  describe("converts nested marks unist -> ProseMirror", () => {
    test("strong wrapping emphasis", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "emphasis",
            },
          ],
          type: "strong",
        },
        (b) => [b.strong(b.em("Hello World!"))],
      );
    });

    test("emphasis wrapping strong", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "strong",
            },
          ],
          type: "emphasis",
        },
        (b) => [b.em(b.strong("Hello World!"))],
      );
    });
  });

  test("matches the `strong` mark", () => {
    expect(fx).toMatchProseMirrorMark((b) => b.schema.mark("strong"));
  });

  describe("converts ProseMirror -> unist", () => {
    test("plain", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.strong("Hello World!"),
        [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "strong",
          },
        ],
      );
    });

    test("nested marks", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.strong(b.em("Hello World!")),
        [
          {
            children: [
              {
                children: [{ type: "text", value: "Hello World!" }],
                type: "emphasis",
              },
            ],
            type: "strong",
          },
        ],
      );
    });
  });

  describe.each([["{Mod-b}"], ["{Mod-B}"]])("keymap %s", (key) => {
    test("no-op on empty selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "start",
        key,
        (b) => [b.p()],
        "",
      );
    });

    test("wraps the selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("ab<from>cd<to>ef")],
        { anchor: "from", head: "to" },
        key,
        (b) => [b.p("ab", b.strong("cd"), "ef")],
        "ab**cd**ef",
      );
    });
  });

  describe("input rules", () => {
    test.each([
      ["**Test**", "**Test**", "Test"],
      ["__Test__", "**Test**", "Test"],
      ["**Hello World**", "**Hello World**", "Hello World"],
    ] as const)("matches %s", (input, md, contents) => {
      expect(fx).toTransformInlineInput(input, (b) => [b.strong(contents)], md);
    });

    test("matches ** across a paragraph break", () => {
      expect(fx).toTransformInlineInput(
        "**Test**{Enter}",
        (b) => [b.strong("Test")],
        "**Test**",
      );
    });

    test("matches __ across a paragraph break", () => {
      expect(fx).toTransformInlineInput(
        "__Test__{Enter}",
        (b) => [b.strong("Test")],
        "**Test**",
      );
    });

    test.each([
      ["**Test__", "\\*\\*Test\\_\\_"],
      ["**Test_*", "\\*\\*Test\\_\\*"],
      ["**Test*_", "\\*\\*Test\\*\\_"],
      ["**Test* *", "\\*\\*Test\\* \\*"],
    ] as const)("does not match %s", (input, md) => {
      expect(fx).toTransformInlineInput(input, () => [input], md);
    });

    test("does not match mismatched *_ pairs", () => {
      expect(fx).toTransformInlineInput(
        "X*_Test**X",
        (b) => ["X", b.em("_Test*"), "X"],
        "&#x58;*\\_Test\\**&#x58;",
      );
      expect(fx).toTransformInlineInput(
        "X_*Test**X",
        (b) => ["X_", b.em("Test*"), "X"],
        "X\\_*Test\\**&#x58;",
      );
      expect(fx).toTransformInlineInput(
        "X* *Test**X",
        (b) => ["X* ", b.em("Test*"), "X"],
        "X\\* *Test\\**&#x58;",
      );
    });
  });

  describe("parses DOM", () => {
    test.each([
      ["<p><b>Hello</b></p>"],
      ["<p><strong>Hello</strong></p>"],
      ['<p><span style="font-weight: bold">Hello</span></p>'],
      ['<p><span style="font-weight: bolder">Hello</span></p>'],
      ['<p><span style="font-weight: 700">Hello</span></p>'],
    ])("bold: %s", (html) => {
      expect(fx).toParseDOM(html, (b) => [b.p(b.strong("Hello"))]);
    });

    test.each([
      ['<p><span style="font-weight: normal">Hello</span></p>'],
      ['<p><span style="font-weight: 400">Hello</span></p>'],
    ])("not bold: %s", (html) => {
      expect(fx).toParseDOM(html, (b) => [b.p("Hello")]);
    });
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM(
      (b) => [b.p(b.strong("Hello"))],
      "<p><strong>Hello</strong></p>",
    );
  });
});
