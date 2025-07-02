import { gql } from "apollo-server-express";

export const productTypeDefs = gql`
  type Product {
    _id: ID!
    title: String!
    description: String!
    discountPercentage: String!
    brand: String!
    category: String!
    price: Int!
    rating: Int!
    stock: Int!
    thumbnail: String!
    images: String!
  }

  type Query {
    products: [Product!]!
  }
`;
