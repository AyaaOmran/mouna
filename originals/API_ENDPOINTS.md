# API Endpoints

## 1. Authentication

- `POST /auth/register`
- `POST /auth/register/verify-otp`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/password/forgot`
- `POST /auth/password/verify-otp`
- `POST /auth/password/reset`

## 2. Account

- `GET /me`
- `PATCH /me`
- `POST /me/phone/change-request`
- `POST /me/phone/verify-otp`
- `PUT /me/password`
- `GET /me/addresses`
- `POST /me/addresses`
- `GET /me/addresses/{addressId}`
- `PUT /me/addresses/{addressId}`
- `DELETE /me/addresses/{addressId}`
- `GET /me/notifications`
- `PATCH /me/notifications/{notificationId}`

## 3. Admin Customers

- `GET /admin/customers`
- `GET /admin/customers/{customerId}`

## 4. Super Admin

- `GET /super-admin/admins`
- `POST /super-admin/admins`
- `GET /super-admin/admins/{adminId}`
- `PATCH /super-admin/admins/{adminId}`
- `PUT /super-admin/admins/{adminId}/permissions`
- `GET /super-admin/permissions`
- `GET /super-admin/settings/system`
- `PATCH /super-admin/settings/system`
- `GET /super-admin/payment-methods`
- `PATCH /super-admin/payment-methods/{paymentMethodId}`
- `GET /super-admin/activity-logs`

## 5. Admin Dashboard & Reports

- `GET /admin/dashboard`
- `GET /admin/reports/sales`
- `GET /admin/reports/subscriptions`
- `GET /admin/reports/grandma-dues`

## 6. Public Catalog

- `GET /settings/public`
- `GET /categories`
- `GET /seasons`
- `GET /grandmas`
- `GET /grandmas/{grandmaId}`
- `GET /products`
- `GET /products/{productId}`
- `GET /voice-messages/{voiceMessageUuid}`

## 7. Admin Grandmas

- `GET /admin/grandmas`
- `POST /admin/grandmas`
- `GET /admin/grandmas/{grandmaId}`
- `PUT /admin/grandmas/{grandmaId}`
- `PUT /admin/grandmas/{grandmaId}/grandma-of-month`
- `GET /admin/grandmas/{grandmaId}/recipes`
- `POST /admin/grandmas/{grandmaId}/recipes`
- `PUT /admin/recipes/{recipeId}`
- `DELETE /admin/recipes/{recipeId}`
- `GET /admin/grandmas/{grandmaId}/voice-messages`
- `POST /admin/grandmas/{grandmaId}/voice-messages`
- `PUT /admin/voice-messages/{voiceMessageId}`

## 8. Admin Catalog

- `GET /admin/categories`
- `POST /admin/categories`
- `PUT /admin/categories/{categoryId}`
- `GET /admin/seasons`
- `POST /admin/seasons`
- `PUT /admin/seasons/{seasonId}`
- `GET /admin/products`
- `POST /admin/products`
- `GET /admin/products/{productId}`
- `PUT /admin/products/{productId}`
- `POST /admin/products/{productId}/images`
- `DELETE /admin/products/{productId}/images/{imageId}`

## 9. Reviews

- `POST /orders/{orderId}/items/{orderItemId}/review`

## 10. Customer Subscriptions

- `GET /subscription-plans`
- `GET /subscription-plans/{planId}`
- `GET /subscriptions`
- `POST /subscriptions`
- `GET /subscriptions/{subscriptionId}`
- `POST /subscriptions/{subscriptionId}/cancellation-requests`

## 11. Admin Subscriptions

- `GET /admin/subscription-plans`
- `POST /admin/subscription-plans`
- `GET /admin/subscription-plans/{planId}`
- `PUT /admin/subscription-plans/{planId}`
- `DELETE /admin/subscription-plans/{planId}`
- `GET /admin/subscriptions`
- `GET /admin/subscriptions/{subscriptionId}`
- `POST /admin/subscriptions/{subscriptionId}/refunds`
- `GET /admin/subscription-cancellation-requests`
- `POST /admin/subscription-cancellation-requests/{requestId}/approve`
- `POST /admin/subscription-cancellation-requests/{requestId}/reject`
- `GET /admin/subscription-deliveries`
- `PATCH /admin/subscription-deliveries/{deliveryId}`

## 12. Checkout Reference Data

- `GET /delivery-zones`
- `GET /shipping-countries`
- `GET /payment-methods`
- `GET /delivery/availability`

## 13. Customer Orders

- `POST /orders/preview`
- `GET /orders`
- `POST /orders`
- `GET /orders/{orderId}`
- `POST /orders/{orderId}/cancel`

## 14. Payments

- `POST /payments`
- `GET /payments/{paymentId}`
- `POST /payments/webhook`

## 15. Admin Orders

- `GET /admin/orders`
- `GET /admin/orders/{orderId}`
- `PATCH /admin/orders/{orderId}`
- `POST /admin/orders/{orderId}/approve`
- `POST /admin/orders/{orderId}/reject`
- `POST /admin/orders/{orderId}/status`
- `PUT /admin/orders/{orderId}/shipment`
- `POST /admin/orders/{orderId}/cancel`
- `POST /admin/orders/{orderId}/refunds`

## 16. Admin Delivery & Shipping

- `GET /admin/delivery-zones`
- `POST /admin/delivery-zones`
- `PUT /admin/delivery-zones/{zoneId}`
- `GET /admin/delivery-periods`
- `POST /admin/delivery-periods`
- `PUT /admin/delivery-periods/{periodId}`
- `DELETE /admin/delivery-periods/{periodId}`
- `GET /admin/delivery-slots`
- `POST /admin/delivery-slots`
- `DELETE /admin/delivery-slots/{slotId}`
- `GET /admin/holidays`
- `POST /admin/holidays`
- `DELETE /admin/holidays/{holidayId}`
- `GET /admin/settings/delivery`
- `PUT /admin/settings/delivery`
- `GET /admin/shipping-countries`
- `POST /admin/shipping-countries`
- `PUT /admin/shipping-countries/{countryId}`
- `GET /admin/shipping-companies`
- `POST /admin/shipping-companies`
- `PUT /admin/shipping-companies/{companyId}`
