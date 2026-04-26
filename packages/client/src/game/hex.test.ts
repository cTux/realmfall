import { hexAtPoint, hexDistance, hexKey, hexNeighbors } from './hex';

describe('hex helpers', () => {
  it('builds stable keys and distances', () => {
    expect(hexKey({ q: 3, r: -2 })).toBe('3,-2');
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
    expect(hexDistance({ q: 2, r: -1 }, { q: 0, r: 0 })).toBe(2);
  });

  it('returns the six adjacent neighbors in axial order', () => {
    expect(hexNeighbors({ q: 4, r: -3 })).toEqual([
      { q: 5, r: -3 },
      { q: 5, r: -4 },
      { q: 4, r: -4 },
      { q: 3, r: -3 },
      { q: 3, r: -2 },
      { q: 4, r: -2 },
    ]);
  });

  it('rounds screen points back to the nearest hex', () => {
    const size = 34;

    expect(hexAtPoint(200, 160, { centerX: 200, centerY: 160, size })).toEqual({
      q: 0,
      r: 0,
    });

    const pointForAdjacentHex = {
      x: Math.sqrt(3) * size + 200,
      y: 160,
    };

    expect(
      hexAtPoint(pointForAdjacentHex.x, pointForAdjacentHex.y, {
        centerX: 200,
        centerY: 160,
        size,
      }),
    ).toEqual({ q: 1, r: 0 });
  });
});
