import { gql } from "apollo-server-express";

export const orderTypeDefs = gql`
  type Order {
    _id: ID!
    userId: User!
    firstName: String!
    lastName: String!
    address: String!
    city: String!
    country: String!
    zipCode: Int!
    totalAmount: Int!
    items: [Product!]!
  }

  type Query {
    orders: [Order!]!
  }
`;
