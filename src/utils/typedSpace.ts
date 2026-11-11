// A typed space, which browsers may turn into a non-breaking one when input is
// read back from the DOM. Not \s, which would match the line ending Enter is
// passed to the input rules as, so that rules ending in it don't apply on
// Enter.
export const typedSpace = "[ \\u00a0]";
