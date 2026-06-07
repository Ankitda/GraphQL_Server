import { gql } from "apollo-server-express";

export const verificationTypeDefs = gql`
  enum VerificationPlatform {
    EMAIL
    PHONE
  }

  type VerificationAttempt {
    _id: ID!
    userId: ID!
    verificationNumber: Int!
    expiresAt: Date!
    createdAt: Date!
  }

  input SendVerificationCodeInput {
    platform: VerificationPlatform!
  }

  input VerifyAccountInput {
    code: String!
  }

  input VerifyPhoneNoInput {
    code: String!
  }

  extend type Query {
    myVerificationAttempts: [VerificationAttempt!]!
  }

  extend type Mutation {
    sendVerificationCode(input: SendVerificationCodeInput!): MessageResponse!
    verifyAccount(input: VerifyAccountInput!): MessageResponse!
    verifyPhoneNo(input: VerifyPhoneNoInput!): MessageResponse!
  }
`;
