import { gql } from "apollo-server-express";

export const userTypeDefs = gql`
  type User {
    _id: ID!
    username: String!
    email: String!
    isAdmin: Boolean!
  }

  type Query {
    users: [User!]!
  }
`;
