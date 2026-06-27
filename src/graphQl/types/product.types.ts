import { gql } from "apollo-server-express";

export const productTypeDefs = gql`
  scalar Upload
  scalar JSON

  enum ProductStatus {
    DRAFT
    PUBLISHED
    OUT_OF_STOCK
    DISCONTINUED
  }

  type Thumbnail {
    imageId: String!
    url: String!
    format: String!
  }

  type KeyValuePair {
    key: String!
    value: String!
  }

  type Product {
    _id: ID!
    title: String!
    description: String!
    price: Float!
    discountedPrice: Float
    discountPercentage: Float
    rating: Float
    totalReviews: Int
    stock: Int!
    brand: String!
    category: String!
    subCategory: String!
    thumbnail: Thumbnail
    images: [Thumbnail!]
    status: String!
    metadata: JSON
    isActive: Boolean!
    createdAt: String
    updatedAt: String
  }

  type CategoriesResponse {
    categories: [String!]!
    subCategories: [String!]!
    brands: [String!]!
  }

  type deleteResponse {
    message: String!
    isDeleted: Boolean!
  }

  input ThumbnailInput {
    imageId: String!
    url: String!
    format: String!
  }

  input ProductInput {
    title: String!
    description: String!
    price: Float!
    discountPercentage: Float
    stock: Int!
    brand: String!
    category: String!
    subCategory: String!
    status: ProductStatus!
    metadata: JSON
  }

  input ProductUpdateInput {
    title: String
    description: String
    price: Float
    discountPercentage: Float
    stock: Int
    brand: String
    category: String
    subCategory: String
    status: String
    metadata: JSON
  }

  input ProductUpdateManyInput {
    _id: ID!
    title: String
    description: String
    price: Float
    discountPercentage: Float
    stock: Int
    brand: String
    category: String
    subCategory: String
    status: String
    metadata: JSON
  }

  input ProductReviews {
    userDetails: ID!
    rating: Int!
    feedback: String!
  }

  extend type Query {
    getAllProducts(fieldsToFetch: [String!]): [Product!]!
    getProductById(_id: ID!, fieldsToFetch: [String!]): Product
    getProductByCategory(
      category: String!
      fieldsToFetch: [String!]
    ): [Product!]!
    getCategories: CategoriesResponse!
    getThumbnailDetails(imageId: String!): Thumbnail!
  }

  extend type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(_id: ID!, input: ProductUpdateInput!): Product!
    updateProductReview(_id: ID!, input: ProductReviews!): Product!
    updateManyProducts(field: [ProductUpdateManyInput!]!): [Product!]!
    deleteProduct(_id: ID!): deleteResponse!
    uploadThumbnail(file: Upload!): Thumbnail!
    updateThumbnail(imageId: String!, file: Upload!): Thumbnail!
    deleteThumbnail(imageId: String!): Boolean!
    uploadImages(files: [Upload!]!): [Thumbnail!]!
    updateImages(imageIds: [String!]!, files: [Upload!]!): [Thumbnail!]!
    deleteImages(imageIds: [String!]!): Boolean!
  }
`;
