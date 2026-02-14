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
    phoneNo: String
    role: Role!
    accountVerified: Boolean!
    isPhoneNoVerified: Boolean!
    isActive: Boolean!
    orders: [IOrder]
    createdAt: Date!
    updatedAt: Date!
  }

  type AuthPayload {
    token: String!
  }

  type MessageResponse {
    message: String!
  }

  type ActivateAccountDeactivationResponse {
    message: String!
    scheduledDeactivationAt: Date!
  }

  type CancelAccountDeactivationResponse {
    message: String!
  }

  input CreateUserInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input forgotPasswordInput {
    email: String!
    _id: ID!
  }

  input ResetPasswordInput {
    oldPassword: String!
    newPassword: String!
    token: String!
  }

  input UpdateUserInput {
    username: String
    phoneNo: String
    role: Role
  }

  input AccountDeactivationRequestInput {
    _id: ID!
  }

  type Query {
    # Get all users with optional field selection
    users(fieldsToFetch: [String!]): [User!]!
    
    # Get user by ID with optional field selection
    user(fieldsToFetch: [String!]): User!
    
    # Get all orders for the authenticated user
    userOrderHistory: [IOrder!]!
  }

  type Mutation {
    # Create a new user account
    createUser(input: CreateUserInput!): User!
    
    # Login and receive authentication token
    login(input: LoginInput!): AuthPayload!
    
    # Request password reset (sends email with reset token)
    forgotPassword(input: forgotPasswordInput!): MessageResponse!
    
    # Reset password using token from email
    resetPassword(input: ResetPasswordInput!): MessageResponse!
    
    # Update user profile (requires authentication)
    updateUser(input: UpdateUserInput!): User!

    accountDeactivationRequest(input: AccountDeactivationRequestInput!): ActivateAccountDeactivationResponse!

    cancelDeactivationRequest(input: AccountDeactivationRequestInput!) : CancelAccountDeactivationResponse!
  }
`;
