# Concept index

The product definition is the Arabic v2 spec, preserved verbatim:

[Monet_AlJaddat_Complete_Merged_Spec_v2.md](../../originals/Monet_AlJaddat_Complete_Merged_Spec_v2.md)

`spec §30` and `spec §37` list what is out of scope for v1. Do not translate or rewrite that file.

Approved decisions made after the spec are in [ARCHITECTURE_DECISIONS.md](../architecture/ARCHITECTURE_DECISIONS.md). Technical decisions that the spec does not make are recorded there; where an ADR and the spec disagree on product behavior, the spec wins and the ADR is superseded. The important decisions are:

- Payment is taken inside Checkout. The order row is created `pending` / `unpaid` first because `PaymentTransaction.order_id` is required (ADR-020).
- Ready-product and box stock is reserved when the order is created.
- A refund belongs to an order or a subscription, never both.
- Arabic is the only product language (ADR-017).
- Pagination query names are `page` and `limit` (ADR-012, ADR-022).
- One review per delivered order (ADR-018).
- Function-level permissions in seven sections (ADR-019).
- Delivery reference data is seeded, not administered (ADR-021).

Working behavior is summarized in [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md). If that summary and the spec disagree, and no ADR covers the point, the spec wins. Record the conflict instead of choosing silently.
