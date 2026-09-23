import { describe, expect, test } from "vitest";

import { RootExtension } from "../../src/syntax-extensions/RootExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("RootExtension", () => {
  const fx = createExtensionFixture(new RootExtension());

  test("handles the `root` unist node", () => {
    expect(fx).toHandleUnistNode("root");
  });

  test("provides the `doc` ProseMirror node", () => {
    expect(fx).toProvideNode("doc");
  });

  describe("matches unist nodes", () => {
    test("matches an empty `root`", () => {
      expect(fx).toMatchUnistNode({ children: [], type: "root" });
    });

    test("matches a `root` with children", () => {
      expect(fx).toMatchUnistNode({
        children: [
          {
            children: [{ type: "text", value: "Hello World!" }],
            type: "paragraph",
          },
        ],
        type: "root",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("empty", () => {
      expect(fx).toConvertUnistNode({ children: [], type: "root" }, (b) => [
        b.doc(b.p()),
      ]);
    });

    test("with children", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [{ type: "text", value: "Hello World!" }],
              type: "paragraph",
            },
          ],
          type: "root",
        },
        (b) => [b.doc(b.p("Hello World!"))],
      );
    });
  });

  describe("matches ProseMirror nodes", () => {
    test("matches an empty `doc`", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.doc());
    });

    test("matches a `doc` with content", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.doc(b.p("Hello World!")));
    });
  });

  describe("converts ProseMirror -> unist", () => {
    test("empty paragraph", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.doc(b.p()),
        [{ children: [{ children: [], type: "paragraph" }], type: "root" }],
      );
    });

    test("with content", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.doc(b.p("Hello World!")),
        [
          {
            children: [
              {
                children: [{ type: "text", value: "Hello World!" }],
                type: "paragraph",
              },
            ],
            type: "root",
          },
        ],
      );
    });
  });
});
