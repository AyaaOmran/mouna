# ERD & Data Model – «Monat Al-Jaddat» (مونة الجدّات) — v2.0 Final

**Source of truth:** `Monat_AlJaddat_Full_Concept_Simplified_Final_v33333333.md` + Architectural Decisions v2.

> **Architectural Decisions Incorporated in v2:**
>
> - **UPDATED — Address Lifecycle (A-06):** Added `deleted_at` (Soft Delete) on `Address`. Updating an address already linked to an `Order` or `Subscription` creates a new row and soft-deletes the old one to preserve historical integrity.
> - **NEW — Payment Transactions (A-13):** Added `PaymentTransaction` table to track electronic payment attempts, gateway references, and failures before/after order creation.
> - **UPDATED — Subscription Pricing (C-01 / C-02):** `SubscriptionPlan.price` represents box contents only. `Subscription` stores `subtotal`, `fee_amount` (`zone.fee × deliveries_count`), and `total_price`. Grandma commission is calculated strictly on `subtotal`.
> - **NEW — Audit Columns (M-16):** Added `created_at` and `updated_at` across core entities.
> - **NEW — Secure QR Token (A-12):** Added unique `uuid` column to `VoiceMessage` for public QR lookups instead of sequential IDs.

---

## 1. Complete Visual ERD Diagrams

Mermaid diagrams: the complete system overview (37 entities) and 5 detailed module diagrams.

### 1.0 System Overview (All 37 Entities)

```mermaid
erDiagram
    User ||--o{ Address : owns
    DeliveryZone ||--o{ Address : "zone of"
    User ||--o{ UserPermission : granted
    Permission ||--o{ UserPermission : includes
    User ||--o{ ActivityLog : performs
    User ||--o{ Notification : receives
    Order |o--o{ Notification : about
    Subscription |o--o{ Notification : about

    Grandma ||--o{ Product : sells
    Category ||--o{ Product : classifies
    Season |o--o{ Product : groups
    Product ||--o{ ProductImage : has
    Product ||--o| Box : "is a"
    Box ||--|{ BoxItem : contains
    Product |o--o{ BoxItem : "content ref"
    Grandma ||--o{ VoiceMessage : records
    VoiceMessage |o--o{ Box : "QR link"
    Grandma ||--o{ Recipe : owns

    User ||--o{ Order : places
    Grandma ||--o{ Order : prepares
    Order ||--|{ OrderItem : contains
    Product ||--o{ OrderItem : "ordered as"
    Order ||--o| OrderShippingDetail : "shipping data"
    Order ||--o| OrderEventDetail : "event data"
    Order ||--o| OrderGiftDetail : "gift data"
    Order ||--|{ OrderStatusHistory : timeline
    User |o--o{ OrderStatusHistory : "changed by"
    OrderItem ||--o| Review : reviewed
    Product ||--o{ Review : "rated in"
    Address |o--o{ Order : "delivered to"
    DeliveryPeriod |o--o{ Order : period
    PaymentMethod |o--o{ Order : "paid with"
    ShippingCountry ||--o{ OrderShippingDetail : destination
    ShippingCompany |o--o{ OrderShippingDetail : "carried by"
    DeliveryZone ||--o{ OrderEventDetail : "event zone"
    DeliveryZone |o--o{ OrderGiftDetail : "recipient zone"

    Grandma ||--o{ SubscriptionPlan : offers
    Season |o--o{ SubscriptionPlan : groups
    Box |o--o{ SubscriptionPlan : "plan box"
    SubscriptionPlan ||--o{ Subscription : "subscribed as"
    User ||--o{ Subscription : subscribes
    Address ||--o{ Subscription : "delivered to"
    PaymentMethod |o--o{ Subscription : "paid with"
    Subscription ||--o{ SubscriptionDelivery : generates
    Subscription ||--o{ SubscriptionCancellationRequest : "cancel request"
    User |o--o{ SubscriptionCancellationRequest : "reviewed by"

    Order |o--o{ PaymentTransaction : "paid via"
    Subscription |o--o{ PaymentTransaction : "paid via"
    PaymentMethod ||--o{ PaymentTransaction : uses
    Order |o--o{ Refund : refunded
    Subscription |o--o{ Refund : refunded
    User ||--o{ Refund : recorded

    DeliveryPeriod ||--o{ DeliverySlot : offered
    SystemSetting
    DeliverySetting
    Holiday
```

### 1.1 Module 1 – Access & Customer Data

```mermaid
erDiagram
    User {
        int id PK
        enum role "customer admin super_admin"
        string first_name
        string last_name
        string phone UK
        string password_hash
        enum status "active disabled"
        datetime created_at
        datetime updated_at
    }
    Permission {
        int id PK
        string section
        string operation
    }
    UserPermission {
        int user_id PK, FK
        int permission_id PK, FK
    }
    ActivityLog {
        int id PK
        int user_id FK
        string action
        string entity_type
        int entity_id
        datetime occurred_at
    }
    Address {
        int id PK
        int user_id FK
        int delivery_zone_id FK
        string city
        string street
        text access_details
        string phone
        bool is_default
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    Notification {
        int id PK
        int user_id FK
        enum type
        text message
        enum status "unread read"
        int order_id FK
        int subscription_id FK
        datetime created_at
    }
    DeliveryZone { int id PK }
    Order { int id PK }
    Subscription { int id PK }

    User ||--o{ Address : owns
    DeliveryZone ||--o{ Address : "zone of"
    User ||--o{ UserPermission : granted
    Permission ||--o{ UserPermission : includes
    User ||--o{ ActivityLog : performs
    User ||--o{ Notification : receives
    Order |o--o{ Notification : about
    Subscription |o--o{ Notification : about
```

### 1.2 Module 2 – Catalog (Grandmas, Products, Boxes)

```mermaid
erDiagram
    Grandma {
        int id PK
        string name
        string image_url
        text story
        text bio
        string admin_phone
        time order_hours_from
        time order_hours_to
        enum status "pending active unavailable"
        bool is_grandma_of_month
        datetime created_at
        datetime updated_at
    }
    Recipe {
        int id PK
        int grandma_id FK
        string title
        text content
        datetime created_at
        datetime updated_at
    }
    VoiceMessage {
        int id PK
        string uuid UK
        int grandma_id FK
        string audio_url
        string title
        enum status "active inactive"
        datetime created_at
        datetime updated_at
    }
    Category {
        int id PK
        string name UK
        enum status "active hidden"
        datetime created_at
        datetime updated_at
    }
    Season {
        int id PK
        string name
        date start_date
        date end_date
        datetime created_at
        datetime updated_at
    }
    Product {
        int id PK
        int grandma_id FK
        int category_id FK
        int season_id FK
        string name
        text description
        decimal price
        string sale_unit
        string storage_method
        enum status "draft active hidden"
        enum fulfillment_type "ready made_to_order"
        int lead_time_days
        decimal stock
        bool allow_scheduling
        bool channel_regular
        bool channel_shipping
        bool channel_event
        datetime created_at
        datetime updated_at
    }
    ProductImage {
        int id PK
        int product_id FK
        string image_url
    }
    Box {
        int product_id PK, FK
        int voice_message_id FK
    }
    BoxItem {
        int id PK
        int box_id FK
        int product_id FK
        string item_name
        decimal quantity
    }

    Grandma ||--o{ Product : sells
    Category ||--o{ Product : classifies
    Season |o--o{ Product : groups
    Product ||--o{ ProductImage : has
    Product ||--o| Box : "is a"
    Box ||--|{ BoxItem : contains
    Product |o--o{ BoxItem : "content ref"
    Grandma ||--o{ VoiceMessage : records
    VoiceMessage |o--o{ Box : "QR link"
    Grandma ||--o{ Recipe : owns
```

### 1.3 Module 3 – Orders & Reviews

```mermaid
erDiagram
    Order {
        int id PK
        int customer_id FK
        int grandma_id FK
        enum order_type "regular shipping event"
        bool is_scheduled
        bool is_gift
        enum status
        enum payment_status "unpaid paid failed refunded"
        int payment_method_id FK
        int address_id FK
        date delivery_date
        int delivery_period_id FK
        date prepare_start_date
        datetime payment_deadline
        decimal subtotal
        decimal fee_amount
        decimal total_amount
        text customer_notes
        text delivery_responsible_note
        text reject_reason
        text cancel_reason
        datetime created_at
        datetime updated_at
    }
    OrderItem {
        int id PK
        int order_id FK
        int product_id FK
        decimal quantity
        decimal unit_price
    }
    OrderShippingDetail {
        int order_id PK, FK
        int shipping_country_id FK
        string recipient_city
        string recipient_name
        string recipient_phone
        text recipient_address
        date preferred_send_date
        text shipping_notes
        int shipping_company_id FK
        string tracking_number
    }
    OrderEventDetail {
        int order_id PK, FK
        enum event_type
        date event_date
        time event_time
        int guests_count
        int delivery_zone_id FK
        text event_address
        string contact_phone
        text special_notes
    }
    OrderGiftDetail {
        int order_id PK, FK
        string recipient_name
        string recipient_phone
        int recipient_delivery_zone_id FK
        text recipient_address
        string wrapping_type
        text card_message
        string sender_name
        bool hide_sender
    }
    OrderStatusHistory {
        int id PK
        int order_id FK
        enum status
        int changed_by FK
        datetime changed_at
        text note
    }
    Review {
        int id PK
        int order_item_id FK, UK
        int product_id FK
        int rating
        text comment
        datetime created_at
        datetime updated_at
    }

    Order ||--|{ OrderItem : contains
    Order ||--o| OrderShippingDetail : "shipping data"
    Order ||--o| OrderEventDetail : "event data"
    Order ||--o| OrderGiftDetail : "gift data"
    Order ||--|{ OrderStatusHistory : timeline
    OrderItem ||--o| Review : reviewed
```

### 1.4 Module 4 – Subscriptions

```mermaid
erDiagram
    SubscriptionPlan {
        int id PK
        int grandma_id FK
        int season_id FK
        int box_id FK
        enum plan_type "weekly seasonal"
        string name
        string image_url
        decimal price "boxes only"
        int duration_days
        int deliveries_count
        enum availability_status "active unavailable"
        datetime created_at
        datetime updated_at
    }
    Subscription {
        int id PK
        int plan_id FK
        int customer_id FK
        int address_id FK
        enum status "pending_payment active completed cancelled"
        date start_date
        date end_date
        int payment_method_id FK
        datetime payment_deadline
        decimal subtotal
        decimal fee_amount
        decimal total_price
        datetime created_at
        datetime updated_at
    }
    SubscriptionDelivery {
        int id PK
        int subscription_id FK
        date delivery_date
        enum status "scheduled preparing delivered cancelled"
        datetime updated_at
    }
    SubscriptionCancellationRequest {
        int id PK
        int subscription_id FK
        datetime requested_at
        text reason
        enum status "pending approved rejected"
        int reviewed_by FK
        datetime reviewed_at
    }

    SubscriptionPlan ||--o{ Subscription : "subscribed as"
    Subscription ||--o{ SubscriptionDelivery : generates
    Subscription ||--o{ SubscriptionCancellationRequest : "cancel request"
```

### 1.5 Module 5 – Payments, Transactions, Delivery & Settings

```mermaid
erDiagram
    PaymentMethod {
        int id PK
        string name UK
        enum type "cash_on_delivery electronic"
        bool is_active
    }
    PaymentTransaction {
        int id PK
        int order_id FK
        int subscription_id FK
        int payment_method_id FK
        string gateway_reference UK
        decimal amount
        enum status "pending succeeded failed"
        text failure_reason
        datetime created_at
        datetime updated_at
    }
    Refund {
        int id PK
        int order_id FK
        int subscription_id FK
        decimal amount
        text reason
        int recorded_by FK
        datetime recorded_at
    }
    DeliveryZone {
        int id PK
        string name UK
        decimal fee
        bool is_active
    }
    ShippingCountry {
        int id PK
        string name UK
        decimal fee
        bool is_active
    }
    ShippingCompany {
        int id PK
        string name UK
    }
    DeliveryPeriod {
        int id PK
        string name
        time start_time
        time end_time
    }
    DeliverySlot {
        int id PK
        int weekday
        int delivery_period_id FK
    }
    Holiday {
        int id PK
        date holiday_date UK
        string name
    }
    SystemSetting {
        int id PK
        string platform_name
        string language
        string currency
        int payment_deadline_minutes
        decimal commission_rate
        datetime updated_at
    }
    DeliverySetting {
        int id PK
        int min_preparation_hours
        datetime updated_at
    }
    Order { int id PK }
    Subscription { int id PK }
    User { int id PK }

    Order |o--o{ PaymentTransaction : "paid via"
    Subscription |o--o{ PaymentTransaction : "paid via"
    PaymentMethod ||--o{ PaymentTransaction : uses
    Order |o--o{ Refund : refunded
    Subscription |o--o{ Refund : refunded
    User ||--o{ Refund : recorded
    DeliveryPeriod ||--o{ DeliverySlot : offered
```

---

## 2. Updated & New Table Specifications

### 2.1 Address — UPDATED

| Attribute | Type | Key | Null | Unique | Description |
|---|---|---|---|---|---|
| id | ID (int/uuid) | PK | N | Y | Primary Key |
| user_id | ID | FK → User | N | N | Customer account owner |
| delivery_zone_id | ID | FK → DeliveryZone | N | N | Selected from active service zones |
| city | string | | N | N | City name |
| street | string | | N | N | Street details |
| access_details | text | | Y | N | Building / floor / landmark notes |
| phone | string | | N | N | Contact phone for delivery |
| is_default | bool | | N | N | Partial unique index per user where `deleted_at IS NULL` |
| created_at | datetime | | N | N | Creation timestamp |
| updated_at | datetime | | N | N | Last update timestamp |
| deleted_at | datetime | | Y | N | **Soft delete timestamp.** Prevents breaking historical Orders/Subscriptions. |

### 2.2 VoiceMessage — UPDATED

| Attribute | Type | Key | Null | Unique | Description |
|---|---|---|---|---|---|
| id | ID (int) | PK | N | Y | Internal Primary Key |
| uuid | varchar(36) | UK | N | Y | **Public QR Token.** Used in public QR endpoint to prevent IDOR enumeration. |
| grandma_id | ID | FK → Grandma | N | N | Recording owner |
| audio_url | string | | N | N | Storage URL of audio file |
| title | string | | Y | N | Display title |
| status | enum(active, inactive) | | N | N | Controls public QR playback access |
| created_at | datetime | | N | N | Creation timestamp |
| updated_at | datetime | | N | N | Last update timestamp |

### 2.3 SubscriptionPlan & Subscription — UPDATED

| Entity | Attribute | Type | Key | Null | Description |
|---|---|---|---|---|---|
| **SubscriptionPlan** | price | decimal(10,2) | | N | **Boxes price only** (excludes delivery fees). |
| **Subscription** | subtotal | decimal(10,2) | | N | Snapshot of `SubscriptionPlan.price` at checkout. Basis for grandma commission. |
| **Subscription** | fee_amount | decimal(10,2) | | N | Calculated as `DeliveryZone.fee × deliveries_count` at checkout. |
| **Subscription** | total_price | decimal(10,2) | | N | `subtotal + fee_amount` (Total paid upfront electronically). |
| **Subscription** | created_at / updated_at | datetime | | N | Audit timestamps |

### 2.4 PaymentTransaction — NEW TABLE

| Attribute | Type | Key | Null | Unique | Description |
|---|---|---|---|---|---|
| id | ID (int/uuid) | PK | N | Y | Internal transaction ID |
| order_id | ID | FK → Order | Y | N | Linked Order (nullable initially for pre-order regular checkout payment) |
| subscription_id | ID | FK → Subscription | Y | N | Linked Subscription |
| payment_method_id | ID | FK → PaymentMethod | N | N | Electronic payment gateway used |
| gateway_reference | string | UK | Y | Y | External payment provider transaction ID (idempotency key) |
| amount | decimal(10,2) | | N | N | Transaction amount |
| status | enum(pending, succeeded, failed) | | N | N | Gateway payment state |
| failure_reason | text | | Y | N | Error message if status = `failed` |
| created_at | datetime | | N | N | Attempt start time |
| updated_at | datetime | | N | N | Webhook/callback confirmation time |

---

## 3. Database Engineering: Constraints & Performance Indexes

### 3.1 Critical Database Constraints

- **Partial Unique Default Address:**
  ```sql
  CREATE UNIQUE INDEX uq_user_default_address ON addresses (user_id) WHERE is_default = true AND deleted_at IS NULL;
  ```
- **Single Grandma of the Month:**
  ```sql
  CREATE UNIQUE INDEX uq_grandma_of_month ON grandmas (is_grandma_of_month) WHERE is_grandma_of_month = true;
  ```
- **Exclusive Transaction Target** on `PaymentTransaction`:
  ```sql
  CHECK (NOT (order_id IS NOT NULL AND subscription_id IS NOT NULL))
  ```
- **Financial Integrity:** `CHECK (total_amount = subtotal + fee_amount)` on `Order`, and `CHECK (total_price = subtotal + fee_amount)` on `Subscription`.
- **Made-to-Order Rule** on `Product`:
  ```sql
  CHECK (fulfillment_type != 'made_to_order' OR (lead_time_days > 0 AND allow_scheduling = true))
  ```

### 3.2 Recommended Performance Indexes

| Table | Index Columns | Purpose |
|---|---|---|
| `Order` | `(customer_id, status, created_at DESC)` | Fast filtering in customer "My Orders" page |
| `Order` | `(status, payment_deadline)` | Background Cron Job scanning expired `awaiting_payment` orders |
| `Order` | `(grandma_id, status, delivery_date)` | Admin dashboard filters and Grandma dues report |
| `Product` | `(grandma_id, category_id, status)` | Catalog browsing & filtering |
| `SubscriptionDelivery` | `(subscription_id, status, delivery_date)` | Upcoming deliveries dashboard & customer tracking |
| `Subscription` | `(status, payment_deadline)` | Background Cron Job expiring unpaid subscriptions |
| `Notification` | `(user_id, status, created_at DESC)` | Unread notification badge & inbox list |
