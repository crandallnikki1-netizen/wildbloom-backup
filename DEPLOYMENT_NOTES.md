# Deployment notes

The redesign is intentionally isolated on `agent/flexible-midcentury-redesign` until reviewed.

## Required environment setting

Set `ADMIN_PASS` to a strong private password on the production server. The application no longer ships with a fallback owner password.

## Uploaded media

The admin dashboard writes new images to `data/uploads`. Confirm that this directory is persistent on the production host and included in backups.

## Review assets

The branch includes compressed/embedded artwork for review so the layout has working visuals in GitHub. Full-resolution final product images should be uploaded through the owner dashboard before launch.
