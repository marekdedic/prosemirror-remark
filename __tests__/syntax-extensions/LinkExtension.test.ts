import { LinkExtension } from "../../src/syntax-extensions/LinkExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new LinkExtension(), {
  proseMirrorMarkName: "link",
  unistNodeName: "link",
})
  .shouldMatchUnistNode({
    type: "link",
    url: "https://example.test",
    children: [],
  })
  .shouldMatchUnistNode({
    type: "link",
    url: "https://example.test",
    children: [{ type: "text", value: "Click me!" }],
  })
  .shouldMatchUnistNode({
    type: "link",
    url: "https://example.test",
    title: "This link has a title",
    children: [{ type: "text", value: "Click me!" }],
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      type: "link",
      url: "https://example.test",
      children: [{ type: "text", value: "Click me!" }],
    },
    (schema) => [
      schema
        .text("Click me!")
        .mark([schema.marks["link"].create({ href: "https://example.test" })]),
    ],
  )
  .shouldConvertUnistNode(
    {
      type: "link",
      url: "https://example.test",
      title: "This link has a title",
      children: [{ type: "text", value: "Click me!" }],
    },
    (schema) => [
      schema.text("Click me!").mark([
        schema.marks["link"].create({
          href: "https://example.test",
          title: "This link has a title",
        }),
      ]),
    ],
  )
  .shouldMatchProseMirrorNode({ type: "text" }, (schema) =>
    schema.mark("link", { href: "https://example.test" }),
  )
  .shouldNotMatchProseMirrorNode({ type: "other" }, (schema) =>
    schema.mark("link", { href: "https://example.test" }),
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema
        .text("Click me!")
        .mark([schema.mark("link", { href: "https://example.test" })]),
    [
      {
        type: "link",
        url: "https://example.test",
        children: [{ type: "text", value: "Click me!" }],
      },
    ],
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema.text("Click me!").mark([
        schema.mark("link", {
          href: "https://example.test",
          title: "This link has a title",
        }),
      ]),
    [
      {
        type: "link",
        url: "https://example.test",
        title: "This link has a title",
        children: [{ type: "text", value: "Click me!" }],
      },
    ],
  )
  .test();
