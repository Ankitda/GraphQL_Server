export const userFields = [
  "_id",
  "username",
  "email",
  "password",
  "isActive",
  "phoneNo",
  "accountVerified",
  "isPhoneNoVerified",
  "resetPasswordToken",
  "resetPasswordExpires",
  "orders",
  "createdAt",
  "updatedAt",
];

export const productFields = [
  "_id",
  "title",
  "description",
  "price",
  "discountPercentage",
  "rating",
  "totalReviews",
  "stock",
  "brand",
  "category",
  "subCategory",
  "thumbnail",
  "images",
  "status",
  "metadata",
  "isActive",
  "createdAt",
  "updatedAt",
];

export const orderFields = [
  "_id",
  "orderNumber",
  "userDetails",
  "shippingAddress",
  "billingAddress",
  "items",
  "payment",
  "status",
  "subtotal",
  "tax",
  "shippingCost",
  "discount",
  "totalAmount",
  "notes",
  "trackingNumber",
  "estimatedDeliveryDate",
  "cancelReason",
  "createdAt",
  "updatedAt",
];

export const orderAddressFields = [
  "street",
  "city",
  "state",
  "country",
  "zipCode",
];

export const orderItemFields = ["product", "quantity", "discount", "subtotal"];

export const orderPaymentFields = [
  "method",
  "status",
  "transactionId",
  "paidAt",
];
