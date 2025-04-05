import { LinkExtension } from "../../src/syntax-extensions/LinkExtension";
import { MarkExtensionTester } from "../utils/MarkExtensionTester";

new MarkExtensionTester(new LinkExtension(), {
  proseMirrorMarkName: "link",
  unistNodeName: "link",
})
  .shouldMatchUnistNode({
    children: [],
    type: "link",
    url: "https://example.test",
  })
  .shouldMatchUnistNode({
    children: [{ type: "text", value: "Click me!" }],
    type: "link",
    url: "https://example.test",
  })
  .shouldMatchUnistNode({
    children: [{ type: "text", value: "Click me!" }],
    title: "This link has a title",
    type: "link",
    url: "https://example.test",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Click me!" }],
      type: "link",
      url: "https://example.test",
    },
    (schema) => [
      schema
        .text("Click me!")
        .mark([schema.marks["link"].create({ href: "https://example.test" })]),
    ],
  )
  .shouldConvertUnistNode(
    {
      children: [{ type: "text", value: "Click me!" }],
      title: "This link has a title",
      type: "link",
      url: "https://example.test",
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
  .shouldMatchProseMirrorMark((schema) =>
    schema.mark("link", { href: "https://example.test" }),
  )
  .shouldConvertProseMirrorNode(
    (schema) =>
      schema
        .text("Click me!")
        .mark([schema.mark("link", { href: "https://example.test" })]),
    [
      {
        children: [{ type: "text", value: "Click me!" }],
        type: "link",
        url: "https://example.test",
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
        children: [{ type: "text", value: "Click me!" }],
        title: "This link has a title",
        type: "link",
        url: "https://example.test",
      },
    ],
  )
  .test();
