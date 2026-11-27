# Concept index

The product definition is the Arabic concept, preserved verbatim:

[Monat_AlJaddat_Full_Concept_Simplified_Final_v33333333.md](../../originals/Monat_AlJaddat_Full_Concept_Simplified_Final_v33333333.md)

Section 15 of that file is the concept's own decision list. Section 17 is out of scope for v1. Do not translate or rewrite that file.

Approved decisions made after the concept are in [ARCHITECTURE_DECISIONS.md](../architecture/ARCHITECTURE_DECISIONS.md). Those decisions override the concept only where an ADR says so. The important overrides are:

- A regular or scheduled electronic payment creates the order before the gateway call.
- Ready-product and box stock is reserved when the order is created.
- A refund belongs to an order or a subscription, never both.
- The API is Arabic and English. Catalog English text uses extra columns, not a translation table.
- Pagination query names are `page` and `limit`.

Working behavior is summarized in [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md). If that summary and the concept disagree, and no ADR covers the point, the concept wins. Record the conflict instead of choosing silently.
