export interface HexCoord {
  q: number;
  r: number;
}

export function hexKey(coord: HexCoord) {
  return `${coord.q},${coord.r}`;
}

export function hexDistance(a: HexCoord, b: HexCoord) {
  const aq = a.q;
  const ar = a.r;
  const as = -aq - ar;
  const bq = b.q;
  const br = b.r;
  const bs = -bq - br;
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(as - bs));
}

export function hexNeighbors(coord: HexCoord) {
  return [
    { q: coord.q + 1, r: coord.r },
    { q: coord.q + 1, r: coord.r - 1 },
    { q: coord.q, r: coord.r - 1 },
    { q: coord.q - 1, r: coord.r },
    { q: coord.q - 1, r: coord.r + 1 },
    { q: coord.q, r: coord.r + 1 },
  ];
}

export function hexAtPoint(
  x: number,
  y: number,
  options: { centerX: number; centerY: number; size: number },
): HexCoord {
  const px = x - options.centerX;
  const py = y - options.centerY;
  const q = ((Math.sqrt(3) / 3) * px - (1 / 3) * py) / options.size;
  const r = ((2 / 3) * py) / options.size;
  return cubeRound(q, r);
}

function cubeRound(q: number, r: number) {
  const x = q;
  const z = r;
  const y = -x - z;

  const rx = Math.round(x);
  const ry = Math.round(y);
  const rz = Math.round(z);

  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);

  if (xDiff > yDiff && xDiff > zDiff) {
    return { q: -ry - rz, r: rz };
  }

  if (yDiff > zDiff) {
    return { q: rx, r: rz };
  }

  return { q: rx, r: -rx - ry };
}
