import { it } from "./content.it";
import { en } from "./content.en";

export type Lang = "it" | "en";

export type CatalogueCategory =
  | "Anelli"
  | "Bracciali"
  | "Collane"
  | "Orecchini";

export type SiteCopy = typeof content.it;

export const site = {
  name: "R.G.R. Handmade",
  legalName: "R.G.R. s.n.c. di Gallastroni Rossella e Rosaria",
  url: "https://www.rgrhandmade.it",
  locale: "it_IT",
  email: "info@rgrhandmade.it",
  phone: "+39 0575 299101",
  vat: "01358780516",
  address: {
    street: "Via Pietro Calamandrei, 253 A/11",
    postalCode: "52100",
    city: "Arezzo",
    country: "IT",
  },
  assets: {
    logo: "/assets/rgr/logo-rgr.png",
    hero: "/assets/rgr/hero-1.png",
  },
} as const;

export const content = {
  it,
  en,
} as const;
