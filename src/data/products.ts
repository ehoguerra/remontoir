import type { Product, Strap, StrapProduct, WatchProduct } from "./types";

export const straps: Strap[] = [
  { id: "jacare-marinho", name: "Jacaré azul-marinho", material: "alligator", color: "#1c2645", stitch: "#1c2645" },
  { id: "bezerro-conhaque", name: "Bezerro conhaque", material: "calf", color: "#7a4527", stitch: "#eadcc6" },
  { id: "camurca-pedra", name: "Camurça cinza-pedra", material: "suede", color: "#8b8984", stitch: "#8b8984" },
  { id: "borracha-noite", name: "Borracha vulcanizada", material: "rubber", color: "#15181e", stitch: "#15181e" },
  { id: "jacare-preto", name: "Jacaré preto", material: "alligator", color: "#141518", stitch: "#141518" },
  { id: "bezerro-preto", name: "Bezerro preto, costura clara", material: "calf", color: "#18191c", stitch: "#e8e4dc" },
  { id: "bezerro-oliva", name: "Bezerro oliva", material: "calf", color: "#4a5234", stitch: "#4a5234" },
  { id: "camurca-taupe", name: "Camurça taupe", material: "suede", color: "#8a7462", stitch: "#8a7462" },
  { id: "bezerro-areia", name: "Bezerro areia", material: "calf", color: "#a58d6f", stitch: "#f1e7d7" },
];

export const strapById = (id: string): Strap => {
  const strap = straps.find((s) => s.id === id);
  if (!strap) throw new Error(`Unknown strap: ${id}`);
  return strap;
};

/** Straps sold on their own; also the choices offered on every watch page. */
export const strapChoices = ["jacare-marinho", "bezerro-conhaque", "camurca-pedra", "borracha-noite"];

const watchCommonSpecs = (opts: {
  diameter: string;
  thickness: string;
  caseLabel: string;
  water: string;
  calibre: string;
  reserve: string;
  jewels: string;
  strap: string;
  buckle: string;
}) => [
  { label: "Diâmetro", value: opts.diameter },
  { label: "Espessura", value: opts.thickness },
  { label: "Caixa", value: opts.caseLabel },
  { label: "Vidro", value: "Safira abaulada, antirreflexo nas duas faces" },
  { label: "Fundo", value: "Safira, parafusado, com gravação" },
  { label: "Estanqueidade", value: opts.water },
  { label: "Calibre", value: opts.calibre },
  { label: "Reserva de marcha", value: opts.reserve },
  { label: "Frequência", value: "28.800 alternâncias/hora (4 Hz)" },
  { label: "Rubis", value: opts.jewels },
  { label: "Pulseira", value: opts.strap },
  { label: "Fecho", value: opts.buckle },
];

const watches: WatchProduct[] = [
  {
    kind: "watch",
    slug: "lune-39",
    name: "Lune 39",
    price: 58400,
    tagline: "A lua de hoje, no pulso.",
    description: [
      "O disco da lua gira um dente por dia e completa o ciclo em 29 dias, 12 horas e 44 minutos. Só precisa de um ajuste a cada 122 anos.",
      "O mostrador azul recebe o acabamento raiado à mão e sete camadas de verniz. A luz corre pelo mostrador conforme o pulso se move.",
      "Os ponteiros dauphine são facetados em duas águas: um lado sempre brilha, o outro fica escuro, e a hora se lê de qualquer ângulo.",
    ],
    availability: "in-stock",
    leadTime: "Pronta entrega. Chega em até 5 dias úteis.",
    featured: true,
    complicationLabel: "Fase da lua",
    caseLabel: "Aço",
    calibre: "R.03",
    specs: watchCommonSpecs({
      diameter: "39 mm",
      thickness: "11,4 mm",
      caseLabel: "Aço 316L, polido e acetinado",
      water: "50 m",
      calibre: "R.03, corda manual, fase da lua",
      reserve: "72 horas",
      jewels: "23",
      strap: "Jacaré azul-marinho, 20/16 mm",
      buckle: "Fivela ardillon em aço",
    }),
    model: {
      diameter: 39,
      thickness: 11.4,
      caseMaterial: "steel",
      dial: { color: "#1b2c66", finish: "sunburst", print: "#e9edf6" },
      indices: "baton",
      hands: "dauphine",
      handFinish: "rhodium",
      complication: "moonphase",
      lume: false,
      strapId: "jacare-marinho",
    },
  },
  {
    kind: "watch",
    slug: "regulateur-39",
    name: "Régulateur 39",
    price: 112000,
    tagline: "Horas, minutos e segundos, cada um no seu lugar.",
    description: [
      "O regulador era o relógio de referência das oficinas: horas e segundos em mostradores próprios, o minuto sozinho no centro. Nada se sobrepõe, nada se confunde.",
      "O mostrador é de esmalte grand feu, queimado a 800 °C em sete passagens. O branco não amarela e cada peça sai com pequenas diferenças.",
      "Caixa em ouro amarelo 18 quilates e ponteiros Breguet azulados a fogo, um a um, até chegarem ao tom de aço-azul.",
    ],
    availability: "made-to-order",
    leadTime: "Série de 25 peças. Sob encomenda, entrega em 14 semanas.",
    featured: true,
    edition: "Série de 25 peças",
    complicationLabel: "Regulador",
    caseLabel: "Ouro amarelo",
    calibre: "R.07",
    specs: watchCommonSpecs({
      diameter: "39 mm",
      thickness: "10,8 mm",
      caseLabel: "Ouro amarelo 18 k",
      water: "30 m",
      calibre: "R.07, corda manual, regulador",
      reserve: "68 horas",
      jewels: "21",
      strap: "Jacaré preto, 20/16 mm",
      buckle: "Fivela ardillon em ouro amarelo",
    }),
    model: {
      diameter: 39,
      thickness: 10.8,
      caseMaterial: "yellow-gold",
      dial: { color: "#f4f1e8", finish: "enamel", print: "#1a2140" },
      indices: "breguet",
      hands: "breguet",
      handFinish: "blued",
      complication: "regulator",
      lume: false,
      strapId: "jacare-preto",
    },
  },
  {
    kind: "watch",
    slug: "nocturne-40",
    name: "Nocturne 40",
    price: 42800,
    tagline: "Feito para ser lido no escuro.",
    description: [
      "Os índices e ponteiros levam Super-LumiNova aplicada em três camadas. Dez minutos de luz bastam para a hora aparecer a noite inteira.",
      "A caixa de titânio grau 5 pesa 38 gramas. Os segundos centrais batem oito vezes por segundo, como todo calibre de 4 Hz.",
      "O mostrador preto tem acabamento granulado para não refletir. De dia é sóbrio; à noite, é o relógio mais fácil de ler da coleção.",
    ],
    availability: "in-stock",
    leadTime: "Pronta entrega. Chega em até 5 dias úteis.",
    featured: true,
    complicationLabel: "Hora e segundos",
    caseLabel: "Titânio",
    calibre: "R.02",
    specs: watchCommonSpecs({
      diameter: "40 mm",
      thickness: "11,8 mm",
      caseLabel: "Titânio grau 5, jateado",
      water: "100 m",
      calibre: "R.02, corda manual, segundos centrais",
      reserve: "70 horas",
      jewels: "21",
      strap: "Borracha vulcanizada, 20/18 mm",
      buckle: "Fivela ardillon em titânio",
    }),
    model: {
      diameter: 40,
      thickness: 11.8,
      caseMaterial: "titanium",
      dial: { color: "#15171c", finish: "grain", print: "#e6e9ee" },
      indices: "lume-dot",
      hands: "sword",
      handFinish: "rhodium",
      complication: "time",
      lume: true,
      accent: "#c43a4d",
      strapId: "borracha-noite",
    },
  },
  {
    kind: "watch",
    slug: "chronographe-41",
    name: "Chronographe 41",
    price: 67200,
    tagline: "Roda de colunas, embreagem horizontal e um mostrador panda.",
    description: [
      "Um cronógrafo com roda de colunas e embreagem horizontal: a arquitetura clássica, de montagem mais difícil e acionamento mais macio.",
      "O mostrador opalino branco contrasta com os contadores pretos com acabamento caracol. O ponteiro do cronógrafo é azulado a fogo.",
      "Pressione o botão das 2 horas para iniciar e parar. O das 4 horas zera tudo de uma vez.",
    ],
    availability: "in-stock",
    leadTime: "Pronta entrega. Chega em até 5 dias úteis.",
    featured: true,
    complicationLabel: "Cronógrafo",
    caseLabel: "Aço",
    calibre: "R.05",
    specs: watchCommonSpecs({
      diameter: "41 mm",
      thickness: "13,2 mm",
      caseLabel: "Aço 316L, polido e acetinado",
      water: "50 m",
      calibre: "R.05, corda manual, cronógrafo com roda de colunas",
      reserve: "60 horas",
      jewels: "27",
      strap: "Bezerro preto com costura clara, 21/18 mm",
      buckle: "Fivela ardillon em aço",
    }),
    model: {
      diameter: 41,
      thickness: 13.2,
      caseMaterial: "steel",
      dial: { color: "#f1efe9", finish: "opaline", print: "#15171c", subdial: "#15171c" },
      indices: "baton",
      hands: "leaf",
      handFinish: "rhodium",
      complication: "chronograph",
      lume: false,
      accent: "#2b45b5",
      strapId: "bezerro-preto",
    },
  },
  {
    kind: "watch",
    slug: "vallee-38",
    name: "Vallée 38",
    price: 36900,
    tagline: "O primeiro Remontoir, desde 2011.",
    description: [
      "O relógio que abriu a casa. O mostrador prateado recebe guilhochê grain d'orge, feito numa máquina de rosa de 1920 movida à mão.",
      "Numerais romanos impressos, pequenos segundos às 6 horas e ponteiros Breguet azulados. Nada sobra, nada falta.",
      "A caixa de 38 mm assenta em pulsos de 15 a 19 cm e passa por baixo do punho da camisa.",
    ],
    availability: "in-stock",
    leadTime: "Pronta entrega. Chega em até 5 dias úteis.",
    complicationLabel: "Pequenos segundos",
    caseLabel: "Aço",
    calibre: "R.01",
    specs: watchCommonSpecs({
      diameter: "38 mm",
      thickness: "10,2 mm",
      caseLabel: "Aço 316L, polido",
      water: "30 m",
      calibre: "R.01, corda manual, pequenos segundos",
      reserve: "72 horas",
      jewels: "21",
      strap: "Bezerro conhaque, 20/16 mm",
      buckle: "Fivela ardillon em aço",
    }),
    model: {
      diameter: 38,
      thickness: 10.2,
      caseMaterial: "steel",
      dial: { color: "#d7dade", finish: "guilloche", print: "#1c2750" },
      indices: "roman",
      hands: "breguet",
      handFinish: "blued",
      complication: "small-seconds",
      lume: false,
      strapId: "bezerro-conhaque",
    },
  },
  {
    kind: "watch",
    slug: "vallee-38-or-rose",
    name: "Vallée 38 Or Rose",
    price: 94500,
    tagline: "Ouro rosé e um mostrador salmão.",
    description: [
      "A mesma arquitetura do Vallée 38 numa caixa de ouro rosé 18 quilates, com a liga 5N, mais rica em cobre, que não desbota.",
      "O mostrador salmão raiado muda de tom com a luz: vai do cobre ao rosa-pálido. Ponteiros folha e índices aplicados em ouro.",
      "Cada peça é gravada no fundo com o número de série e o nome do relojoeiro que a montou.",
    ],
    availability: "made-to-order",
    leadTime: "Sob encomenda. Entrega em 12 semanas.",
    complicationLabel: "Pequenos segundos",
    caseLabel: "Ouro rosé",
    calibre: "R.01",
    specs: watchCommonSpecs({
      diameter: "38 mm",
      thickness: "10,2 mm",
      caseLabel: "Ouro rosé 18 k (5N)",
      water: "30 m",
      calibre: "R.01, corda manual, pequenos segundos",
      reserve: "72 horas",
      jewels: "21",
      strap: "Camurça taupe, 20/16 mm",
      buckle: "Fivela ardillon em ouro rosé",
    }),
    model: {
      diameter: 38,
      thickness: 10.2,
      caseMaterial: "rose-gold",
      dial: { color: "#dd9f86", finish: "sunburst", print: "#3a2621" },
      indices: "baton",
      hands: "leaf",
      handFinish: "rose",
      complication: "small-seconds",
      lume: false,
      strapId: "camurca-taupe",
    },
  },
  {
    kind: "watch",
    slug: "gmt-40",
    name: "GMT 40",
    price: 49700,
    tagline: "Duas horas ao mesmo tempo. A segunda é a de Genebra.",
    description: [
      "O ponteiro vermelho dá uma volta a cada 24 horas e mostra um segundo fuso na escala da borda. Aqui ele vem acertado na hora de Genebra, a casa do relógio.",
      "O ponteiro das horas avança de hora em hora, independente dos outros, para trocar de fuso sem parar o relógio.",
      "O mostrador verde-floresta tem acabamento raiado e é o mais pedido da coleção.",
    ],
    availability: "in-stock",
    leadTime: "Pronta entrega. Chega em até 5 dias úteis.",
    complicationLabel: "GMT",
    caseLabel: "Aço",
    calibre: "R.04",
    specs: watchCommonSpecs({
      diameter: "40 mm",
      thickness: "12 mm",
      caseLabel: "Aço 316L, polido e acetinado",
      water: "100 m",
      calibre: "R.04, corda manual, GMT",
      reserve: "70 horas",
      jewels: "24",
      strap: "Bezerro oliva, 20/18 mm",
      buckle: "Fivela ardillon em aço",
    }),
    model: {
      diameter: 40,
      thickness: 12,
      caseMaterial: "steel",
      dial: { color: "#1f4a3b", finish: "sunburst", print: "#eef0ea" },
      indices: "baton",
      hands: "dauphine",
      handFinish: "rhodium",
      complication: "gmt",
      lume: false,
      accent: "#c2283f",
      strapId: "bezerro-oliva",
    },
  },
  {
    kind: "watch",
    slug: "petite-seconde-36",
    name: "Petite Seconde 36",
    price: 31500,
    tagline: "Pequeno no pulso, sem abrir mão de nada.",
    description: [
      "36 mm e 9,6 mm de espessura: um relógio pensado para pulsos finos e para quem prefere o tamanho dos relógios de antigamente.",
      "O mostrador opalino marfim leva numerais arábicos no desenho Breguet e ponteiros folha azulados.",
      "Dentro, o mesmo calibre R.01, com 72 horas de reserva: tira no sábado e ele ainda funciona na segunda.",
    ],
    availability: "waitlist",
    leadTime: "Próximo lote em fevereiro. Entre na lista para reservar.",
    complicationLabel: "Pequenos segundos",
    caseLabel: "Aço",
    calibre: "R.01",
    specs: watchCommonSpecs({
      diameter: "36 mm",
      thickness: "9,6 mm",
      caseLabel: "Aço 316L, polido",
      water: "30 m",
      calibre: "R.01, corda manual, pequenos segundos",
      reserve: "72 horas",
      jewels: "21",
      strap: "Bezerro areia, 18/14 mm",
      buckle: "Fivela ardillon em aço",
    }),
    model: {
      diameter: 36,
      thickness: 9.6,
      caseMaterial: "steel",
      dial: { color: "#efe7d6", finish: "opaline", print: "#26272e" },
      indices: "breguet",
      hands: "leaf",
      handFinish: "blued",
      complication: "small-seconds",
      lume: false,
      strapId: "bezerro-areia",
    },
  },
];

const strapProduct = (
  id: string,
  price: number,
  tagline: string,
  description: string[],
  material: string,
): StrapProduct => {
  const strap = strapById(id);
  return {
    kind: "strap",
    slug: `pulseira-${id}`,
    name: `Pulseira ${strap.name.toLowerCase()}`,
    price,
    tagline,
    description,
    availability: "in-stock",
    leadTime: "Pronta entrega. Chega em até 3 dias úteis.",
    strap,
    specs: [
      { label: "Material", value: material },
      { label: "Largura", value: "20 mm nas alças, 16 mm na fivela" },
      { label: "Comprimento", value: "120/75 mm (pulsos de 15 a 19 cm)" },
      { label: "Troca", value: "Barras de mola com liberação rápida, sem ferramentas" },
      { label: "Fivela", value: "Ardillon em aço, incluída" },
    ],
  };
};

const strapProducts: StrapProduct[] = [
  strapProduct(
    "jacare-marinho",
    2900,
    "Escamas grandes no centro, pequenas nas bordas.",
    [
      "Couro de jacaré-do-mississippi de fazenda certificada, cortado para que as escamas maiores fiquem no centro da pulseira.",
      "Costura tom sobre tom e bordas pintadas à mão em cinco demãos.",
    ],
    "Jacaré-do-mississippi, forro em bezerro",
  ),
  strapProduct(
    "bezerro-conhaque",
    1450,
    "Fica mais bonita com o uso.",
    [
      "Bezerro de curtimento vegetal, com a flor natural do couro. Escurece e ganha brilho com os anos.",
      "Costura em linha de linho encerado, feita à mão com duas agulhas.",
    ],
    "Bezerro de curtimento vegetal",
  ),
  strapProduct(
    "camurca-pedra",
    1290,
    "Macia desde o primeiro dia.",
    [
      "Camurça italiana de fibra curta, dobrada e colada sem costura aparente.",
      "Combina com mostradores claros e caixas de aço, e dá ao relógio um ar mais informal.",
    ],
    "Camurça italiana",
  ),
  strapProduct(
    "borracha-noite",
    990,
    "Para água, suor e calor.",
    [
      "Borracha vulcanizada com baunilha, moldada com ranhuras que deixam o pulso respirar.",
      "Aguenta cloro e água salgada e não resseca.",
    ],
    "Borracha natural vulcanizada",
  ),
];

export const products: Product[] = [...watches, ...strapProducts];

export const watchProducts = watches;
export const strapProductsList = strapProducts;

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const heroWatch = watches[0];

export const featuredWatches = watches.filter((w) => w.featured && w.slug !== heroWatch.slug);

export const relatedProducts = (product: Product, count = 3): Product[] => {
  if (product.kind === "strap") {
    return watches.filter((w) => w.featured).slice(0, count);
  }
  return watches
    .filter((w) => w.slug !== product.slug)
    .sort((a, b) => {
      const score = (w: WatchProduct) =>
        (w.model.complication === product.model.complication ? 2 : 0) +
        (w.model.caseMaterial === product.model.caseMaterial ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, count);
};

export const renderPath = (slug: string, view: "front" | "back" | "night" = "front") => `/renders/${slug}-${view}.webp`;
