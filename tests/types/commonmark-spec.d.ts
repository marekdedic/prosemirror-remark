declare module "commonmark-spec" {
  export interface Example {
    html: string;
    markdown: string;
    number: number;
    section: string;
  }

  export const tests: Array<Example>;
  export const text: string;
}
