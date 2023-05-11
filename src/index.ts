import { Application, Loader, Texture, AnimatedSprite } from "pixi.js";
import "./style.css";

import { Flag } from "./Flag";

const gameWidth = 1200;
const gameHeight = 1000;
const GAME_SIZE = 30;
const TILE_SIZE = 32;
const MINES_AMOUNT = 150;
const rate = MINES_AMOUNT / (GAME_SIZE * GAME_SIZE);

let flags: Array<Flag> = [];

enum TileTypes {
  BOMB = -2,
  DEFAULT = -1,
  FREE = 0,
  HOT = 1,
}

class Map {
  private _board: Array<Array<number>> = [];
  
  public get board(): Array<Array<number>> {
    return this._board;
  }
  
  public getTile(x: number, y: number): number {
    return this._board[x][y];
  }
  
  public setTile(x: number, y: number, value: number): void {
    this._board[x][y] = value;
  }
  
  public isTileBomb(x: number, y: number): boolean {
    return this._board[x][y] === TileTypes.BOMB;
  }
  
  public renderTile(x: number, y: number): void {
    let tileImg: AnimatedSprite;
    let tile = this._board[x][y];
    
    if (this._board[x][y] === -2) { // bomb
      tileImg = new AnimatedSprite([Texture.from(`-1.png`)]);
    } else {
      tileImg = new AnimatedSprite([Texture.from(`${tile}.png`)]);
    }
    
    // condition to check tile name
    tileImg.x = x * TILE_SIZE;
    tileImg.anchor.set(0);
    tileImg.interactive = true;
    tileImg.buttonMode = true;
    tileImg.y = y * TILE_SIZE;
    tileImg
    .on('mousedown', (tile) => onMouseDown({ tile }))
    .on('rightdown', (tile) => onRightDown({ tile }));
    app.stage.addChild(tileImg);
  }
  
  public renderMap(): void {
    this._board.forEach((row, i) => {
      row.forEach((_, j) => {
        this.renderTile(i, j)
      })
      // renderFlags();
    });
  }
  
  public generateBoard(): void {
    let bombs = 0;
    for (let i = 0; i < GAME_SIZE; i++) {
      this._board[i] = [];
      for (let j = 0; j < GAME_SIZE; j++) {
        let tile: number;
        let chance: number = Math.floor(Math.random() / rate);
        if (!chance) {
          tile = TileTypes.BOMB;
          bombs++;
        } else {
          tile = TileTypes.DEFAULT;
        }
        this._board[i].push(tile);
      }
    }
    console.log(bombs);
  }
}

const app = new Application({
  backgroundColor: 0xd3d3d3,
  width: gameWidth,
  height: gameHeight,
  autoStart: true,
  transparent: true,
});

const map = new Map();

async function loadGameAssets(): Promise<void> {
  return new Promise((res, rej) => {
    const loader = Loader.shared;
    loader.add("board", "./assets/simpleSpriteSheet.json");
    loader.add("flag", "./assets/flags.json");
    
    loader.onComplete.once(() => {
      res();
    });
    
    loader.onError.once(() => {
      rej();
    });
    
    loader.load();
  });
}

window.onload = async (): Promise<void> => {
  await loadGameAssets();
  
  document.body.appendChild(app.view);
  
  map.generateBoard();
  map.renderMap();
  onMouseDown({_x: Math.floor(Math.random() * GAME_SIZE), _y:Math.floor(Math.random() * GAME_SIZE), alwaysSucceed: true, tile: null})
  
  app.stage.interactive = true;
};

function countBombsAroundTileAndReveal(x: number, y: number) {
  let count = 0;
  for (let i = Math.max(0, x - 1); i <= Math.min(GAME_SIZE - 1, x + 1); i++) {
    for (let j = Math.max(0, y - 1); j <= Math.min(GAME_SIZE - 1, y + 1); j++) {
      const count = countBombsAroundTile(i, j);
      
      if (map.getTile(i, j) !== TileTypes.BOMB && map.getTile(i, j) !== TileTypes.FREE && flags.find((flag) => flag.x === i && flag.y === j) === undefined) {
        map.setTile(i, j, count);
        if (map.getTile(i, j) !== TileTypes.HOT && count === 0) {
          countBombsAroundTileAndReveal(i, j);
        } else if (count === 0) {
          return
        }
      }
    }
  }
}

function countBombsAroundTile(x: number, y: number) {
  let count = 0;
  
  for (let i = Math.max(0, x - 1); i <= Math.min(GAME_SIZE - 1, x + 1); i++) {
    for (let j = Math.max(0, y - 1); j <= Math.min(GAME_SIZE - 1, y + 1); j++) {
      if (i === x && j === y) {
        continue;
      }
      if (map.getTile(i, j) === -2) {
        count++;
      }
    }
  }
  return count;
}

function getCoordsOfFreeAroundTile(x: number, y: number) {
  let count = 0;
  
  for (let i = Math.max(0, x - 1); i <= Math.min(GAME_SIZE - 1, x + 1); i++) {
    for (let j = Math.max(0, y - 1); j <= Math.min(GAME_SIZE - 1, y + 1); j++) {
      if (i === x && j === y) {
        continue;
      }
      if (map.getTile(i, j) === -2) {
        count++;
      }
    }
  }
  return count;
}

function onRightDown({ tile }: { tile: { data: { global: { x: number; y: number } } } }) {
  const x = Math.floor(tile.data.global.x / 32);
  const y = Math.floor(tile.data.global.y / 32);
  const flagIndex = flags.findIndex((flag) => flag.x === x && flag.y === y)
  if (flagIndex > -1) {
    flags.splice(flagIndex, 1);
  } else {
    let flag = new Flag(x, y);
    flag.tile.on('rightdown', (flag) => onMouseDownFlag({ flag })).on('mousedown', (flag) => onMouseDownFlag({ flag }))
    flags.push(flag);
  }
  flags.forEach((flag) => {
    if (!flag.rendered) {
      app.stage.addChild(flag.renderFlag());
    }
  });
  // flags = flags.filter((flag) => flag.x !== x && flag.y !== y)
  // renderFlags();
}


function onMouseDown({ tile, _x, _y, alwaysSucceed }: { tile: AnimatedSprite | null; _x?: number; _y?: number, alwaysSucceed: boolean}) {
  alwaysSucceed = alwaysSucceed || false;
  const x = _x || Math.floor(tile.data.global.x / 32);
  const y = _y || Math.floor(tile.data.global.y / 32);
  
  if (map.isTileBomb(x, y) && !alwaysSucceed) {
    console.log('game over');
    map.setTile(x, y, TileTypes.BOMB);
  } else if (map.getTile(x, y) !== TileTypes.BOMB) {
    const count = countBombsAroundTile(x, y)
    if (count === 0 && map.getTile(x, y) !== TileTypes.FREE) {
      map.setTile(x, y, TileTypes.FREE);
      countBombsAroundTileAndReveal(x, y)
    } else {
      map.setTile(x, y, count);
    }
  }
  map.renderMap();
}

document.addEventListener('contextmenu', e => {
  e.preventDefault();
});

function onMouseDownFlag({ flag }: { flag: Flag }) {
  app.stage.removeChild<AnimatedSprite>(flag.tile);
  
}