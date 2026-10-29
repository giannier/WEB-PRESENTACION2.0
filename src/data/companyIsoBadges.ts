/**
 * ISO certification stamps per company, keyed by slug.
 *
 * Files live in `public/isos` named after the standard (`iso9001.svg`, `iso14001.svg`…)
 * rather than after the company, because one certificate can cover several companies —
 * Corporación Yanayacu and Agua Yanayacu share the 9001, both Arbicop and Escuela
 * Capacita hold the 21001, and Trust Agroexport and Yana Yacu Clean share the 14001. A
 * slug with no entry renders no stamp at all; a slug with two renders both, stacked.
 *
 * The mapping mirrors the group's certificate table (empresa → número de ISO) and is
 * kept slug-ordered so a missing company is easy to spot. `SSOMA Safe` is the slug of
 * SSOMA Soluciones Integrales, and `Arbicop` is the Instituto de Árbitros, Peritos,
 * Conciliadores y Tasadores.
 *
 * The assets are pdf2svg exports that `scripts/optimize-iso.mjs` turns into trimmed,
 * single-raster SVGs. The untouched exports stay in `LOGOS/` and are never served.
 */
export type IsoBadgeAsset = {
  /** Public path of the stamp. */
  readonly src: string;
  /** Standard code, used for the accessible name. */
  readonly label: string;
};

const ISO_9001: IsoBadgeAsset = { src: '/isos/iso9001.svg', label: 'ISO 9001' };
const ISO_14001: IsoBadgeAsset = { src: '/isos/iso14001.svg', label: 'ISO 14001' };
const ISO_20000: IsoBadgeAsset = { src: '/isos/iso20000.svg', label: 'ISO 20000-1' };
const ISO_21001: IsoBadgeAsset = { src: '/isos/iso21001.svg', label: 'ISO 21001' };
const ISO_28000: IsoBadgeAsset = { src: '/isos/iso28000.svg', label: 'ISO 28000' };
const ISO_37001: IsoBadgeAsset = { src: '/isos/iso37001.svg', label: 'ISO 37001' };
const ISO_45001: IsoBadgeAsset = { src: '/isos/iso45001.svg', label: 'ISO 45001' };

export const COMPANY_ISO_BADGES: Readonly<Record<string, readonly IsoBadgeAsset[]>> = {
  aguayanayacu: [ISO_9001],
  arbicop: [ISO_21001],
  corporacionyanayacu: [ISO_9001],
  quantukperu: [ISO_37001],
  somosescuelacapacita: [ISO_21001],
  ssomasafe: [ISO_45001],
  supplylogistic360: [ISO_28000],
  trustagroexport: [ISO_14001],
  yanayacuclean: [ISO_14001],
  zentek360: [ISO_20000],
};

export function isoBadgesFor(slug: string): readonly IsoBadgeAsset[] {
  return COMPANY_ISO_BADGES[slug] ?? [];
}
