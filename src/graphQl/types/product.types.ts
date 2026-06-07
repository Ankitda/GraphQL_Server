import { gql } from "apollo-server-express";

export const productTypeDefs = gql`
  scalar Upload

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
    metadata: [KeyValuePair!]
    isActive: Boolean!
    createdAt: String
    updatedAt: String
  }

  type CategoriesResponse {
    categories: [String!]!
    subCategories: [String!]!
    brands: [String!]!
  }

  input ThumbnailInput {
    imageId: String!
    url: String!
    format: String!
  }

  input KeyValuePairInput {
    key: String!
    value: String!
  }

  input ProductInput {
    title: String!
    description: String!
    price: Float!
    discountPercentage: Float
    rating: Float
    totalReviews: Int
    stock: Int!
    brand: String!
    category: String!
    subCategory: String!
    thumbnail: ThumbnailInput
    images: [ThumbnailInput!]
    status: String!
    metadata: [KeyValuePairInput!]
    isActive: Boolean!
  }

  input ProductUpdateInput {
    title: String
    description: String
    price: Float
    discountPercentage: Float
    rating: Float
    totalReviews: Int
    stock: Int
    brand: String
    category: String
    subCategory: String
    thumbnail: ThumbnailInput
    images: [ThumbnailInput!]
    status: String
    metadata: [KeyValuePairInput!]
    isActive: Boolean
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
    updateManyProducts(field: [ProductUpdateInput!]!): String!
    deleteProduct(_id: ID!): Boolean!
    uploadThumbnail(file: Upload!): Thumbnail!
    updateThumbnail(imageId: String!, file: Upload!): Thumbnail!
    deleteThumbnail(imageId: String!): Boolean!
    uploadImages(files: [Upload!]!): [Thumbnail!]!
    updateImages(imageIds: [String!]!, files: [Upload!]!): [Thumbnail!]!
    deleteImages(imageIds: [String!]!): Boolean!
  }
`;
