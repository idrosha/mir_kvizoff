import type {
  AvatarLoadout,
  LevelRunResult,
  SinglePlayerProgress,
} from "@mir-games/game-core";
import type { AccountSnapshotDto } from "./shop-types.js";

export type ProgressSnapshot = AccountSnapshotDto;

export type ProgressApiClient = {
  load(playerId: string): Promise<ProgressSnapshot>;
  commit(
    playerId: string,
    result: LevelRunResult,
  ): Promise<ProgressSnapshot>;
  saveAvatar(playerId: string, avatar: AvatarLoadout): Promise<ProgressSnapshot>;
};

/** Thin HTTP client for bot-server progress endpoints. */
export function createProgressApiClient(apiBaseUrl: string): ProgressApiClient {
  async function parse(res: Response): Promise<ProgressSnapshot> {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Progress API ${res.status}: ${text}`);
    }
    return (await res.json()) as ProgressSnapshot;
  }

  return {
    async load(playerId: string) {
      const res = await fetch(
        `${apiBaseUrl}/api/progress?playerId=${encodeURIComponent(playerId)}`,
      );
      return parse(res);
    },
    async commit(playerId: string, result: LevelRunResult) {
      const res = await fetch(`${apiBaseUrl}/api/progress/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, result }),
      });
      return parse(res);
    },
    async saveAvatar(playerId: string, avatar: AvatarLoadout) {
      const res = await fetch(`${apiBaseUrl}/api/progress/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, avatar }),
      });
      return parse(res);
    },
  };
}

export type { SinglePlayerProgress };
