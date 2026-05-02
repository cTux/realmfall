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
      requestId: string;
      cooldownMs: number;
    }
  | {
      ok: false;
      requestId: string;
      remainingCooldownMs: number;
    };
