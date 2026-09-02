# Affiliate Product Configuration

UX v2 starts with one verified affiliate destination supplied by the operator. Growth Engine keeps this item as a safe fallback while a protected Coupang Partners refresh builds a theme-based product pool. A product is shown only when the question intent and card theme both make the category natural.

- Product: 블루 드 샤넬 오 드 빠르펭 50ml
- Coupang product id: 6714252008
- Affiliate destination: server-only `COUPANG_PARTNERS_URL`
- Product image: official CHANEL packshot stored at `public/affiliate/bleu-de-chanel.avif`
- Official image source: https://www.chanel.com/sa-en/fragrance/p/107350/bleu-de-chanel-eau-de-parfum-spray/
- Image source asset: `bleu-de-chanel-eau-de-parfum-spray-1-7fl-oz--packshot-default-107350-9564891086878.jpg`

No price is shown because the project has no trusted live price feed. The current product supports relationship, self-care, rest, and new-start themes. Career, money, and organization readings do not show an affiliate interstitial until an operator verifies a matching product.

Selection is deterministic across the current product pool from the selected card ids. Future runtime exposure rotation is stored in the Growth Engine queue store, not in a user question or browser identifier. Additional curated products can be added only when their affiliate destination, product image rights, disclosure, and active category are verified.

## Partners API refresh

`COUPANG_PARTNERS_API_ENABLED=true` enables the protected `/api/affiliate/refresh` route. The scheduled GitHub Action searches operator-owned keywords for the six internal themes, validates Coupang CDN images and Coupang product URLs, converts each URL through `/deeplink`, and stores the sanitized result in Upstash under `mr-tarot:affiliate-pool:v1`.

The ritual fetches that pool through `/api/affiliate/pool` without sending the visitor's question. If the pool is unavailable or empty, it falls back to the verified local product above. Prices are still omitted until a trusted price policy is added.
