import React from "react";
import "./App.css";
import { DefaultConfig } from "./DefaultConfig";
import { AttributesContainer } from "./components/AttributesContainer";
import { CharName5E } from "./components/CharName5E";
import { CharacterInfo5E } from "./components/CharacterInfo5E";
import { SavingThrows5E } from "./components/SavingThrows5E";
import { ProficencyBonus5E } from "./components/ProficencyBonus5E";
import { Skills5E } from "./components/Skills5E";
import { SingleValue5E } from "./components/Base/SingleValue5E";
import { HPPanel5E } from "./components/HPPanel5E";
import { DeathSaves } from "./components/DeathSaves";
import { Inventory5E } from "./components/Inventory5E";
import { Weapons5E } from "./components/Weapons5E";
import { ProficienciesLanguages5E } from "./components/ProficienciesLanguages5E";
import { Bio5E } from "./components/Bio5E";
import { Spells5E } from "./components/Spells5E";
import { Feats5E } from "./components/Feats5E";
import { Counters5E } from "./components/Counters5E";

// Resolves the game id first; the sheet layout lives in the game-wide "dnd5e_config".
export default function App({ Api }) {
  const [gameId, setGameId] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      setGameId((await Api.ClientMediator.sendCommandAsync("Game", "GetGameId")) ?? "fallback");
    })();
  }, [Api]);

  if (!gameId) return <div className="dnd5e_loading">Loading…</div>;
  return <CharacterSheet Api={Api} gameId={gameId} />;
}

function CharacterSheet({ Api, gameId }) {
  const [config, setConfig] = React.useState(undefined);
  const [tab, setTab] = React.useState("stats");
  // Jumping between a feat and its counter: the tab to show and what to highlight there.
  const [counterFocus, setCounterFocus] = React.useState(null);
  const [featFocus, setFeatFocus] = React.useState(null);
  const showCounter = (id) => { setTab("counters"); setCounterFocus({ id, at: Date.now() }); };
  const showFeat = (id) => { setTab("feats"); setFeatFocus({ id, at: Date.now() }); };

  console.log("App component rendered with config:", config);

  React.useEffect(() => {
    const onConfigChange = ({ value }) => {
      setConfig(JSON.parse(value));
    };

    (async () => {
      Api.Properties.Global.Subscribe(gameId, "dnd5e_config", onConfigChange);
      await Api.Properties.Global.Init(gameId, "dnd5e_config", JSON.stringify(DefaultConfig));
      const configProp = await Api.Properties.Global.Get(gameId, "dnd5e_config");
      if (configProp) setConfig(JSON.parse(configProp.value));
    })();

    return () => {
      Api.Properties.Global.Unsubscribe(gameId, "dnd5e_config", onConfigChange);
    };
  }, [gameId]);

  if (!config) return <div className="dnd5e_loading">Loading character…</div>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--dnd-parchment)",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div className="dnd5e_tabs">
        {["stats", "bio", "spells", "feats", "counters"].map((t) => (
          <div key={t} className={`dnd5e_tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {/* Tabs stay mounted (display: none) so their property subscriptions persist.
          The Stats layout is in shared.css (dnd5e_stats_*): one column on narrow screens. */}
      <div className="dnd5e_stats" style={{ display: tab === "stats" ? "flex" : "none" }}>
        <div className="dnd5e_stats_side">
          <CharName5E Api={Api} />
          <AttributesContainer attributesList={config.attributes} Api={Api} />
          <ProficienciesLanguages5E Api={Api} />
        </div>
        <div className="dnd5e_stats_main">
          <CharacterInfo5E Api={Api} />
          <div className="dnd5e_stats_boxes">
            <ProficencyBonus5E Api={Api} />
            <SingleValue5E Api={Api} propertyName="armor" label="Armor Class" />
            <SingleValue5E Api={Api} propertyName="initiative" label="Initiative" rollLabel="Roll" rollOnClick={() => {}} />
            <SingleValue5E Api={Api} propertyName="speed" label="Speed" />
          </div>
          <div className="dnd5e_stats_row">
            <SavingThrows5E Api={Api} attributesList={config.attributes} />
            <HPPanel5E Api={Api} />
          </div>
          <div className="dnd5e_stats_row">
            <Skills5E Api={Api} skills={config.skills} />
            <div className="dnd5e_stats_column">
              <DeathSaves Api={Api} />
              <Weapons5E Api={Api} />
              <Inventory5E Api={Api} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: tab === "bio" ? "flex" : "none", flexDirection: "column", flex: 1, overflowY: "auto" }}>
        <Bio5E Api={Api} />
      </div>

      <div style={{ display: tab === "spells" ? "flex" : "none", flexDirection: "column", flex: 1, padding: "8px", minHeight: 0 }}>
        <Spells5E Api={Api} />
      </div>

      <div style={{ display: tab === "feats" ? "flex" : "none", flexDirection: "column", flex: 1, padding: "8px", minHeight: 0 }}>
        <Feats5E Api={Api} focus={featFocus} onShowCounter={showCounter} />
      </div>

      <div style={{ display: tab === "counters" ? "flex" : "none", flexDirection: "column", flex: 1, padding: "8px", minHeight: 0 }}>
        <Counters5E Api={Api} focus={counterFocus} onShowFeat={showFeat} />
      </div>
    </div>
  );
}
