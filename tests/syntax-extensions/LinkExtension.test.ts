import { describe, expect, test } from "vitest";

import { LinkExtension } from "../../src/syntax-extensions/LinkExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("LinkExtension", () => {
  const fx = createExtensionFixture(new LinkExtension(), []);

  test("handles the `link` unist node", () => {
    expect(fx).toHandleUnistNode("link");
  });

  test("provides the `link` ProseMirror mark", () => {
    expect(fx).toProvideMark("link");
  });

  describe("matches unist nodes", () => {
    test("matches `link` with only a url", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        type: "link",
        url: "https://example.test",
      });
    });

    test("matches `link` with children", () => {
      expect(fx).toMatchUnistNode({
        children: [{ type: "text", value: "Click me!" }],
        type: "link",
        url: "https://example.test",
      });
    });

    test("matches `link` with a title", () => {
      expect(fx).toMatchUnistNode({
        children: [{ type: "text", value: "Click me!" }],
        title: "This link has a title",
        type: "link",
        url: "https://example.test",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("plain", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Click me!" }],
          type: "link",
          url: "https://example.test",
        },
        (b) => [b.link({ href: "https://example.test" }, "Click me!")],
      );
    });

    test("with a title", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Click me!" }],
          title: "This link has a title",
          type: "link",
          url: "https://example.test",
        },
        (b) => [
          b.link(
            {
              href: "https://example.test",
              title: "This link has a title",
            },
            "Click me!",
          ),
        ],
      );
    });
  });

  test("matches the `link` mark", () => {
    expect(fx).toMatchProseMirrorMark((b) =>
      b.schema.mark("link", { href: "https://example.test" }),
    );
  });

  describe("converts ProseMirror -> unist", () => {
    test("plain", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.link({ href: "https://example.test" }, "Click me!"),
        [
          {
            children: [{ type: "text", value: "Click me!" }],
            type: "link",
            url: "https://example.test",
          },
        ],
      );
    });

    test("with a title", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) =>
          b.link(
            {
              href: "https://example.test",
              title: "This link has a title",
            },
            "Click me!",
          ),
        [
          {
            children: [{ type: "text", value: "Click me!" }],
            title: "This link has a title",
            type: "link",
            url: "https://example.test",
          },
        ],
      );
    });
  });

  describe("parses DOM", () => {
    test("with an href", () => {
      expect(fx).toParseDOM(
        '<p><a href="https://example.test">Click me!</a></p>',
        (b) => [b.p(b.link({ href: "https://example.test" }, "Click me!"))],
      );
    });

    test("with an href and a title", () => {
      expect(fx).toParseDOM(
        '<p><a href="https://example.test" title="A title">Click me!</a></p>',
        (b) => [
          b.p(
            b.link(
              {
                href: "https://example.test",
                title: "A title",
              },
              "Click me!",
            ),
          ),
        ],
      );
    });

    test("without an href", () => {
      expect(fx).toParseDOM("<p><a>Click me!</a></p>", (b) => [
        b.p("Click me!"),
      ]);
    });
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM(
      (b) => [b.p(b.link({ href: "https://example.test" }, "Click me!"))],
      '<p><a href="https://example.test">Click me!</a></p>',
    );
  });
});
