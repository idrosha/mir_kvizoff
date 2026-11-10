type Props = {
  onOneVsOne: () => void;
  onParty: () => void;
  onBack: () => void;
};

/** Plain functional picker: 1v1 matchmaking vs company party room. */
export function OnlineModeScreen({ onOneVsOne, onParty, onBack }: Props) {
  return (
    <section className="screen">
      <button type="button" className="link-back" onClick={onBack}>
        ← Меню
      </button>
      <h1>Онлайн</h1>
      <p className="subtitle">Два режима — без нового визуала, только рабочие переходы.</p>
      <div className="actions" style={{ display: "grid", gap: "0.75rem" }}>
        <button type="button" className="btn btn-block" onClick={onOneVsOne}>
          1 на 1 — случайный матч
        </button>
        <button type="button" className="btn-secondary btn-block" onClick={onParty}>
          Комната для компании (до 30)
        </button>
      </div>
    </section>
  );
}
