// The characters of a typed space: browsers may turn a space into a
// non-breaking one when input is read back from the DOM. Not \s, which would
// match the line ending Enter is passed to the input rules as, so that rules
// ending in a typed space don't apply on Enter.
export const typedSpaceCharacters = " \\u00a0";

// A typed space, as a regular expression source
export const typedSpace = `[${typedSpaceCharacters}]`;
