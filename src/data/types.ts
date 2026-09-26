export type CaseMaterial = "steel" | "titanium" | "rose-gold" | "yellow-gold";
export type DialFinish = "sunburst" | "guilloche" | "grain" | "enamel" | "opaline";
export type Complication = "time" | "small-seconds" | "moonphase" | "chronograph" | "gmt" | "regulator";
export type HandStyle = "dauphine" | "breguet" | "leaf" | "sword";
export type HandFinish = "rhodium" | "blued" | "gold" | "rose";
export type IndexStyle = "baton" | "roman" | "breguet" | "lume-dot";
export type StrapMaterial = "alligator" | "calf" | "suede" | "rubber";

export interface Strap {
  id: string;
  name: string;
  material: StrapMaterial;
  color: string;
  stitch: string;
}

export interface WatchModel {
  diameter: number;
  thickness: number;
  caseMaterial: CaseMaterial;
  dial: {
    color: string;
    finish: DialFinish;
    print: string;
    subdial?: string;
  };
  indices: IndexStyle;
  hands: HandStyle;
  handFinish: HandFinish;
  complication: Complication;
  lume: boolean;
  accent?: string;
  strapId: string;
}

export type Availability = "in-stock" | "made-to-order" | "waitlist";

interface ProductBase {
  slug: string;
  name: string;
  price: number;
  tagline: string;
  description: string[];
  availability: Availability;
  leadTime: string;
  featured?: boolean;
  edition?: string;
  specs: { label: string; value: string }[];
}

export interface WatchProduct extends ProductBase {
  kind: "watch";
  complicationLabel: string;
  caseLabel: string;
  calibre: string;
  model: WatchModel;
}

export interface StrapProduct extends ProductBase {
  kind: "strap";
  strap: Strap;
}

export type Product = WatchProduct | StrapProduct;
