const steps = [
  {
    name: "Usinagem",
    hours: 18,
    text: "Platinas e pontes cortadas em latão e retificadas à mão até dois centésimos de milímetro.",
  },
  {
    name: "Decoração",
    hours: 46,
    text: "Côtes de Genève, perlage, chanfros polidos a 45 graus e parafusos azulados a fogo.",
  },
  {
    name: "Montagem",
    hours: 22,
    text: "164 componentes, ajustados um a um e lubrificados em 38 pontos.",
  },
  {
    name: "Regulagem",
    hours: 14,
    text: "Cinco posições e três temperaturas, até o relógio variar menos de 4 segundos por dia.",
  },
  {
    name: "Teste",
    hours: 12,
    text: "Encaixe na caixa e 21 dias num pulso mecânico antes de sair da oficina.",
  },
];

const total = steps.reduce((n, s) => n + s.hours, 0);
const tones = ["bg-steel", "bg-ink", "bg-blued", "bg-ink-2", "bg-hairline"];

/** Where the 112 hours go: a proportional bar, because the proportions are the story. */
export function Making() {
  return (
    <section id="oficina" aria-labelledby="making-title" className="scroll-mt-24 bg-rhodium-50 py-24 md:py-32">
      <div className="frame">
        <div className="grid gap-6 md:grid-cols-12">
          <h2 id="making-title" className="display-l md:col-span-6">
            Para onde vão as {total} horas.
          </h2>
          <p className="lede md:col-span-5 md:col-start-8 md:self-end">
            Cada relógio passa por quatro relojoeiros em Le Sentier. Quase metade do tempo vai para acabamentos que só
            aparecem pelo fundo de safira.
          </p>
        </div>

        <figure className="mt-14 md:mt-20">
          <div
            className="flex h-3 w-full overflow-hidden rounded-full"
            role="img"
            aria-label={`Distribuição das ${total} horas: ${steps.map((s) => `${s.name.toLowerCase()} ${s.hours} horas`).join(", ")}.`}
          >
            {steps.map((s, i) => (
              <div
                key={s.name}
                className={`${tones[i]} h-full border-r-2 border-rhodium-50 last:border-r-0`}
                style={{ width: `${(s.hours / total) * 100}%` }}
              />
            ))}
          </div>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 md:flex md:gap-0">
            {steps.map((s, i) => (
              <li key={s.name} className="md:pr-6" style={{ flexBasis: `${(s.hours / total) * 100}%`, minWidth: 0 }}>
                <div className="flex items-center gap-2 md:block">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full md:hidden ${tones[i]}`} aria-hidden />
                  <p className="numeric text-[0.8125rem] text-ink-2">
                    {i + 1}. {s.name}
                  </p>
                </div>
                <p className="numeric mt-1 font-display text-[2rem] leading-none">{s.hours} h</p>
                <p className="mt-3 max-w-[18rem] text-[0.9375rem] leading-relaxed text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </figure>
      </div>
    </section>
  );
}
