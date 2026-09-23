import { describe, expect, test } from "vitest";

import { BlockquoteExtension } from "../../src/syntax-extensions/BlockquoteExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("BlockquoteExtension", () => {
  const fx = createExtensionFixture(new BlockquoteExtension());

  test("handles the `blockquote` unist node", () => {
    expect(fx).toHandleUnistNode("blockquote");
  });

  test("provides the `blockquote` ProseMirror node", () => {
    expect(fx).toProvideNode("blockquote");
  });

  describe("matches unist nodes", () => {
    test("matches an empty `blockquote`", () => {
      expect(fx).toMatchUnistNode({ children: [], type: "blockquote" });
    });

    test("matches a `blockquote` with children", () => {
      expect(fx).toMatchUnistNode({
        children: [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "paragraph",
          },
        ],
        type: "blockquote",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("single paragraph", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "paragraph",
            },
          ],
          type: "blockquote",
        },
        (b) => [b.blockquote(b.p("Hello World!"))],
      );
    });

    test("multiple paragraphs", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "paragraph",
            },
            {
              children: [{ type: "text", value: "Second paragraph" }],
              type: "paragraph",
            },
          ],
          type: "blockquote",
        },
        (b) => [b.blockquote(b.p("Hello World!"), b.p("Second paragraph"))],
      );
    });
  });

  test("matches a `blockquote` ProseMirror node", () => {
    expect(fx).toMatchProseMirrorNode((b) => b.blockquote());
  });

  describe("converts ProseMirror -> unist", () => {
    test("single paragraph", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.blockquote(b.p("Hello World!")),
        [
          {
            children: [
              {
                children: [{ type: "text", value: "Hello World!" }],
                type: "paragraph",
              },
            ],
            type: "blockquote",
          },
        ],
      );
    });

    test("multiple paragraphs", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.blockquote(b.p("Hello World!"), b.p("Second paragraph")),
        [
          {
            children: [
              {
                children: [{ type: "text", value: "Hello World!" }],
                type: "paragraph",
              },
              {
                children: [{ type: "text", value: "Second paragraph" }],
                type: "paragraph",
              },
            ],
            type: "blockquote",
          },
        ],
      );
    });
  });

  describe("keymap `Mod->` wraps in a blockquote", () => {
    test("empty paragraph", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "start",
        "{Mod->}",
        (b) => [b.blockquote(b.p())],
        ">",
      );
    });

    test("cursor selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("ab<cursor>cd")],
        "cursor",
        "{Mod->}",
        (b) => [b.blockquote(b.p("abcd"))],
        "> abcd",
      );
    });

    test("range selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<from>ab<to>cd")],
        { anchor: "from", head: "to" },
        "{Mod->}",
        (b) => [b.blockquote(b.p("abcd"))],
        "> abcd",
      );
    });
  });

  describe("input rules", () => {
    test.each([
      ["> Hello World!"],
      [" > Hello World!"],
      ["  > Hello World!"],
      ["   > Hello World!"],
    ])("matches %j", (input) => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "end",
        input,
        (b) => [b.blockquote(b.p("Hello World!"))],
        "> Hello World!",
      );
    });
  });

  test("parses DOM", () => {
    expect(fx).toParseDOM("<blockquote><p>Hello</p></blockquote>", (b) => [
      b.blockquote(b.p("Hello")),
    ]);
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM(
      (b) => [b.blockquote(b.p("Hello"))],
      "<blockquote><p>Hello</p></blockquote>",
    );
  });
});
