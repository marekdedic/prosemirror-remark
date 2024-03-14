function supportRangeDOMRect(): void {
  document.createRange = (): Range => {
    const range = new Range();

    range.getBoundingClientRect = (): DOMRect => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: (): Record<string, never> => ({}),
    });

    range.getClientRects = (): DOMRectList => ({
      item: () => null,
      length: 0,
      [Symbol.iterator]: jest.fn(),
    });

    return range;
  };
}

// eslint-disable-next-line jest/require-hook
supportRangeDOMRect();
