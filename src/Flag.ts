import { AnimatedSprite, Texture } from "pixi.js";

export class Flag {
  private _x: number;
  private _y: number;
  private _tile: AnimatedSprite;
  private _rendered: boolean;

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
    this._tile = new AnimatedSprite([
      Texture.from("flag-1.png"),
      Texture.from("flag-2.png"),
      Texture.from("flag-3.png"),
    ]);
    this._rendered = false;
  }

  public get coords(): number[] {
    return [this._x, this._y];
  }

  public get x(): number {
    return this._x;
  }

  public get y(): number {
    return this._y;
  }

  public get tile(): AnimatedSprite {
    return this._tile;
  }

  public get rendered(): boolean {
    return this._rendered;
  }

  public setRendered(value: boolean): void {
    this._rendered = value;
  }

  public renderFlag(): AnimatedSprite {
    this._tile.x = this.x * 32 + 7;
    this._tile.anchor.set(0);
    this._tile.interactive = true;
    this._tile.buttonMode = true;
    this._tile.y = this.y * 32 + 2;
    this._tile.loop = true;
    this._tile.animationSpeed = 0.1;
    this._tile.play();
    this._rendered = true;
    return this._tile;
  }
}