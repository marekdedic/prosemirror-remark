import { describe, expect, test } from "vitest";

import { LinkReferenceExtension } from "../../src/syntax-extensions/LinkReferenceExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("LinkReferenceExtension", () => {
  const fx = createExtensionFixture(new LinkReferenceExtension(), []);

  test("handles the `linkReference` unist node", () => {
    expect(fx).toHandleUnistNode("linkReference");
  });

  test("provides no ProseMirror mark", () => {
    expect(fx).toProvideMark(null);
  });

  describe("matches unist nodes", () => {
    test("matches a `full` reference", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        identifier: "linkId",
        referenceType: "full",
        type: "linkReference",
      });
    });

    test("matches a `collapsed` reference", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        identifier: "linkId",
        referenceType: "collapsed",
        type: "linkReference",
      });
    });

    test("matches a `shortcut` reference", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        identifier: "linkId",
        referenceType: "shortcut",
        type: "linkReference",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("a `full` reference with a definition", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Click me!" }],
          identifier: "linkId",
          referenceType: "full",
          type: "linkReference",
        },
        (b) => [b.link({ href: "https://example.test" }, "Click me!")],
        [
          {
            identifier: "linkId",
            type: "definition",
            url: "https://example.test",
          },
        ],
      );
    });

    test("a `collapsed` reference with a definition", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Click me!" }],
          identifier: "linkId",
          referenceType: "collapsed",
          type: "linkReference",
        },
        (b) => [b.link({ href: "https://example.test" }, "Click me!")],
        [
          {
            identifier: "linkId",
            type: "definition",
            url: "https://example.test",
          },
        ],
      );
    });

    test("a `shortcut` reference with a definition", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Click me!" }],
          identifier: "linkId",
          referenceType: "shortcut",
          type: "linkReference",
        },
        (b) => [b.link({ href: "https://example.test" }, "Click me!")],
        [
          {
            identifier: "linkId",
            type: "definition",
            url: "https://example.test",
          },
        ],
      );
    });

    test("a `full` reference with a titled definition", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Click me!" }],
          identifier: "linkId",
          referenceType: "full",
          type: "linkReference",
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
        [
          {
            identifier: "linkId",
            title: "This link has a title",
            type: "definition",
            url: "https://example.test",
          },
        ],
      );
    });

    test("a `full` reference without a definition", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Click me!" }],
          identifier: "linkId",
          referenceType: "full",
          type: "linkReference",
        },
        (b) => [
          b.link(
            {
              href: null,
            },
            "Click me!",
          ),
        ],
      );
    });

    // A reference whose definition is missing, while other definitions do exist,
    // Must be left with no href rather than picking up an unrelated definition.
    test("a `full` reference with only an unrelated definition", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Click me!" }],
          identifier: "linkId",
          referenceType: "full",
          type: "linkReference",
        },
        (b) => [
          b.link(
            {
              href: null,
            },
            "Click me!",
          ),
        ],
        [
          {
            identifier: "otherId",
            type: "definition",
            url: "https://example.test",
          },
        ],
      );
    });
  });
});
