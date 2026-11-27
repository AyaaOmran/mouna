# Modules

- Place code in `src/modules/<feature>/`.
- `TypeOrmModule.forFeature` appears only in the module that owns the entity.
- Other modules import the exported service.
- Controllers are not exported.
- Register BullMQ processors in the owning module.
- Read `docs/architecture/MODULES.md` before adding a module.
