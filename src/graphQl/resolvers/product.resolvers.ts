import Product from "../../schema/product.schema";
import { productFields } from "../../constants/docFeilds.constants";
import {
  deleteImage,
  getImageDetails,
  updateImage,
  uploadImage,
} from "../../utils/cloudinaryHelper";
import { IProduct } from "../../types/product.types";
import { UploadApiResponse } from "cloudinary";

// Helper for GraphQL Upload stream to buffer
const streamToBuffer = async (
  stream: NodeJS.ReadableStream,
): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
};

export const productResolvers = {
  Query: {
    getAllProducts: async (
      _: any,
      { fieldsToFetch }: { fieldsToFetch?: string[] },
    ) => {
      let projection = {};
      if (fieldsToFetch && fieldsToFetch.length > 0) {
        projection = fieldsToFetch.reduce((acc: any, key: string) => {
          if (productFields.includes(key)) {
            acc[key] = 1;
          }
          return acc;
        }, {});
      }

      const products = await Product.find({}, projection);
      return products.map((product) => {
        const discountedPrice = product.calculateDiscountedPrice();
        return {
          ...product.toObject(),
          id: product._id,
          discountedPrice: discountedPrice || null,
        };
      });
    },

    getProductById: async (
      _: any,
      { _id, fieldsToFetch }: { _id: string; fieldsToFetch?: string[] },
    ) => {
      let projection = {};
      if (fieldsToFetch && fieldsToFetch.length > 0) {
        projection = fieldsToFetch.reduce((acc: any, key: string) => {
          if (productFields.includes(key)) {
            acc[key] = 1;
          }
          return acc;
        }, {});
      }

      const product = await Product.findById(_id, projection);
      if (!product) throw new Error("Product not found");

      const discountedPrice = product.calculateDiscountedPrice();
      return {
        ...product.toObject(),
        discountedPrice: discountedPrice || null,
      };
    },

    getProductByCategory: async (
      _: any,
      {
        category,
        fieldsToFetch,
      }: { category: string; fieldsToFetch?: string[] },
    ) => {
      let projection = {};
      if (fieldsToFetch && fieldsToFetch.length > 0) {
        projection = fieldsToFetch.reduce((acc: any, key: string) => {
          if (productFields.includes(key)) {
            acc[key] = 1;
          }
          return acc;
        }, {});
      }

      const products = await Product.findByCategory(category, projection);
      return products.map((product) => {
        const discountedPrice = product.calculateDiscountedPrice();
        return {
          ...product.toObject(),
          discountedPrice: discountedPrice || null,
        };
      });
    },

    getCategories: async () => {
      const categories = await Product.distinct("category");
      const subCategories = await Product.distinct("subCategory");
      const brands = await Product.distinct("brand");
      return { categories, subCategories, brands };
    },

    getThumbnailDetails: async (_: any, { imageId }: { imageId: string }) => {
      const result: UploadApiResponse = await getImageDetails(imageId);
      return {
        imageId: result.public_id,
        url: result.secure_url,
        format: result.format,
      };
    },
  },

  Mutation: {
    createProduct: async (_: any, { input }: { input: Partial<IProduct> }) => {
      const product = await Product.create(input);
      return product;
    },

    updateProduct: async (
      _: any,
      { _id, input }: { _id: string; input: Partial<IProduct> },
    ) => {
      const updatedProduct = await Product.findByIdAndUpdate(_id, input, {
        new: true,
        runValidators: true,
      });
      if (!updatedProduct) throw new Error("Product not found");
      return updatedProduct;
    },

    updateManyProducts: async (
      _: any,
      { field }: { field: (Partial<IProduct> & { _id: string })[] },
    ) => {
      const operations = field.map((item) => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: item },
          upsert: false,
        },
      }));
      await Product.bulkWrite(operations);
      return "Products updated successfully";
    },

    deleteProduct: async (_: any, { _id }: { _id: string }) => {
      const deleted = await Product.findByIdAndDelete(_id);
      return !!deleted;
    },

    uploadThumbnail: async (_: any, { file }: { file: Promise<any> }) => {
      const resolvedFile = await file;
      const buffer = await streamToBuffer(resolvedFile.createReadStream());
      const result = await uploadImage(buffer, "demo");

      return {
        imageId: result.public_id,
        url: result.secure_url,
        format: result.format,
      };
    },

    updateThumbnail: async (
      _: any,
      { imageId, file }: { imageId: string; file: Promise<any> },
    ) => {
      const resolvedFile = await file;
      const buffer = await streamToBuffer(resolvedFile.createReadStream());
      const result = await updateImage(imageId, "demo", buffer);

      if (result) {
        await Product.findOneAndUpdate(
          { "thumbnail.imageId": imageId },
          {
            thumbnail: {
              imageId: result.public_id,
              url: result.secure_url,
              format: result.format,
            },
          },
          { new: true },
        );
      } else {
        throw new Error("Failed to update image");
      }

      return {
        imageId: result.public_id,
        url: result.secure_url,
        format: result.format,
      };
    },

    deleteThumbnail: async (_: any, { imageId }: { imageId: string }) => {
      const result = await deleteImage(imageId);
      if (result.result === "ok") {
        await Product.findOneAndUpdate(
          { "thumbnail.imageId": imageId },
          { thumbnail: null },
        );
        return true;
      }
      return false;
    },

    uploadImages: async (_: any, { files }: { files: Promise<any>[] }) => {
      const uploadedImages = [];
      for (const filePromise of files) {
        const resolvedFile = await filePromise;
        const buffer = await streamToBuffer(resolvedFile.createReadStream());
        const result = await uploadImage(buffer, "demo");
        uploadedImages.push({
          imageId: result.public_id,
          url: result.secure_url,
          format: result.format,
        });
      }
      return uploadedImages;
    },

    updateImages: async (
      _: any,
      { imageIds, files }: { imageIds: string[]; files: Promise<any>[] },
    ) => {
      // 1. Delete old images
      const deletedImages = await Promise.all(
        imageIds.map(async (imageId) => {
          const result = await deleteImage(imageId);
          return { imageId, result: result.result };
        }),
      );

      // Verify all deletes succeeded
      if (!deletedImages.every((img) => img.result === "ok")) {
        throw new Error(`Failed to delete some images: ${imageIds.join(", ")}`);
      }

      // 2. Upload new images
      const newImages = [];
      for (const filePromise of files) {
        const resolvedFile = await filePromise;
        const buffer = await streamToBuffer(resolvedFile.createReadStream());
        const result = await uploadImage(buffer, "demo");
        newImages.push({
          imageId: result.public_id,
          url: result.secure_url,
          format: result.format,
        });
      }

      // 3. Update Product images array in DB where imageIds matched
      const product = await Product.findOne({
        "images.imageId": { $in: imageIds },
      });

      if (product) {
        const newImagesRefs = [...newImages];
        const imagesToUpdate = product.images?.map((img) => {
          if (imageIds.includes(img.imageId)) {
            const replacement = newImagesRefs.shift();
            return replacement ? { ...replacement } : img;
          }
          return img;
        });

        await Product.findByIdAndUpdate(product._id, {
          images: imagesToUpdate,
        });
      }

      return newImages;
    },

    deleteImages: async (_: any, { imageIds }: { imageIds: string[] }) => {
      const deletedImages = await Promise.all(
        imageIds.map(async (imageId) => {
          const result = await deleteImage(imageId);
          return { imageId, result: result.result };
        }),
      );

      if (deletedImages.every((img) => img.result === "ok")) {
        await Product.updateMany(
          { "images.imageId": { $in: imageIds } },
          { $pull: { images: { imageId: { $in: imageIds } } } },
        );
        return true;
      }
      return false;
    },
  },
};
