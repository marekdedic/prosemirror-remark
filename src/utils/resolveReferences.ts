import type { Attrs } from "prosemirror-model";

import type { DefinitionExtensionContext } from "../syntax-extensions/DefinitionExtension";

export function resolveReferences(
  references: Record<string, Array<{ attrs: Attrs }>>,
  definitions: DefinitionExtensionContext["definitions"],
  urlAttribute: string,
): void {
  for (const id in references) {
    if (!(id in definitions)) {
      continue;
    }
    const definition = definitions[id];
    for (const reference of references[id]) {
      const attrs = reference.attrs as Record<
        string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Attrs can be any
        any
      >;
      attrs[urlAttribute] = definition.url;
      if (definition.title !== undefined) {
        attrs["title"] = definition.title;
      }
    }
  }
}
