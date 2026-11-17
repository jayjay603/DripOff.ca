# DripOff first-version review

**Status:** The catalog and seller editor are deployed. The live API has been checked for sign-in, brand and category creation, photo upload, product creation and changes, public visibility, deletion, logout, and anonymous access rejection. Temporary test data was removed. Client photos have not been supplied, and no client walkthrough or approval has happened.

## Walkthrough

1. **Visitor view (`/`)** — Search brands with published products, choose a brand and category, inspect photos, colorways, and sizes, then contact the seller through the supplied Instagram or TikTok links.
2. **Seller view (`/admin.html`)** — Sign in with the seller username and password; add brands, categories, products, available sizes, colorways, and prepared photos. Save, hide, reorder, or delete products.
3. **Storage** — Product data uses Supabase Postgres. Images upload unchanged to the public `catalog-images` bucket. The server holds the Supabase secret key; the browser uses only the publishable key for public reads.

## Before client use

- Have the seller upload and assign their product photos and confirm available sizes and colorways.
- Walk through the public catalog with the seller and collect their changes.
- Confirm factual claims and publishing rights with the seller before promoting the catalog. They described the goods as counterfeit designer products, so brand marks and listings need review before public launch.

## Revision log

The agreement discussed two or three rounds of minor changes after the first version is shown. None has happened yet.

| Round | Date / client request | Change made | Status |
| --- | --- | --- | --- |
| 1 | Pending client feedback | — | Not started |
| 2 | Pending client feedback | — | Not started |
| 3 | Pending client feedback | — | Not started |
