import {
  hexDistance,
  hexNeighbors,
  hexKey as makeHexKey,
  type HexCoord as RuntimeHexCoord,
} from '../game/hex';
import { EventEmitter } from './EventEmitter';

export class HexCoord extends EventEmitter {
  public readonly q: number;
  public readonly r: number;

  constructor(q: number, r: number) {
    super();
    this.q = q;
    this.r = r;
  }

  static from(value: RuntimeHexCoord | HexCoord): HexCoord {
    return new HexCoord(value.q, value.r);
  }

  toRuntimeCoord(): RuntimeHexCoord {
    return { q: this.q, r: this.r };
  }

  toString(): string {
    return `${this.q},${this.r}`;
  }

  toKey(): string {
    return makeHexKey(this.toRuntimeCoord());
  }

  equals(other?: RuntimeHexCoord | HexCoord | null): boolean {
    return Boolean(other && this.q === other.q && this.r === other.r);
  }

  distanceTo(other: RuntimeHexCoord | HexCoord): number {
    return hexDistance(this.toRuntimeCoord(), HexCoord.from(other).toRuntimeCoord());
  }

  neighbors(): HexCoord[] {
    return hexNeighbors(this.toRuntimeCoord()).map(({ q, r }) => new HexCoord(q, r));
  }
}
