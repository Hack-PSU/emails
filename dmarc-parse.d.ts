declare module 'dmarc-parse' {
  export function parse(xml: string): Promise<any>;
}
