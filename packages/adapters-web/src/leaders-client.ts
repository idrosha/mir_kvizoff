export type LeaderboardEntryDto = {
  playerId: string;
  displayName?: string;
  onlineRating: number;
  totalPoints: number;
  levelsCompleted: number;
};

export type LeadersApiClient = {
  list(limit?: number): Promise<LeaderboardEntryDto[]>;
};

export function createLeadersApiClient(apiBaseUrl: string): LeadersApiClient {
  return {
    async list(limit = 20) {
      const qs = new URLSearchParams({ limit: String(limit) });
      const res = await fetch(`${apiBaseUrl}/api/leaders?${qs}`);
      const body = (await res.json()) as {
        entries?: LeaderboardEntryDto[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Leaders API ${res.status}`);
      }
      return body.entries ?? [];
    },
  };
}
