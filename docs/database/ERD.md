# ERD index

The approved ERD is preserved verbatim:

[Monat_AlJaddat_ERD_v2.md](../../originals/Monat_AlJaddat_ERD_v2.md)

It remains the base model: 37 entities, integer keys, payment transactions, refunds, and the listed indexes. Do not redraw it in place.

Approved additions and constraint changes are specified in [DATABASE_DESIGN.md](DATABASE_DESIGN.md). Implement those as migrations. Do not edit the original ERD file to match them. If an ADR later changes the model, update `DATABASE_DESIGN.md` and add an ADR.
