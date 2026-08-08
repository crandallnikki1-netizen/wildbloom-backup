# House of the Wild Bloom — Flexible Redesign

This branch contains the first flexible midcentury-modern rebuild of House of the Wild Bloom.

## What changed

- New walnut, aged-gold, ivory, charcoal, and botanical-green visual direction.
- Homepage content is driven from `data/settings.json` instead of being hardcoded throughout the page.
- Product cards load from `data/products.json`.
- New owner dashboard for editing general site copy, homepage content, products, and uploaded media.
- Product API supports add, edit, and delete.
- Image upload endpoint stores media under `data/uploads`.
- The previous hardcoded fallback admin password is removed. Set the `ADMIN_PASS` environment variable before enabling admin writes.
- The approved corrected founder image is included in `assets/founder-nikki.svg` for review.

## Before production deployment

1. Set `ADMIN_PASS` in the server environment.
2. Replace compressed review artwork with full-resolution product images through the dashboard/media upload flow.
3. Verify Etsy listing URLs and final prices.
4. Test the admin upload directory on the production host to ensure uploaded files persist across restarts/deployments.

`master` remains untouched until this redesign is reviewed and intentionally merged.
