import { RootExtension } from "../../src/syntax-extensions/RootExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";

new NodeExtensionTester(new RootExtension(), {
  proseMirrorNodeName: "doc",
  unistNodeName: "root",
})
  .shouldMatchUnistNode({ children: [], type: "root" })
  .shouldMatchUnistNode({
    children: [
      {
        children: [{ type: "text", value: "Hello World!" }],
        type: "paragraph",
      },
    ],
    type: "root",
  })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ children: [], type: "root" }, (b) => [b.doc(b.p())])
  .shouldConvertUnistNode(
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
  )
  .shouldMatchProseMirrorNode((b) => b.doc())
  .shouldMatchProseMirrorNode((b) => b.doc(b.p("Hello World!")))
  .shouldConvertProseMirrorNode(
    (b) => b.doc(b.p()),
    [{ children: [{ children: [], type: "paragraph" }], type: "root" }],
  )
  .shouldConvertProseMirrorNode(
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
  )
  .test();
