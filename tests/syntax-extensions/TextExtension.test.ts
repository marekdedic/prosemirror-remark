import { describe, expect, test } from "vitest";

import { TextExtension } from "../../src/syntax-extensions/TextExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("TextExtension", () => {
  const fx = createExtensionFixture(new TextExtension());

  test("handles the `text` unist node", () => {
    expect(fx).toHandleUnistNode("text");
  });

  test("provides the `text` ProseMirror node", () => {
    expect(fx).toProvideNode("text");
  });

  describe("matches unist nodes", () => {
    test("matches `text`", () => {
      expect(fx).toMatchUnistNode({ type: "text", value: "Hello World!" });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  test("converts unist -> ProseMirror", () => {
    expect(fx).toConvertUnistNode(
      { type: "text", value: "Hello World!" },
      (b) => [b.schema.text("Hello World!")],
    );
  });

  test("matches the `text` ProseMirror node", () => {
    expect(fx).toMatchProseMirrorNode((b) => b.schema.text("Hello World"));
  });

  test("converts ProseMirror -> unist", () => {
    expect(fx).toConvertProseMirrorNode(
      (b) => b.schema.text("Hello World!"),
      [{ type: "text", value: "Hello World!" }],
    );
  });
});
