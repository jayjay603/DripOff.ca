# Product photo intake

The client is still collecting product photos. No product photos have been supplied or placed in this project.

## Seller upload flow

The seller can open `/admin.html`, choose a brand and category, add a product and named colorway, then drop prepared photos into that colorway. The site displays each file as uploaded, so the seller should remove the background and center the product on white before uploading if that is the desired look.

This lets the seller add photos over time without sending the entire collection to a developer. The seller still needs to identify the correct brand, product, and colorway; the site does not infer those facts from an image.

## If someone else imports a batch

Ask for the original images and a file manifest. Use one row per file:

| Filename | Brand | Category | Product name | Colorway | View / notes |
| --- | --- | --- | --- | --- | --- |
| `exact-file-name.ext` | Confirmed brand | Confirmed category | Confirmed product | Confirmed colorway | Optional front, side, or detail |

Keep original filenames and do not guess product identity from a logo or file name. Batch photos still need to be assigned to products by a person.
