# UX Guide

## Overview
Reproduce the functional experience of `docs/customize-weighing-station.html`. Do not redesign.

## Design System / Component Library
None. Hand-built React components reproducing the prototype's layout, labels, colours and states.

## Styling Approach
Plain CSS (CSS modules or a single stylesheet) using CSS custom properties extracted from the prototype (colours, spacing, typography). Labels, units and screen titles (`1 · Select batch`, `2 · Weigh`, `3 · Confirm & print`) match the prototype text.

## Interaction
- Touch-first, gloved hands: minimum touch target 15 mm (per brief).
- Primary actions (OK, Re-tare, Quit, Supervisor Override) always visible on the Weigh screen.
- Confirm/OK enabled only when weight is within tolerance; state shown by colour **and** text (not colour alone).
- Live weight updates continuously from the Scale API.

## Accessibility
- Visible focus states; buttons are real `<button>`s.
- Status changes (in tolerance, overshoot, device offline) announced via `aria-live`.
- Contrast ≥ WCAG AA.

## Deviations
Any deviation from the prototype must be recorded in the UI validation (Step 28) with a reason.
