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
    (b) => [b.link({ href: "https://example.test" }, "Click me!")],
  )
  .shouldConvertUnistNode(
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
  )
  .shouldMatchProseMirrorMark((b) =>
    b.schema.mark("link", { href: "https://example.test" }),
  )
  .shouldConvertProseMirrorNode(
    (b) => b.link({ href: "https://example.test" }, "Click me!"),
    [
      {
        children: [{ type: "text", value: "Click me!" }],
        type: "link",
        url: "https://example.test",
      },
    ],
  )
  .shouldConvertProseMirrorNode(
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
  )
  .shouldParseDOM(
    '<p><a href="https://example.test">Click me!</a></p>',
    (b) => [b.p(b.link({ href: "https://example.test" }, "Click me!"))],
  )
  .shouldParseDOM(
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
  )
  .shouldParseDOM("<p><a>Click me!</a></p>", (b) => [b.p("Click me!")])
  .shouldRenderDOM(
    (b) => [b.p(b.link({ href: "https://example.test" }, "Click me!"))],
    '<p><a href="https://example.test">Click me!</a></p>',
  )
  .test();
