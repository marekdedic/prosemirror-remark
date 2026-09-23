import { describe, expect, test } from "vitest";

import { ImageExtension } from "../../src/syntax-extensions/ImageExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("ImageExtension", () => {
  const fx = createExtensionFixture(new ImageExtension());

  test("handles the `image` unist node", () => {
    expect(fx).toHandleUnistNode("image");
  });

  test("provides the `image` ProseMirror node", () => {
    expect(fx).toProvideNode("image");
  });

  describe("matches unist nodes", () => {
    test("matches `image` with a url", () => {
      expect(fx).toMatchUnistNode({
        type: "image",
        url: "https://example.test",
      });
    });

    test("matches `image` with an alt", () => {
      expect(fx).toMatchUnistNode({
        alt: "Awesome image",
        type: "image",
        url: "https://example.test",
      });
    });

    test("matches `image` with a title", () => {
      expect(fx).toMatchUnistNode({
        alt: "Awesome image",
        title: "Image title",
        type: "image",
        url: "https://example.test",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("with a url", () => {
      expect(fx).toConvertUnistNode(
        { type: "image", url: "https://example.test" },
        (b) => [b.img({ src: "https://example.test" })],
      );
    });

    test("with an alt", () => {
      expect(fx).toConvertUnistNode(
        {
          alt: "Awesome image",
          type: "image",
          url: "https://example.test",
        },
        (b) => [
          b.img({
            alt: "Awesome image",
            src: "https://example.test",
          }),
        ],
      );
    });

    test("with a title", () => {
      expect(fx).toConvertUnistNode(
        {
          alt: "Awesome image",
          title: "Image title",
          type: "image",
          url: "https://example.test",
        },
        (b) => [
          b.img({
            alt: "Awesome image",
            src: "https://example.test",
            title: "Image title",
          }),
        ],
      );
    });
  });

  describe("matches ProseMirror nodes", () => {
    test("with a src", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.img({ src: "https://example.test" }),
      );
    });

    test("with an alt", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.img({
          alt: "Awesome image",
          src: "https://example.test",
        }),
      );
    });

    test("with a title", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.img({
          alt: "Awesome image",
          src: "https://example.test",
          title: "Image title",
        }),
      );
    });
  });

  describe("converts ProseMirror -> unist", () => {
    test("with a src", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.img({ src: "https://example.test" }),
        [{ type: "image", url: "https://example.test" }],
      );
    });

    test("with an alt", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) =>
          b.img({
            alt: "Awesome image",
            src: "https://example.test",
          }),
        [
          {
            alt: "Awesome image",
            type: "image",
            url: "https://example.test",
          },
        ],
      );
    });

    test("with a title", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) =>
          b.img({
            alt: "Awesome image",
            src: "https://example.test",
            title: "Image title",
          }),
        [
          {
            alt: "Awesome image",
            title: "Image title",
            type: "image",
            url: "https://example.test",
          },
        ],
      );
    });
  });

  describe("parses DOM", () => {
    test("with a src", () => {
      expect(fx).toParseDOM(
        '<p><img src="https://example.test/i.png"></p>',
        (b) => [b.p(b.img({ src: "https://example.test/i.png" }))],
      );
    });

    test("with alt and title", () => {
      expect(fx).toParseDOM(
        '<p><img src="https://example.test/i.png" alt="Alt" title="Title"></p>',
        (b) => [
          b.p(
            b.img({
              alt: "Alt",
              src: "https://example.test/i.png",
              title: "Title",
            }),
          ),
        ],
      );
    });

    test("without a source", () => {
      expect(fx).toParseDOM('<p><img alt="No source"></p>', (b) => [b.p()]);
    });
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM(
      (b) => [b.p(b.img({ src: "https://example.test/i.png" }))],
      '<p><img src="https://example.test/i.png"></p>',
    );
  });
});
