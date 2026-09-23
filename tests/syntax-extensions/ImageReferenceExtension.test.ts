import { describe, expect, test } from "vitest";

import { ImageReferenceExtension } from "../../src/syntax-extensions/ImageReferenceExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("ImageReferenceExtension", () => {
  const fx = createExtensionFixture(new ImageReferenceExtension());

  test("handles the `imageReference` unist node", () => {
    expect(fx).toHandleUnistNode("imageReference");
  });

  test("provides no ProseMirror node", () => {
    expect(fx).toProvideNode(null);
  });

  describe("matches unist nodes", () => {
    test("matches a `full` reference", () => {
      expect(fx).toMatchUnistNode({
        identifier: "imageId",
        referenceType: "full",
        type: "imageReference",
      });
    });

    test("matches a `collapsed` reference", () => {
      expect(fx).toMatchUnistNode({
        identifier: "imageId",
        referenceType: "collapsed",
        type: "imageReference",
      });
    });

    test("matches a `shortcut` reference", () => {
      expect(fx).toMatchUnistNode({
        identifier: "imageId",
        referenceType: "shortcut",
        type: "imageReference",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("`full` reference resolves its definition", () => {
      expect(fx).toConvertUnistNode(
        {
          identifier: "imageId",
          referenceType: "full",
          type: "imageReference",
        },
        (b) => [b.img({ src: "https://example.test" })],
        [
          {
            identifier: "imageId",
            type: "definition",
            url: "https://example.test",
          },
        ],
      );
    });

    test("`collapsed` reference resolves its definition", () => {
      expect(fx).toConvertUnistNode(
        {
          identifier: "imageId",
          referenceType: "collapsed",
          type: "imageReference",
        },
        (b) => [b.img({ src: "https://example.test" })],
        [
          {
            identifier: "imageId",
            type: "definition",
            url: "https://example.test",
          },
        ],
      );
    });

    test("`shortcut` reference resolves its definition", () => {
      expect(fx).toConvertUnistNode(
        {
          identifier: "imageId",
          referenceType: "shortcut",
          type: "imageReference",
        },
        (b) => [b.img({ src: "https://example.test" })],
        [
          {
            identifier: "imageId",
            type: "definition",
            url: "https://example.test",
          },
        ],
      );
    });

    test("carries alt and title from the definition", () => {
      expect(fx).toConvertUnistNode(
        {
          alt: "Awesome image",
          identifier: "imageId",
          referenceType: "full",
          type: "imageReference",
        },
        (b) => [
          b.img({
            alt: "Awesome image",
            src: "https://example.test",
            title: "Image title",
          }),
        ],
        [
          {
            identifier: "imageId",
            title: "Image title",
            type: "definition",
            url: "https://example.test",
          },
        ],
      );
    });

    test("no matching definition yields an empty src", () => {
      expect(fx).toConvertUnistNode(
        {
          identifier: "imageId",
          referenceType: "full",
          type: "imageReference",
        },
        (b) => [b.img({ src: "" })],
      );
    });

    // A reference whose definition is missing, while other definitions do exist,
    // Must be left with no src rather than picking up an unrelated definition.
    test("unrelated definitions are not picked up", () => {
      expect(fx).toConvertUnistNode(
        {
          alt: "Awesome image",
          identifier: "imageId",
          referenceType: "full",
          type: "imageReference",
        },
        (b) => [b.img({ alt: "Awesome image", src: "" })],
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
