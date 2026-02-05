declare module 'culori' {
  export type Color = {
    mode?: string;
    r?: number;
    g?: number;
    b?: number;
    l?: number;
    c?: number;
    h?: number;
    alpha?: number;
    [key: string]: number | string | undefined;
  };

  export type RgbColor = {
    mode?: 'rgb' | 'srgb' | string;
    r: number;
    g: number;
    b: number;
    alpha?: number;
    [key: string]: number | string | undefined;
  };

  export function parse(color: string): Color | null;
  export function rgb(color: Color | string): RgbColor | null;
  export function oklch(color: string | Color): Color | null;
  export function lab(color: string | Color): Color | null;
  export function formatRgb(color: RgbColor | Color): string;
}
