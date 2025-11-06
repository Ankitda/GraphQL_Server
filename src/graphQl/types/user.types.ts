import { gql } from "apollo-server-express";

export const userTypeDefs = gql`
  scalar Date

  enum Role {
    USER
    ADMIN
  }

  type IOrder {
    orderId: ID!
    orderNo: String!
  }

  type User {
    _id: ID!
    username: String!
    email: String!
    phoneNo: String!
    role: Role!
    accountVerified: Boolean!
    isPhoneNoVerified: Boolean!
    isActive: Boolean!
    orders: [IOrder]!
    createdAt: Date!
    updatedAt: Date!
  }

  input CreateUserInput {
    username: String!
    email: String!
    password: String!
  }

  input UpdateUserInput {
    username: String!
    email: String!
    phoneNo: String!
    role: Role!
  }

  type Query {
    users(limit: Int, offset: Int): [User!]!
    user(id: String!): User!
    userOrderHistory(id: String!): [IOrder!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(input: UpdateUserInput!): User!
  }
`;
