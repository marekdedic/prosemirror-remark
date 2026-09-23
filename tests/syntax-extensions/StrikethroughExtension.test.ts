import { describe, expect, test } from "vitest";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { StrikethroughExtension } from "../../src/syntax-extensions/StrikethroughExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("StrikethroughExtension", () => {
  const fx = createExtensionFixture(new StrikethroughExtension(), [
    new BoldExtension(),
    new ItalicExtension(),
  ]);

  test("handles the `delete` unist node", () => {
    expect(fx).toHandleUnistNode("delete");
  });

  test("provides the `strikethrough` ProseMirror mark", () => {
    expect(fx).toProvideMark("strikethrough");
  });

  describe("matches unist nodes", () => {
    test("matches `delete`", () => {
      expect(fx).toMatchUnistNode({ children: [], type: "delete" });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("plain", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Hello World!" }],
          type: "delete",
        },
        (b) => [b.strikethrough("Hello World!")],
      );
    });

    test("delete wrapping emphasis", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "emphasis",
            },
          ],
          type: "delete",
        },
        (b) => [b.strikethrough(b.em("Hello World!"))],
      );
    });

    test("emphasis wrapping delete", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "delete",
            },
          ],
          type: "emphasis",
        },
        (b) => [b.em(b.strikethrough("Hello World!"))],
      );
    });

    test("delete wrapping strong", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "strong",
            },
          ],
          type: "delete",
        },
        (b) => [b.strikethrough(b.strong("Hello World!"))],
      );
    });

    test("strong wrapping delete", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "delete",
            },
          ],
          type: "strong",
        },
        (b) => [b.strong(b.strikethrough("Hello World!"))],
      );
    });
  });

  test("matches the `strikethrough` mark", () => {
    expect(fx).toMatchProseMirrorMark((b) => b.schema.mark("strikethrough"));
  });

  describe("converts ProseMirror -> unist", () => {
    test("plain", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.strikethrough("Hello World!"),
        [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "delete",
          },
        ],
      );
    });

    test("strikethrough wrapping emphasis", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.strikethrough(b.em("Hello World!")),
        [
          {
            children: [
              {
                children: [{ type: "text", value: "Hello World!" }],
                type: "emphasis",
              },
            ],
            type: "delete",
          },
        ],
      );
    });

    test("nested strikethrough and emphasis", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) =>
          b.schema
            .text("Hello World!")
            .mark([b.schema.mark("strikethrough"), b.schema.mark("em")]),
        [
          {
            children: [
              {
                children: [{ type: "text", value: "Hello World!" }],
                type: "delete",
              },
            ],
            type: "emphasis",
          },
        ],
      );
    });

    test("strikethrough wrapping strong", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.strikethrough(b.strong("Hello World!")),
        [
          {
            children: [
              {
                children: [{ type: "text", value: "Hello World!" }],
                type: "strong",
              },
            ],
            type: "delete",
          },
        ],
      );
    });

    test("nested strikethrough and strong", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) =>
          b.schema
            .text("Hello World!")
            .mark([b.schema.mark("strikethrough"), b.schema.mark("strong")]),
        [
          {
            children: [
              {
                children: [{ type: "text", value: "Hello World!" }],
                type: "delete",
              },
            ],
            type: "strong",
          },
        ],
      );
    });
  });

  describe("input rules", () => {
    test("matches ~Test~", () => {
      expect(fx).toTransformInlineInput(
        "~Test~",
        (b) => [b.strikethrough("Test")],
        "~~Test~~",
      );
    });

    test("matches ~~Test~~", () => {
      expect(fx).toTransformInlineInput(
        "~~Test~~",
        (b) => [b.strikethrough("Test")],
        "~~Test~~",
      );
    });

    test("matches ~Hello World~", () => {
      expect(fx).toTransformInlineInput(
        "~Hello World~",
        (b) => [b.strikethrough("Hello World")],
        "~~Hello World~~",
      );
    });

    test("matches ~ across a paragraph break", () => {
      expect(fx).toTransformInlineInput(
        "~Test~{Enter}",
        (b) => [b.strikethrough("Test")],
        "~~Test~~",
      );
    });

    test("matches ~~ across a paragraph break", () => {
      expect(fx).toTransformInlineInput(
        "~~Test~~{Enter}",
        (b) => [b.strikethrough("Test")],
        "~~Test~~",
      );
    });

    test("does not match a leading `~ `", () => {
      expect(fx).toTransformInlineInput(
        "~ ~Test~",
        (b) => ["~ ", b.strikethrough("Test")],
        "\\~ ~~Test~~",
      );
    });

    test("does not match a trailing ` ~`", () => {
      expect(fx).toTransformInlineInput(
        "~Test~ ~",
        (b) => [b.strikethrough("Test"), " ~"],
        "~~Test~~ \\~",
      );
    });
  });

  describe("parses DOM", () => {
    test("<s>", () => {
      expect(fx).toParseDOM("<p><s>Hello</s></p>", (b) => [
        b.p(b.strikethrough("Hello")),
      ]);
    });

    test("<del>", () => {
      expect(fx).toParseDOM("<p><del>Hello</del></p>", (b) => [
        b.p(b.strikethrough("Hello")),
      ]);
    });

    test("text-decoration: line-through", () => {
      expect(fx).toParseDOM(
        '<p><span style="text-decoration: line-through">Hello</span></p>',
        (b) => [b.p(b.strikethrough("Hello"))],
      );
    });

    test("text-decoration: underline line-through", () => {
      expect(fx).toParseDOM(
        '<p><span style="text-decoration: underline line-through">Hello</span></p>',
        (b) => [b.p(b.strikethrough("Hello"))],
      );
    });

    test("text-decoration: underline", () => {
      expect(fx).toParseDOM(
        '<p><span style="text-decoration: underline">Hello</span></p>',
        (b) => [b.p("Hello")],
      );
    });
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM(
      (b) => [b.p(b.strikethrough("Hello"))],
      "<p><s>Hello</s></p>",
    );
  });
});
