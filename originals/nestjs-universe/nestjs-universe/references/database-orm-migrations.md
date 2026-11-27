# Database, ORM & Migrations

> **Parent skill:** `nestjs-universe`
> **Scope:** NestJS persistence layer — PostgreSQL column types in ORMs, TypeORM entities/relations (ESM & CJS), isolated Sequelize blocks, indexes, transaction handle propagation, expand-and-contract migrations, and idempotent seeders. For raw PostgreSQL engine tuning (autovacuum, PgBouncer, RLS, deep `EXPLAIN` internals), defer to `supabase-postgres-best-practices`.
> **Applies to:** NestJS backends using TypeORM (canonical default) or Sequelize (`*.entity.ts`, `*.model.ts`, `*.service.ts`, `migrations/`, `seeders/`).

## Contents

- [Map PostgreSQL Column Types and Join Semantics Explicitly](#map-postgresql-column-types-and-join-semantics-explicitly-high)
- [Wrap Every TypeORM ESM Relation in Relation<T>](#wrap-every-typeorm-esm-relation-in-relationt-critical)
- [Promote Rich Junction Tables to Explicit Entities](#promote-rich-junction-tables-to-explicit-entities-high)
- [Disable Schema Auto-Sync and Use Versioned Migrations](#disable-schema-auto-sync-and-use-versioned-migrations-critical)
- [Index Child Foreign Keys and Match Composite Column Order](#index-child-foreign-keys-and-match-composite-column-order-high)
- [Propagate the Transaction Handle to Every Query Inside a Transaction](#propagate-the-transaction-handle-to-every-query-inside-a-transaction-critical)
- [Use Expand-and-Contract Migrations for Zero-Downtime Schema Changes](#use-expand-and-contract-migrations-for-zero-downtime-schema-changes-critical)
- [Write Dependency-Ordered Idempotent Seeders with Stable UUIDs](#write-dependency-ordered-idempotent-seeders-with-stable-uuids-medium)

---

### Map PostgreSQL Column Types and Join Semantics Explicitly [HIGH]

**Rule:** Use PostgreSQL-native column types in ORM definitions: `uuid` primary keys, `text` over arbitrary `varchar(255)`, `timestamptz` (never bare `timestamp`), and `numeric(10,2)` for money (never `float8`/`double`). Default foreign keys to `onDelete: 'RESTRICT'` (use `'CASCADE'` only for dependent child rows). Model constrained values with `CHECK` constraints (or a lookup table when admin-editable; use native `ENUM` sparingly). In raw SQL/QueryBuilder, prefer `NOT EXISTS` over `NOT IN` on nullable subqueries and place right-table filters in `LEFT JOIN ... ON` rather than `WHERE`.

**Why:** `float8` introduces binary rounding errors on currency; bare `timestamp` drops timezone context; `WHERE right.col = ...` turns a `LEFT JOIN` into an `INNER JOIN`; `NOT IN` returns zero rows whenever the subquery yields a single `NULL`.

```ts
// ❌ Incorrect — float8 money, bare timestamp, WHERE kills LEFT JOIN, NOT IN on nullable col
@Column({ type: 'float8' }) price: number;
@Column({ type: 'timestamp' }) createdAt: Date;
// SELECT u.* FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE o.status = 'paid';
// SELECT * FROM courses WHERE id NOT IN (SELECT course_id FROM enrollments); -- 0 rows if any NULL

// ✅ Correct — numeric money, timestamptz, RESTRICT FK, ON-clause filter, NOT EXISTS
@Column({ type: 'numeric', precision: 10, scale: 2 }) price: string;
@Column({ type: 'timestamptz' }) createdAt: Date;
@ManyToOne(() => Company, { nullable: false, onDelete: 'RESTRICT' })
company: Relation<Company>;
// SELECT u.* FROM users u LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid';
// SELECT c.* FROM courses c WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = c.id);
```

| Constrained Domain | Choice | When to Use |
| :--- | :--- | :--- |
| Fixed small set (`active`, `archived`) | `text` + `CHECK` | Default — easy to extend in migrations without `ALTER TYPE` locks |
| Admin-editable values (categories, tiers) | Lookup table + FK | Values change at runtime without schema deployments |
| Strictly immutable protocol enum | Native `ENUM` | Rare; removing values requires recreating the type |

#### If project uses Sequelize

Use `DataType.UUID` with `defaultValue: DataType.UUIDV4`, `DataType.TEXT`, `DataType.DECIMAL(10, 2)` for money, and `DataType.DATE` (maps to `timestamptz` in Postgres). Set `onDelete: 'RESTRICT'` in migration foreign-key `references` definitions.

---

### Wrap Every TypeORM ESM Relation in Relation<T> [CRITICAL]

**Rule:** In native ESM (`"type": "module"` with `module: "nodenext"`), use `.js` extensions on relative imports and wrap **every** `@ManyToOne`, `@OneToMany`, `@OneToOne`, and `@ManyToMany` property type in `import type { Relation } from 'typeorm'`.

**Why:** TypeScript `emitDecoratorMetadata` emits runtime `design:type` references for un-wrapped relation classes. Under native ESM, bidirectional entity imports evaluate circular bindings before initialization and crash at boot (`ReferenceError: Cannot access '...' before initialization`).

```ts
// ❌ Incorrect — raw entity type breaks ESM circular metadata at boot
import { Company } from '../companies/company.entity.js';
@ManyToOne(() => Company, (c) => c.jobs, { nullable: false })
company: Company;

// ✅ Correct — Relation<T> erases runtime circular metadata emission
import type { Relation } from 'typeorm';
import { Company } from '../companies/company.entity.js';
@ManyToOne(() => Company, (c) => c.jobs, { nullable: false, onDelete: 'RESTRICT' })
company: Relation<Company>;
```

**CommonJS delta:** CJS projects omit `.js` relative import extensions; `Relation<T>` is still safe and forward-compatible, though CJS tolerates un-wrapped references more leniently.

---

### Promote Rich Junction Tables to Explicit Entities [HIGH]

**Rule:** Use `@ManyToMany` + `@JoinTable()` only for pure tag/link tables with zero extra columns. The moment a relationship owns data (`status`, `score`, `priceAtEnrollment`, `appliedAt`), promote it to a first-class entity with two `@ManyToOne` relations and a composite `@Unique(['parentA', 'parentB'])` constraint.

**Why:** `@ManyToMany` hides the join table from repositories, blocking queries, constraints, snapshots, and indexes on link attributes.

```ts
// ❌ Incorrect — pure @ManyToMany cannot store priceAtEnrollment or status
@ManyToMany(() => Course) @JoinTable() courses: Relation<Course[]>;

// ✅ Correct — explicit join entity with composite unique constraint
@Entity()
@Unique(['student', 'course'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Student, { nullable: false, onDelete: 'RESTRICT' }) student: Relation<Student>;
  @ManyToOne(() => Course, { nullable: false, onDelete: 'RESTRICT' }) course: Relation<Course>;
  @Column({ type: 'numeric', precision: 10, scale: 2 }) priceAtEnrollment: string;
}
```

#### If project uses Sequelize

Define an explicit `@Table` model (`Enrollment`) with `@ForeignKey(() => Student)` / `@ForeignKey(() => Course)` columns and a composite unique index in the migration instead of relying on an implicit through-table.

---

### Disable Schema Auto-Sync and Use Versioned Migrations [CRITICAL]

**Rule:** Keep `synchronize: false` in TypeORM configuration and manage all schema changes via versioned migrations.

**Why:** Auto-sync silently drops columns or alters constraints on startup, causes irreversible data loss in production, and hides broken migrations during local/test runs before staging or production.

```ts
// ❌ Incorrect — auto-alters production tables on boot
TypeOrmModule.forRoot({ type: 'postgres', url, autoLoadEntities: true, synchronize: true });

// ✅ Correct — disabled outside local dev; migrations own production schema
TypeOrmModule.forRootAsync({
  inject: [databaseConfig.KEY],
  useFactory: (db: ConfigType<typeof databaseConfig>) => ({
    type: 'postgres', url: db.url, autoLoadEntities: true, synchronize: false,
  }),
});
```

#### If project uses Sequelize

Set `autoLoadModels: true` with `synchronize: false` and never enable `sync: { alter: true }` or `sync: { force: true }` outside disposable local/test setups. Run `sequelize-cli db:migrate` against `SequelizeMeta`.

---

### Index Child Foreign Keys and Match Composite Column Order [HIGH]

**Rule:** Explicitly add B-tree indexes on child foreign-key columns (PostgreSQL does **not** auto-index FKs). Order composite index columns by equality predicates first, then range or `ORDER BY` columns (leftmost-prefix rule). Skip standalone B-tree indexes on low-cardinality columns (`isActive`, 2–3-value `status`) unless narrowing a rare subset with a partial index (`WHERE`).

**Why:** Unindexed child FKs trigger sequential scans on joins and parent `DELETE` checks; low-cardinality indexes hurt write throughput while the planner still picks a Seq Scan.

```ts
// ❌ Incorrect — low-cardinality index + wrong composite column order for WHERE project_id = ? AND done = false
@Index(['isActive'])
@Index(['done', 'projectId'])
export class Task {}

// ✅ Correct — FK indexed + composite matches leading equality filter
@Index('idx_enrollments_student_course', ['studentId', 'courseId'], { unique: true })
@Index('idx_enrollments_course_id', ['courseId'])
export class Enrollment {}
```

#### If project uses Sequelize

Create indexes in migrations via `queryInterface.addIndex('Enrollments', ['studentId', 'courseId'], { name: 'enrollments_student_course_uq', unique: true })` and drop by name in `down`. Use `using: 'GIN'` for `jsonb`/array columns.

---

### Propagate the Transaction Handle to Every Query Inside a Transaction [CRITICAL]

**Rule:** Wrap multi-step writes that must succeed or fail atomically (e.g., creating an enrollment with capacity/discount checks, or deleting a student and dependent rows) in a managed `dataSource.transaction(async (manager) => ...)` callback (or an explicit `queryRunner` only when fine-grained savepoints are required). Execute **every** read and write inside using `manager.getRepository(Entity)` — never `this.repo`.

**Why:** Calling `this.repo` inside a transaction callback uses a separate pool connection outside the transaction, committing independently even when a later step throws and rolls back.

```ts
// ❌ Incorrect — this.courses runs outside manager's transaction
await this.dataSource.transaction(async (manager) => {
  const course = await this.courses.findOneBy({ id: courseId }); // leaked outside tx
  await manager.getRepository(Enrollment).save({ studentId, courseId, priceAtEnrollment: course.finalPrice });
});

// ✅ Correct — every query uses the transaction manager
await this.dataSource.transaction(async (manager) => {
  const course = await manager.getRepository(Course).findOneByOrFail({ id: courseId });
  if (!course.isActive) throw new BadRequestException('Course is inactive');
  return manager.getRepository(Enrollment).save(
    manager.getRepository(Enrollment).create({ studentId, courseId, priceAtEnrollment: course.finalPrice }),
  );
});
```

#### If project uses Sequelize

Use managed `await this.sequelize.transaction(async (t) => { ... })` and pass `{ transaction: t }` to **every** `findByPk`, `findOne`, `create`, `update`, and `destroy` call inside. Throwing inside the callback triggers automatic `ROLLBACK`.

---

### Use Expand-and-Contract Migrations for Zero-Downtime Schema Changes [CRITICAL]

**Rule:** Every migration must remain backward-compatible with the currently running application version during rolling deploys. Never run in-place `RENAME COLUMN`, `DROP COLUMN`, or `ADD COLUMN ... NOT NULL` (without a `DEFAULT`) on populated tables in a single release. Use the 4-step **expand-and-contract** sequence:

| Step | Release | Database Change | Application Code |
| :--- | :--- | :--- | :--- |
| **1. Expand** | `vN` | Add nullable new column (`display_name`) | Dual-write `full_name` and `display_name`; read fallback |
| **2. Backfill** | `vN` | Batch-copy `full_name` into `display_name` | Still dual-writing |
| **3. Switch** | `vN+1` | Optional `NOT NULL` check after backfill | Read and write `display_name` only |
| **4. Contract** | `vN+2` | Drop `full_name` once zero replicas read it | Clean schema; every step rollback-safe |

```sql
-- ❌ Incorrect — breaks running v1 replicas immediately during rolling deploy
ALTER TABLE students RENAME COLUMN full_name TO display_name;
ALTER TABLE students ADD COLUMN phone text NOT NULL; -- fails on populated table

-- ✅ Correct — Step 1 Expand (nullable or defaulted)
ALTER TABLE students ADD COLUMN display_name text;
ALTER TABLE students ADD COLUMN phone text NOT NULL DEFAULT '';
```

#### If project uses Sequelize

Author reversible `up`/`down` migrations with `sequelize-cli` (`queryInterface.addColumn`, `removeColumn`, `addIndex`). Follow the same 4-release expand-and-contract cadence before calling `queryInterface.removeColumn`.

---

### Write Dependency-Ordered Idempotent Seeders with Stable UUIDs [MEDIUM]

**Rule:** Order seeders strictly parent-before-child (e.g., `permissions` -> `roles` -> `role_permissions` -> `admins`/`students` -> `courses` -> `enrollments`), use hardcoded deterministic UUIDs for reference rows, and make every seeder idempotent (`ON CONFLICT DO NOTHING` / `upsert`) so repeated runs never fail or duplicate records.

**Why:** Non-idempotent seeders break local resets, CI runs, and staging refreshes; random UUIDs prevent repeatable child-table references.

```ts
// ❌ Incorrect — random UUIDs + plain insert fails on second run
await repo.insert({ name: 'admin' });

// ✅ Correct — fixed UUID + idempotent upsert
await repo.upsert({ id: '11111111-1111-4111-8111-111111111111', name: 'admin' }, ['id']);
```

#### If project uses Sequelize

Use timestamp-prefixed seeder files (`sequelize-cli db:seed:all`) with fixed UUID constants and `queryInterface.bulkDelete(table, { id: ids })` followed by `queryInterface.bulkInsert(table, rows)` (including `createdAt` and `updatedAt`), reversing in `down`.
