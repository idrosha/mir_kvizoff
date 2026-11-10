type Props = {
  title: string;
  onBack: () => void;
};

export function StubScreen({ title, onBack }: Props) {
  return (
    <section className="screen stub-screen">
      <button type="button" className="link-back" onClick={onBack}>
        ← Меню
      </button>
      <h1>{title}</h1>
      <p className="subtitle">Раздел появится в следующих фазах.</p>
    </section>
  );
}
