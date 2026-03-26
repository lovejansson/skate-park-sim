import { Sprite } from "./lib";
import type { Vec2 } from "./lib/types";
import type Play from "./Play";

type Skill = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export default class Skater extends Sprite {

  skill: Skill;
  who: string;

  constructor(scene: Play, pos: Vec2, who: string, skill: Skill) {
    super(scene, pos, 16, 32, "s");
    this.who = who;
    this.skill = skill;
  }

  update(): void {
    throw new Error("Method not implemented.");
  }
}
