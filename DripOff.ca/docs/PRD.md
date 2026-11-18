# DripOff catalog — draft product requirements

**Source:** Client conversation shared by Gurkirat on 21 October 2026 and the supplied `index.html`. This records the client's request; it is not an approved build or launch plan.

## Goal

Give visitors a link in the seller's bio where they can browse the brands and products currently available, then contact the seller privately about an item. Give the seller a simple way to add and update products without editing HTML or asking a developer each time.

## What the client asked for

- Keep the existing brand based catalog concept. Visitors choose a brand, then browse product categories within that brand.
- Put the client's product images into the appropriate brand and category.
- Add a **+** control near the product frames so the seller can drag in images and create more entries.
- Let each product have multiple colorways, with images for each colorway.
- Let the seller choose the sizes actually available for each product.
- Handle a large, growing batch of photos. The seller may upload photos before all products are ready; they need a way to place each photo in the right brand, category, product, and colorway.
- The client initially requested automatic background removal and centering on white. Gurkirat later chose a simpler flow: the seller prepares the white-background image before uploading it.
- Publish the catalog at a URL that can be placed in the seller's bio.
- Allow two or three rounds of small changes after the first version is shown.

The client later clarified that visitors will **message them privately to order**. Online payment and checkout are not part of the requested catalog flow.

## Users and flows

### Visitor

1. Open the public catalog link on a phone or desktop.
2. Search or choose a brand.
3. Select a category tab and see only products the seller has added to that brand and category.
4. Open a product to view its images, colorways, and available sizes.
5. Use a visible contact action to message the seller about that product. The client supplied TikTok `@dripoff.ca1` and Instagram `@jay.lazaroff`; the preferred channel and message behavior still need to be confirmed.

### Seller

1. Sign in to a private editing area. Visitors cannot see editing controls.
2. Choose a brand and category, then use **+** to add a product.
3. Enter a product name, drag in one or more images, add colorways, and choose available sizes.
4. Review each uploaded image, adjust its product assignment or replace it if necessary.
5. Preview and publish the product. The product and its images remain available after refresh and future deployments.
6. Edit, reorder, hide, or remove an existing product as stock changes.

## Functional requirements

| Area | Requirement |
| --- | --- |
| Catalog | Show brand tiles and category tabs. Render products from saved data rather than numbered image paths or empty placeholders. |
| Product | Store brand, category, name, display order, visibility, images, colorways, and available sizes. |
| Images | Accept common web image formats; show a preview before saving. Associate each image with the correct product and colorway. |
| Photos | Show prepared images as uploaded and let the seller remove or replace them. No automatic background removal is required. |
| Bulk intake | Support repeated or batch uploads without making the seller edit code. Let the seller assign each image to its brand, category, product, and colorway; do not silently guess inventory identity. |
| Colorways | Allow one or more named colorways per product, each with its own images. |
| Sizes | Allow product specific sizes; do not display default sizes that are unavailable. |
| Editing | Private, simple add/edit/hide/delete flow with drag and drop upload and a file picker fallback. |
| Contact | Give visitors an obvious way to contact the seller with the product name and selected variant. Final channel to be confirmed. |
| Hosting | Provide a shareable public URL and persistent storage for product data and images. Vercel was discussed, pending the launch decision below. |

## Existing code and changes needed

The supplied `index.html` already has a responsive brand landing page, search, category tabs, product modal, embedded brand logos, and a cart. It currently generates ten entries per category even without product data, looks for images at paths such as `images/{brand}/{category}/{number}.jpg`, and has one hard coded product with colorway names. It prices everything at `$10` and calls a checkout function that was not supplied.

For the client's stated catalog, replace the generated placeholder entries with saved products and add a private editor. Replace the cart and checkout flow with a contact action unless the client explicitly changes the ordering plan. Keep any supplied logos and product claims subject to the launch review below.

## Acceptance criteria

- The seller can add a product to a chosen brand and category through the interface, without touching code.
- After adding an image, it appears in the correct public product frame and remains there after refresh.
- A product with two colorways displays the correct images when each colorway is selected.
- A product displays only the sizes the seller selected.
- Hidden or deleted products no longer appear publicly; blank numbered product cards do not appear.
- Visitors can browse on mobile and use the agreed contact route to identify the product they want.
- Editing controls and uploads are available only to the seller.
- The seller can make another product update after the site is deployed without developer intervention.
- Uploaded photos survive refresh and deployment. The seller can replace an inaccurate image or assignment.

## Decisions needed before implementation or launch

1. **Contact route:** TikTok is `@dripoff.ca1`; Instagram is `@jay.lazaroff`. Which should a product inquiry open, and should it include the chosen colorway and size?
2. **Inventory data:** Which brands and category tabs should appear initially? Which products, photos, colorway names, and sizes are real and current?
3. **Editing access:** Who needs an editor account besides the seller?
4. **Presentation:** Is price shown at all? The current `$10` price is a placeholder, not a confirmed sale price.
5. **Hosting/domain:** What is the intended domain and who owns its account? Vercel was proposed in chat, not yet set up.
6. **Image storage:** Seller uploads prepared photos unchanged to Supabase Storage. Product records use Supabase Postgres.
7. **Product and brand rights:** The client explicitly said they sell fake designer goods. Public use of brand marks and counterfeit product listings needs independent legal and hosting policy review before deployment. The current “independent reseller” footer should not be treated as resolving that issue. The [Canadian Intellectual Property Office's trademark guidance](https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/trademark-infringement) describes risks around unauthorized marks and knock-offs.

## Commercial notes from the conversation

Gurkirat proposed **$50** for an easier image management system and a public link, with **$25 upfront** and two or three minor revision rounds. The client agreed in principle, but the payment method was unresolved. The exact deliverables, revision limits, payment currency, and launch responsibilities should be written down before paid work begins.
