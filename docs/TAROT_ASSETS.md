# Tarot Front Assets

## Selected deck

- Deck: Rider-Waite-Smith Tarot, original Pam-A scan set
- Design first published: 1909/1910
- Artist: Pamela Colman Smith (1878-1951)
- Source set: Wikimedia Commons category `Rider-Waite-Smith tarot deck (TaionWC)`
- Coverage: one consistent scan set containing exactly 78 files
- Runtime: local static WebP files under `public/tarot/cards/`; no hotlinking

## Rights basis

Every selected Commons file reports `Public domain` and a Public Domain Mark. The representative file page states that the work is public domain in its country of origin and the United States. The Commons deck category also warns that some modern colorized decks can remain copyrighted, which is why this project uses one identified original Pam-A scan set rather than mixed search results or modern recolors.

Pamela Colman Smith died in 1951. The Korea Copyright Commission states the general economic-right term as the author's life plus 70 years. The individual Commons pages for this set identify A. E. Waite, who died in 1942, as the copyright holder and mark the works public domain in countries with life-plus-80-years-or-less terms as well as the United States.

This document records source evidence for operational due diligence and is not a substitute for legal advice.

## Sources

- Complete scan set: https://commons.wikimedia.org/wiki/Category:Rider-Waite-Smith_tarot_deck_(TaionWC)
- Representative file and license: https://commons.wikimedia.org/wiki/File:Wands01.jpg
- Commons deck warning about modern colorized versions: https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck
- Korea Copyright Commission, Copyright Act Article 39: https://www.copyright.or.kr/eng/laws-and-treaties/copyright-law/chapter02/section04.do
- Korea Copyright Commission expired-works guidance: https://gongu.copyright.or.kr/gongu/main/contents.do?menuNo=200091

## File-level provenance

`data/tarot/rws-assets.json` records all 78 source file pages, original URLs, original dimensions, Commons SHA-1 values, output SHA-256 values, license labels, and local paths.

## Preprocessing

Run `pnpm tarot:assets` on a machine with `cwebp` installed. The script queries the Commons API, requires exactly 78 category members, rejects any file whose API metadata is not `Public domain`, downloads each original to an OS temporary directory, converts it to 600px-wide WebP at quality 82 while preserving aspect ratio, strips metadata, writes the local static asset atomically, then removes the temporary originals.

The 600px width supports the current mobile/desktop card display at high pixel density without shipping 1,900px-tall JPEG originals.
