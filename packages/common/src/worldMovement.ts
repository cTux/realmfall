export interface WorldMoveRequest {
  requestId: string;
  target: {
    q: number;
    r: number;
  };
}

export type WorldMoveResponse =
  | {
      ok: true;
      cooldownMs: number;
    }
  | {
      ok: false;
      remainingCooldownMs: number;
    };
