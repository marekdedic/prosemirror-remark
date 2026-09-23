import { describe, expect, test } from "vitest";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("ItalicExtension", () => {
  const fx = createExtensionFixture(new ItalicExtension(), [
    new BoldExtension(),
  ]);

  test("handles the `emphasis` unist node", () => {
    expect(fx).toHandleUnistNode("emphasis");
  });

  test("provides the `em` ProseMirror mark", () => {
    expect(fx).toProvideMark("em");
  });

  describe("matches unist nodes", () => {
    test("matches `emphasis`", () => {
      expect(fx).toMatchUnistNode({ children: [], type: "emphasis" });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  test("converts unist -> ProseMirror", () => {
    expect(fx).toConvertUnistNode(
      {
        children: [{ type: "text", value: "Hello World!" }],
        type: "emphasis",
      },
      (b) => [b.em("Hello World!")],
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

  test("matches the `em` mark", () => {
    expect(fx).toMatchProseMirrorMark((b) => b.schema.mark("em"));
  });

  describe("converts ProseMirror -> unist", () => {
    test("nested marks", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) =>
          b.schema
            .text("Hello World!")
            .mark([b.schema.mark("em"), b.schema.mark("strong")]),
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

    test("plain", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.em("Hello World!"),
        [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "emphasis",
          },
        ],
      );
    });
  });

  describe("keymap {Mod-i}", () => {
    test("no-op on empty selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "start",
        "{Mod-i}",
        (b) => [b.p()],
        "",
      );
    });

    test("wraps the selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("ab<from>cd<to>ef")],
        { anchor: "from", head: "to" },
        "{Mod-i}",
        (b) => [b.p("ab", b.em("cd"), "ef")],
        "ab*cd*ef",
      );
    });
  });

  describe("keymap {Mod-I}", () => {
    test("no-op on empty selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "start",
        "{Mod-I}",
        (b) => [b.p()],
        "",
      );
    });

    test("wraps the selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("ab<from>cd<to>ef")],
        { anchor: "from", head: "to" },
        "{Mod-I}",
        (b) => [b.p("ab", b.em("cd"), "ef")],
        "ab*cd*ef",
      );
    });
  });

  describe("input rules", () => {
    test("matches *Test*", () => {
      expect(fx).toTransformInlineInput(
        "*Test*",
        (b) => [b.em("Test")],
        "*Test*",
      );
    });

    test("matches _Test_", () => {
      expect(fx).toTransformInlineInput(
        "_Test_",
        (b) => [b.em("Test")],
        "*Test*",
      );
    });

    test("matches *Hello World*", () => {
      expect(fx).toTransformInlineInput(
        "*Hello World*",
        (b) => [b.em("Hello World")],
        "*Hello World*",
      );
    });

    test("matches * across a paragraph break", () => {
      expect(fx).toTransformInlineInput(
        "*Test*{Enter}",
        (b) => [b.em("Test")],
        "*Test*",
      );
    });

    test("matches _ across a paragraph break", () => {
      expect(fx).toTransformInlineInput(
        "_Test_{Enter}",
        (b) => [b.em("Test")],
        "*Test*",
      );
    });

    test("does not match *Test_", () => {
      expect(fx).toTransformInlineInput(
        "*Test_",
        () => ["*Test_"],
        "\\*Test\\_",
      );
    });
  });

  describe("parses DOM", () => {
    test("<i>", () => {
      expect(fx).toParseDOM("<p><i>Hello</i></p>", (b) => [b.p(b.em("Hello"))]);
    });

    test("<em>", () => {
      expect(fx).toParseDOM("<p><em>Hello</em></p>", (b) => [
        b.p(b.em("Hello")),
      ]);
    });

    test("font-style: italic", () => {
      expect(fx).toParseDOM(
        '<p><span style="font-style: italic">Hello</span></p>',
        (b) => [b.p(b.em("Hello"))],
      );
    });

    test("font-style: oblique", () => {
      expect(fx).toParseDOM(
        '<p><span style="font-style: oblique">Hello</span></p>',
        (b) => [b.p("Hello")],
      );
    });

    test("font-style: normal", () => {
      expect(fx).toParseDOM(
        '<p><span style="font-style: normal">Hello</span></p>',
        (b) => [b.p("Hello")],
      );
    });
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM(
      (b) => [b.p(b.em("Hello"))],
      "<p><em>Hello</em></p>",
    );
  });
});
