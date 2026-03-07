import { gql } from "apollo-server-express";

export const orderTypeDefs = gql`
  type Address {
    street: String!
    city: String!
    state: String!
    country: String!
    zipCode: String!
  }

  type OrderItem {
    product: Product!
    quantity: Int!
    subtotal: Float!
    discount: Float!
  }

  type Payment {
    method: String!
    status: String!
    transactionId: String
    paidAt: String
  }

  type Order {
    _id: ID!
    orderNumber: String!
    userDetails: User!
    shippingAddress: Address!
    billingAddress: Address!
    items: [OrderItem!]!
    payment: Payment!
    status: String!
    subtotal: Float!
    tax: Float!
    shippingCost: Float!
    discount: Float!
    totalAmount: Float!
    notes: String
    trackingNumber: String
    estimatedDeliveryDate: String
    cancelReason: String
    createdAt: String
    updatedAt: String
  }

  input AddressInput {
    street: String
    city: String
    state: String
    country: String
    zipCode: String
  }

  input OrderItemInput {
    product: ID!
    quantity: Int!
    subtotal: Float!
    discount: Float!
  }

  input PaymentInput {
    method: String!
    status: String!
    transactionId: String
    paidAt: String
  }

  input OrderInput {
    userDetails: ID!
    shippingAddress: AddressInput!
    billingAddress: AddressInput!
    items: [OrderItemInput!]
    payment: PaymentInput!
    status: String!
    subtotal: Float!
    tax: Float!
    shippingCost: Float!
    discount: Float!
    totalAmount: Float!
    notes: String
    trackingNumber: String
    estimatedDeliveryDate: String
    cancelReason: String
  }

  type Query {
    getAllOrders: [Order!]!
    getOrderById(ordernumber: String!): Order!
    getOrdersByStatus(status: String!): [Order!]!
  }

  type Mutation {
    createOrder(input: OrderInput!): Order!
    updateOrder(ordernumber: String!, input: OrderInput!): Order!
  }
`;
