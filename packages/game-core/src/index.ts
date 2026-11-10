export {
  ANSWER_TIME_MS,
  BLOCK_SCORE_GATE,
  BLOCK_SIZE,
  POINTS_PER_CORRECT,
  QUESTIONS_PER_LEVEL,
} from "./constants.js";

export {
  applyLevelResult,
  blockIndexForLevel,
  createEmptyProgress,
  getLevelRecord,
  isBlockCompleted,
  isBlockUnlocked,
  isLevelUnlocked,
  levelsInBlock,
  sumBlockScore,
} from "./gating.js";

export { countCorrect, gradeAnswer, sumScore } from "./scoring.js";

export { LevelSession } from "./session.js";
export type { LevelSessionState, SubmitResult } from "./session.js";

export { createGameCore } from "./engine.js";
export type { GameCoreEngine } from "./engine.js";

export type { GameCorePorts } from "./ports.js";

export type {
  AvatarLoadout,
  ChoiceOption,
  Difficulty,
  EquipmentItem,
  EquipmentSlot,
  GradedAnswer,
  KnowledgeDomain,
  LevelDefinition,
  LevelRecord,
  LevelRunResult,
  MultiChoiceQuestion,
  PlayerAnswer,
  Question,
  QuestionFormat,
  SingleChoiceQuestion,
  SinglePlayerProgress,
  TextQuestion,
} from "./types.js";

export {
  CATEGORY_TO_SLOT,
  COSMETIC_CATEGORIES,
  SLOT_TO_CATEGORY,
  STARTER_ITEM_IDS,
  STARTER_MONEY_BALANCE,
  equipOwnedItem,
  findShopItem,
  getShopCatalog,
  prepareRetryForCommit,
  purchaseShopItem,
  unequipSlot,
  unlockChampionshipCosmetics,
} from "./shop.js";
export type {
  CosmeticCategory,
  EconomyMutationResult,
  PlayerEconomy,
  ShopCurrency,
  ShopItem,
  ShopProductKind,
  ShopSection,
} from "./shop.js";

export {
  ONLINE_ROUNDS_PER_MATCH,
  ONLINE_RATING_PER_SCORE_DIFF,
  ONLINE_RATING_START,
  applyOnlineRating,
  assertOnlineMatchDefinition,
  computeOnlineRatingDelta,
  gradeOnlineAnswer,
  nextRoundDeadlineMs,
  scoreFromGraded,
  toPublicQuestion,
} from "./online.js";
export type {
  OnlineMatchDefinition,
  OnlineMatchPlayerSnapshot,
  OnlineMatchStatus,
  OnlineRoundDefinition,
  OnlineRoundKind,
  PublicMultiChoiceQuestion,
  PublicQuestion,
  PublicSingleChoiceQuestion,
  PublicTextQuestion,
} from "./online.js";

export {
  PARTY_JOIN_CODE_LENGTH,
  PARTY_MAX_PLAYERS,
  assertPartyCapacity,
  canJoinPartyRoom,
  generatePartyJoinCode,
  isValidPartyJoinCode,
  normalizePartyJoinCode,
  sortPartyLeaderboard,
} from "./party.js";
export type {
  PartyRoomRole,
  PartyRoomStatus,
  PartyRoomVisibility,
} from "./party.js";

export {
  CHAMPIONSHIP_ENTRY_PRODUCT_ID,
  DEFAULT_CHAMPIONSHIP_CONFIG,
  DEFAULT_ENTRY_FEE_MONEY,
  DEFAULT_OPEN_DAYS_OF_MONTH,
  DEFAULT_PRIZE_POOL_SHARE,
  assertValidStubChampionshipReceipt,
  championshipPeriodKey,
  createChampionshipConfig,
  isChampionshipOpenOn,
  normalizeOpenDays,
  prizeContributionFromEntry,
  selectChampionshipWinner,
} from "./championship.js";
export type {
  ChampionshipConfig,
  ChampionshipEntrySnapshot,
  ChampionshipPeriodStatus,
  WinnerSelection,
} from "./championship.js";
