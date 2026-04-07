import type { Vec2 } from "./lib/types";

export type Tilemap = {
  tilemap: string;
  name: string;
  tileSize: number;
  width: number;
  height: number;
  rows: number;
  cols: number;
  attributes: { pos: Vec2; attributes: { [key: string]: any } }[];
  objects: {pos: Vec2, attributes: { [key: string]: any }, width: number, height: number, image: string; name: string}[]
};
