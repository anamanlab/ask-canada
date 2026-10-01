/**
 * Prairie: the closing panel's place, a different part of the country from the hero's lake. A low sun on an
 * open horizon, a grain elevator and a line of poles along a gravel road, a thin band of canola, furrows
 * running to the sun, and a skein of geese (drawn by scripts/build-art.mjs; light and dark swap in CSS).
 */
import { prairieArt } from './art';

export function Prairie({ className }: { className?: string }) {
  return <div className={className} aria-hidden style={prairieArt} />;
}
