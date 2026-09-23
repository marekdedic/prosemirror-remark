import { describe, expect, test } from "vitest";

import { ParagraphExtension } from "../../src/syntax-extensions/ParagraphExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("ParagraphExtension", () => {
  const fx = createExtensionFixture(new ParagraphExtension());

  test("handles the `paragraph` unist node", () => {
    expect(fx).toHandleUnistNode("paragraph");
  });

  test("provides the `paragraph` ProseMirror node", () => {
    expect(fx).toProvideNode("paragraph");
  });

  describe("matches unist nodes", () => {
    test("matches an empty `paragraph`", () => {
      expect(fx).toMatchUnistNode({ children: [], type: "paragraph" });
    });

    test("matches a `paragraph` with children", () => {
      expect(fx).toMatchUnistNode({
        children: [{ type: "text", value: "Hello World!" }],
        type: "paragraph",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("empty", () => {
      expect(fx).toConvertUnistNode(
        { children: [], type: "paragraph" },
        (b) => [b.p()],
      );
    });

    test("with content", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Hello World!" }],
          type: "paragraph",
        },
        (b) => [b.p("Hello World!")],
      );
    });
  });

  describe("matches ProseMirror nodes", () => {
    test("empty", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.p());
    });

    test("with content", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.p("Hello World!"));
    });
  });

  describe("converts ProseMirror -> unist", () => {
    test("empty", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.p(),
        [{ children: [], type: "paragraph" }],
      );
    });

    test("with content", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.p("Hello World!"),
        [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "paragraph",
          },
        ],
      );
    });
  });
});
