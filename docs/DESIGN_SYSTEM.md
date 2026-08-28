# Design System

## Design read

모바일 소비자를 위한 조용한 타로 리추얼. 독립 출판물과 깊은 숲의 작은 작업실 사이를 목표로 한다.

- DESIGN_VARIANCE: 7
- MOTION_INTENSITY: 6
- VISUAL_DENSITY: 4

## Tokens

- deep forest and charcoal as the locked dark theme
- muted ivory for readable paper surfaces
- amber as the only accent
- 12-16px surfaces, pill buttons, 8px inputs
- Korean sans for body, justified bookish serif only for reading titles

## Motion

- intro 240ms
- prepare 700-1,000ms
- shuffle 1,600-2,200ms
- spread 500-700ms
- select 100-140ms
- reveal 560-700ms per card
- reading pause 1,200-1,800ms
- result paper 300-400ms

Motion communicates sequence, action feedback, and state transition. Reduced motion shortens each transition and removes flips or continuous drift.

## Guardrails

- no purple glow, glass panels, chatbot bubbles, spinners, crystal-ball cliché, or particles
- no visible em dash or en dash
- one accent and one dark theme across the whole flow
- every control has visible focus and at least 44px touch target
- cards are physical objects, not generic rounded content containers

## Original assets

- `public/images/tarot-reader-table.png`
- `public/images/tarot-card-back.png`

Both were generated specifically for this project with the built-in image generator on 2026-08-27. They contain no third-party deck scans.

The card back and reader scene remain the only generated raster assets. Card fronts must use locally stored, optimized Public Domain Rider-Waite-Smith originals with file-level provenance. Do not generate 78 fronts and do not hotlink them at runtime.
