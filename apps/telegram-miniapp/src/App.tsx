import { useCallback, useEffect, useState } from "react";
import type { LevelRunResult, LevelSession } from "@mir-games/game-core";
import type {
  AccountSnapshotDto,
  ChampionshipRunDto,
  OnlineMatchPublicDto,
} from "@mir-games/adapters-telegram";
import type { AppBootstrap } from "./bootstrap";
import type { NavTab } from "./components/AppShell";
import { getLevel, MAP_LOCATIONS } from "@mir-games/question-bank";
import { MenuScreen } from "./screens/MenuScreen";
import { MapScreen } from "./screens/MapScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { StubScreen } from "./screens/StubScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { AccountScreen } from "./screens/AccountScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { OnlineLobbyScreen } from "./screens/OnlineLobbyScreen";
import { OnlineMatchScreen } from "./screens/OnlineMatchScreen";
import { OnlineResultScreen } from "./screens/OnlineResultScreen";
import { ChampionshipLobbyScreen } from "./screens/ChampionshipLobbyScreen";
import { ChampionshipRunScreen } from "./screens/ChampionshipRunScreen";
import { ChampionshipResultScreen } from "./screens/ChampionshipResultScreen";

type Route =
  | { name: "menu" }
  | { name: "map" }
  | { name: "play"; session: LevelSession; locationTitle: string; locationArtClass: string }
  | { name: "result"; result: LevelRunResult; commitError: string | null }
  | { name: "shop" }
  | { name: "account" }
  | { name: "settings" }
  | { name: "online-lobby" }
  | { name: "online-match"; match: OnlineMatchPublicDto }
  | { name: "online-result"; match: OnlineMatchPublicDto }
  | { name: "championship-lobby" }
  | { name: "championship-run"; run: ChampionshipRunDto }
  | { name: "championship-result"; run: ChampionshipRunDto }
  | { name: "stub"; title: string };

const STUB_TITLES: Record<string, string> = {
  leaders: "Лидеры",
};

type Props = {
  boot: AppBootstrap;
};

export function App({ boot }: Props) {
  const {
    engine,
    progressApi,
    shopApi,
    onlineApi,
    championshipApi,
    payment,
    storage,
    player,
  } = boot;
  const [route, setRoute] = useState<Route>({ name: "menu" });
  const [progress, setProgress] = useState(() => engine.getProgress());
  const [avatar, setAvatar] = useState(() => engine.getAvatar());
  const [totalPoints, setTotalPoints] = useState(0);
  const [account, setAccount] = useState<AccountSnapshotDto | null>(null);
  const [displayName, setDisplayName] = useState(player.displayName);

  const applyAccount = useCallback(
    (snap: AccountSnapshotDto) => {
      engine.setProgress(snap.progress);
      engine.setAvatar(snap.avatar);
      setProgress(snap.progress);
      setAvatar(snap.avatar);
      setTotalPoints(snap.totalPoints);
      setAccount(snap);
      if (snap.displayName) {
        setDisplayName(snap.displayName);
      }
    },
    [engine],
  );

  const refreshFromServer = useCallback(async () => {
    const snap = await progressApi.load(player.playerId);
    applyAccount(snap);
  }, [applyAccount, player.playerId, progressApi]);

  useEffect(() => {
    void refreshFromServer();
  }, [refreshFromServer]);

  function onNavigate(tab: NavTab): void {
    if (tab === "menu") {
      setRoute({ name: "menu" });
      return;
    }
    if (tab === "map") {
      setRoute({ name: "map" });
      return;
    }
    if (tab === "championship") {
      setRoute({ name: "championship-lobby" });
      return;
    }
    if (tab === "shop") {
      setRoute({ name: "shop" });
      return;
    }
    if (tab === "account") {
      setRoute({ name: "account" });
    }
  }

  function onMenuSelect(id: string): void {
    if (id === "single") {
      setRoute({ name: "map" });
      return;
    }
    if (id === "online") {
      setRoute({ name: "online-lobby" });
      return;
    }
    if (id === "championship") {
      setRoute({ name: "championship-lobby" });
      return;
    }
    if (id === "shop") {
      setRoute({ name: "shop" });
      return;
    }
    if (id === "account") {
      setRoute({ name: "account" });
      return;
    }
    if (id === "settings") {
      setRoute({ name: "settings" });
      return;
    }
    setRoute({ name: "stub", title: STUB_TITLES[id] ?? id });
  }

  function startLevel(levelIndex: number): void {
    const level = getLevel(levelIndex);
    if (!level) {
      window.alert("Уровень не найден");
      return;
    }
    const session = engine.startLevel(level);
    if (!session) {
      window.alert("Уровень закрыт");
      return;
    }
    const loc = MAP_LOCATIONS.find((l) => l.levelIndex === levelIndex);
    setRoute({
      name: "play",
      session,
      locationTitle: loc?.title ?? "Уровень",
      locationArtClass: loc?.artClass ?? "loc-egypt",
    });
  }

  const finishPlay = useCallback(
    async (result: LevelRunResult) => {
      let commitError: string | null = null;
      try {
        engine.commitRun(result);
        const snap = await progressApi.commit(player.playerId, result);
        applyAccount(snap);
      } catch (err) {
        commitError = err instanceof Error ? err.message : String(err);
        setProgress(engine.getProgress());
      }
      setRoute({ name: "result", result, commitError });
    },
    [applyAccount, engine, player.playerId, progressApi],
  );

  if (route.name === "menu") {
    return (
      <MenuScreen
        displayName={displayName}
        avatar={avatar}
        totalPoints={totalPoints}
        onSelect={onMenuSelect}
        onNavigate={onNavigate}
        onAvatar={() => setRoute({ name: "account" })}
      />
    );
  }
  if (route.name === "stub") {
    return <StubScreen title={route.title} onBack={() => setRoute({ name: "menu" })} />;
  }
  if (route.name === "online-lobby") {
    return (
      <OnlineLobbyScreen
        playerId={player.playerId}
        avatar={avatar}
        onlineApi={onlineApi}
        totalPoints={totalPoints}
        onMatched={(match) => setRoute({ name: "online-match", match })}
        onBack={() => setRoute({ name: "menu" })}
        onNavigate={onNavigate}
      />
    );
  }
  if (route.name === "online-match") {
    return (
      <OnlineMatchScreen
        playerId={player.playerId}
        onlineApi={onlineApi}
        initialMatch={route.match}
        onFinished={(match) => setRoute({ name: "online-result", match })}
      />
    );
  }
  if (route.name === "online-result") {
    return (
      <OnlineResultScreen
        match={route.match}
        onAgain={() => setRoute({ name: "online-lobby" })}
        onMenu={() => {
          void refreshFromServer();
          setRoute({ name: "menu" });
        }}
      />
    );
  }
  if (route.name === "championship-lobby") {
    return (
      <ChampionshipLobbyScreen
        playerId={player.playerId}
        championshipApi={championshipApi}
        payment={payment}
        totalPoints={totalPoints}
        onStarted={(run) => setRoute({ name: "championship-run", run })}
        onAccountRefresh={() => {
          void refreshFromServer();
        }}
        onBack={() => setRoute({ name: "menu" })}
        onNavigate={onNavigate}
      />
    );
  }
  if (route.name === "championship-run") {
    return (
      <ChampionshipRunScreen
        playerId={player.playerId}
        championshipApi={championshipApi}
        initialRun={route.run}
        onFinished={(run) => setRoute({ name: "championship-result", run })}
      />
    );
  }
  if (route.name === "championship-result") {
    return (
      <ChampionshipResultScreen
        run={route.run}
        onLobby={() => {
          void refreshFromServer();
          setRoute({ name: "championship-lobby" });
        }}
        onMenu={() => {
          void refreshFromServer();
          setRoute({ name: "menu" });
        }}
      />
    );
  }
  if (route.name === "shop" && account) {
    return (
      <ShopScreen
        playerId={player.playerId}
        shopApi={shopApi}
        payment={payment}
        account={account}
        onAccountChange={applyAccount}
        onBack={() => setRoute({ name: "menu" })}
        onNavigate={onNavigate}
      />
    );
  }
  if (route.name === "account" && account) {
    return (
      <AccountScreen
        playerId={player.playerId}
        shopApi={shopApi}
        account={account}
        onAccountChange={applyAccount}
        onDisplayNameChange={setDisplayName}
        onBack={() => setRoute({ name: "menu" })}
        onNavigate={onNavigate}
        onSettings={() => setRoute({ name: "settings" })}
        onShop={() => setRoute({ name: "shop" })}
      />
    );
  }
  if (route.name === "settings" && account) {
    return (
      <SettingsScreen
        playerId={player.playerId}
        shopApi={shopApi}
        storage={storage}
        account={account}
        onAccountChange={applyAccount}
        onBack={() => setRoute({ name: "account" })}
        onNavigate={onNavigate}
      />
    );
  }
  if (route.name === "map") {
    return (
      <MapScreen
        progress={progress}
        avatar={avatar}
        totalPoints={totalPoints}
        onBack={() => setRoute({ name: "menu" })}
        onPlayLevel={startLevel}
        onAvatar={() => setRoute({ name: "account" })}
        onNavigate={onNavigate}
      />
    );
  }
  if (route.name === "play") {
    return (
      <PlayScreen
        session={route.session}
        avatar={avatar}
        locationTitle={route.locationTitle}
        locationArtClass={route.locationArtClass}
        totalPoints={totalPoints}
        onFinished={(result) => {
          void finishPlay(result);
        }}
      />
    );
  }
  if (route.name === "result") {
    return (
      <ResultScreen
        result={route.result}
        avatar={avatar}
        commitError={route.commitError}
        totalPoints={totalPoints}
        onMap={() => setRoute({ name: "map" })}
        onMenu={() => setRoute({ name: "menu" })}
        onShop={() => setRoute({ name: "shop" })}
        onNavigate={onNavigate}
      />
    );
  }
  return (
    <section className="screen">
      <p>Загрузка аккаунта…</p>
    </section>
  );
}
