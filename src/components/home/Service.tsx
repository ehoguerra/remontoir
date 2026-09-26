const promises = [
  {
    title: "Cinco anos de garantia",
    text: "Cobre o movimento e a caixa. Se o relógio atrasar ou adiantar fora da tolerância, a regulagem é por nossa conta.",
  },
  {
    title: "Revisão na boutique",
    text: "A cada sete anos o calibre é desmontado, limpo e relubrificado em São Paulo, sem precisar viajar para a Suíça.",
  },
  {
    title: "Entrega segurada",
    text: "Enviamos para todo o Brasil com seguro e assinatura na entrega. Ou retire na boutique, com o relógio já ajustado ao seu pulso.",
  },
];

export function Service() {
  return (
    <section
      id="servico"
      aria-labelledby="service-title"
      className="scroll-mt-24 border-t border-hairline py-24 md:py-32"
    >
      <div className="frame grid gap-12 md:grid-cols-12">
        <h2 id="service-title" className="display-m md:col-span-4">
          A casa cuida do relógio depois da venda.
        </h2>
        <ul className="grid gap-10 sm:grid-cols-3 md:col-span-8">
          {promises.map((p) => (
            <li key={p.title} className="border-t border-ink pt-5">
              <h3 className="font-sans text-[1.0625rem] font-semibold">{p.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
