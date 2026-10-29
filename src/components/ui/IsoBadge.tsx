'use client';

import { useWheel } from '@/context/WheelContext';
import { COMPANIES } from '@/data/companies';
import { isoBadgesFor } from '@/data/companyIsoBadges';

/**
 * Certification stamps for the focused company, floating on the white stage beside the
 * 3D logo.
 *
 * Placement: pinned to the top-LEFT of the canvas box, above the band the logo can ever
 * reach and clear of the showcase panel's diagonal edge (which only bulges into the
 * canvas around mid-height). `<CameraRig>` frames every logo inside 62% of the panel
 * height (or 95% of the width when width binds first), which always leaves that corner
 * free — so the stamps read as sitting next to the mark without any risk of covering
 * it, whatever the company's logo aspect ratio. The top offset keeps a pixel floor
 * (`clamp`) so it stays clear of the chrome that shares the top edge on short screens.
 * Sizing is viewport-relative too, so the stamps stay proportional from a phone in
 * landscape (where the canvas is short) to a desktop monitor. Each stamp is ~2:1, so it
 * is sized by width and grows by height on its own — a square box would cap it early.
 *
 * Several stamps: a company can hold more than one certificate (Yana Yacu Clean has two),
 * and they stack downwards. The column then narrows, because two full-width stamps would
 * reach into the crest of the logo. The float/flip animations are offset per stamp so the
 * pair breathes instead of pulsing in lockstep.
 *
 * Interaction: `pointer-events-none`. The drag/tap capture layer sits above this corner,
 * and the stamps must never eat a swipe meant for the wheel. The float and coin flip are
 * plain CSS animations (see `globals.css`) — compositor-only, so the render loop does
 * not pay for them.
 */
export function IsoBadge() {
  const { activeIndex } = useWheel();
  const company = COMPANIES[activeIndex];

  if (company === undefined) return null;

  const badges = isoBadgesFor(company.slug);
  if (badges.length === 0) return null;

  const stacked = badges.length > 1;

  return (
    <div
      className={`pointer-events-none absolute left-[5%] top-[clamp(3rem,5.5%,4rem)] flex flex-col gap-[clamp(0.4rem,1vh,0.75rem)] [perspective:800px] sm:left-[6%] ${
        stacked ? 'w-[clamp(7rem,14vw,13rem)]' : 'w-[clamp(8.5rem,18vw,17rem)]'
      }`}
    >
      {badges.map((badge, index) => (
        <div
          key={badge.src}
          className="iso-badge-float w-full"
          style={{ animationDelay: `${index * -2.5}s` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badge.src}
            alt={`Sello de certificación ${badge.label} de ${company.name}`}
            className="iso-badge-coin block h-auto w-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.18)]"
            style={{ animationDelay: `${index * -3.5}s` }}
          />
        </div>
      ))}
    </div>
  );
}
