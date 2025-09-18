import { Request, Response } from "express";
import errorWrapper from "../utils/errorCatching";
import { IProduct, IThumbnail } from "../types/product.types";
import ProductModel from "../schema/product.schema";
import { productFields } from "../constants/docFeilds.constants";
import ApiError from "../utils/apiError";
import {
  deleteImage,
  getImageDetails,
  updateImage,
  uploadImage,
} from "../utils/cloudinaryHelper";
import { UploadApiResponse } from "cloudinary";

export const getAllProducts = errorWrapper(
  async (req: Request, res: Response) => {
    const { fieldsToFetch } = req.body as { fieldsToFetch: (keyof IProduct)[] };

    const projectedFields = fieldsToFetch?.reduce((acc: any, field: string) => {
      if (productFields.includes(field)) {
        acc[field] = 1;
      }
      return acc;
    }, {});

    const products = await ProductModel.find({}, projectedFields);
    const modifiedProducts = await Promise.all(
      products.map(async (product) => {
        const discountedPrice = product.calculateDiscountedPrice();
        if (discountedPrice) {
          return {
            ...product.toObject(),
            discountedPrice,
          };
        } else {
          return {
            ...product.toObject(),
          };
        }
      })
    );
    res.status(200).json(modifiedProducts);
  }
);

export const createProduct = errorWrapper(
  async (req: Request, res: Response) => {
    const fieldsToCreate = req.body as Partial<IProduct>;

    const productCreated = Object.keys(fieldsToCreate).reduce((acc, key) => {
      if (
        !["_id", "createdAt", "updatedAt"].includes(key) &&
        productFields.includes(key)
      ) {
        (acc as any)[key] = (fieldsToCreate as any)[key];
      }
      return acc;
    }, {} as IProduct);

    if (Object.keys(productCreated).length === 0) {
      throw new ApiError("No valid fields provided for product creation", 400);
    }

    const product = await ProductModel.insertOne(productCreated);

    res.status(201).json(product);
  }
);

export const updateProduct = errorWrapper(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const fieldsToUpdate = req.body as Partial<IProduct>;

    const updateData = Object.keys(fieldsToUpdate).reduce((obj, key) => {
      if (
        !["_id", "createdAt", "updatedAt"].includes(key) &&
        productFields.includes(key)
      ) {
        (obj as any)[key] = (fieldsToUpdate as any)[key];
      }
      return obj;
    }, {} as IProduct);

    if (Object.keys(updateData).length === 0) {
      throw new ApiError("No valid fields provided for product update", 400);
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      updateData,
      {
        runValidators: true,
        new: true,
      }
    );

    if (!updatedProduct) {
      throw new ApiError("ProductModel not found", 404);
    }

    res.status(200).json(updatedProduct);
  }
);

export const updateManyProducts = errorWrapper(
  async (req: Request, res: Response) => {
    const { field } = req.body;
    const errorFields: string[] = [];

    if (field?.length > 0) {
      const update = field.filter((item: Partial<IProduct>) => {
        const validObjects = Object.keys(item)
          .filter((key) => {
            if (productFields.includes(key)) {
              return key;
            } else {
              errorFields.push(key);
            }
          })
          .reduce((acc, key: string) => {
            (acc as any)[key] = (item as any)[key];
            return acc;
          }, {} as Partial<IProduct>);

        if (Object.keys(validObjects).length > 0) {
          return validObjects;
        }
      });

      await ProductModel.bulkWrite(
        update.map((item: Partial<IProduct>) => ({
          updateOne: {
            filter: { _id: (item as Partial<IProduct>)._id },
            update: { $set: item },
            upsert: false,
          },
        }))
      );

      if (errorFields.length > 0) {
        if (errorFields.includes("id")) {
          throw new ApiError(
            "id is not a valid field to update, Give _id",
            400
          );
        }
        return res.status(200).json({
          message: `Products updated successfully but these fields are invalid: ${errorFields.join(
            ", "
          )}`,
        });
      }
      res.status(200).json({ message: "Products updated successfully" });
    } else {
      throw new ApiError("field Must be an Array of Objects", 400);
    }
  }
);

export const getProductById = errorWrapper(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { fieldsToFetch } = req.body as { fieldsToFetch: string[] };

    let projection = {};

    if (fieldsToFetch?.length > 0) {
      projection = fieldsToFetch.reduce((acc: IProduct, key: string) => {
        if (productFields.includes(key)) {
          (acc as any)[key] = 1;
        }
        return acc;
      }, {} as IProduct);
    }

    const product = await ProductModel.findById(id, projection);

    if (!product) {
      throw new ApiError("ProductModel not found", 404);
    }

    const discountedPrice = product.calculateDiscountedPrice();

    const modifiedProduct = discountedPrice
      ? {
          ...product.toObject(),
          discountedPrice,
        }
      : {
          ...product.toObject(),
        };

    res.status(200).json(modifiedProduct);
  }
);

export const getProductByCategory = errorWrapper(
  async (req: Request, res: Response) => {
    const { category } = req.query as { category: string };
    const { fieldsToFetch } = req.body as { fieldsToFetch: string[] };

    let projection = {};

    if (fieldsToFetch?.length > 0) {
      projection = fieldsToFetch.reduce((acc: IProduct, key: string) => {
        if (productFields.includes(key)) {
          (acc as any)[key] = 1;
        }
        return acc;
      }, {} as IProduct);
    }

    const products = await ProductModel.findByCategory(category, projection);

    if (!products || products.length === 0) {
      throw new ApiError("No products found in this category", 404);
    }

    const modifiedProducts = products.map((product) => {
      const discountedPrice = product.calculateDiscountedPrice();
      if (discountedPrice) {
        return {
          ...product.toObject(),
          discountedPrice,
        };
      } else {
        return {
          ...product.toObject(),
        };
      }
    });

    res.status(200).json(modifiedProducts);
  }
);

export const getCategories = errorWrapper(
  async (req: Request, res: Response) => {
    const categories = await ProductModel.distinct("category");
    const subCategories = await ProductModel.distinct("subCategory");
    const brands = await ProductModel.distinct("brand");
    res.status(200).json({ categories, subCategories, brands });
  }
);

export const uploadThumbnail = errorWrapper(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    if (!req.file) throw new ApiError("File is required", 400);

    const imageUploded: UploadApiResponse = await uploadImage(
      req.file.buffer,
      "demo"
    );

    await ProductModel.findByIdAndUpdate(id, {
      thumbnail: {
        imageId: imageUploded.public_id,
        url: imageUploded.secure_url,
        format: imageUploded.format,
      },
    });

    if (imageUploded) {
      res.status(200).json({
        message: "Image uploaded successfully",
      });
    }
  }
);

export const editThumbnail = errorWrapper(
  async (req: Request, res: Response) => {
    const { imageId } = req.body as { imageId: string };

    if (!req.file) {
      throw new ApiError("File is required", 400);
    }

    const result: UploadApiResponse = await updateImage(
      imageId,
      "demo",
      req.file.buffer
    );

    if (result) {
      await ProductModel.findOneAndUpdate(
        { "thumbnail.imageId": imageId },
        {
          thumbnail: {
            imageId: result.public_id,
            url: result.secure_url,
            format: result.format,
          },
        },
        { new: true }
      );

      res.status(200).json({
        message: "Image updated successfully",
        url: result.secure_url,
      });
    } else {
      throw new ApiError("Failed to update image", 500);
    }
  }
);

export const deleteThumbnail = errorWrapper(
  async (req: Request, res: Response) => {
    const { imageId } = req.body as { imageId: string };

    const result: Record<string, any> = await deleteImage(imageId);

    if (result.result === "ok") {
      await ProductModel.findOneAndUpdate(
        { "thumbnail.imageId": imageId },
        {
          thumbnail: null,
        }
      );
      res.status(200).json({ message: "Image deleted successfully" });
    } else {
      res.status(400).json({ message: "Image Id Not Found" });
    }
  }
);

export const getThumbnailDetails = errorWrapper(
  async (req: Request, res: Response) => {
    const { imageId } = req.query as { imageId: string };

    const result: UploadApiResponse = await getImageDetails(imageId);

    res.status(200).json(result);
  }
);

export const uploadMultipleImages = errorWrapper(
  async (req: Request, res: Response) => {
    const { id } = req.query as { id: string };

    if (!req.files || req.files.length === 0)
      throw new ApiError("Files are required", 400);

    const files = req.files as Express.Multer.File[];

    const images = await Promise.all(
      files.map(async (file) => {
        const result: UploadApiResponse = await uploadImage(
          file.buffer,
          "demo"
        );
        return {
          imageId: result.public_id,
          url: result.secure_url,
          format: result.format,
        };
      })
    );

    if (images.length > 0) {
      await ProductModel.findByIdAndUpdate(id, {
        images: images,
      });
    }

    res.status(200).json({
      message: "Images uploaded successfully",
    });
  }
);

export const updateMultipleImages = errorWrapper(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const imagesIds = JSON.parse(req.query?.imagesIds as string);

    const files = req.files as Express.Multer.File[];

    if (!files || files?.length === 0)
      throw new ApiError("Files are required", 400);

    if (!Array.isArray(imagesIds) || imagesIds?.length === 0)
      throw new ApiError("ImagesIds are Required In Array", 400);

    const productDetails: IProduct | null = await ProductModel.findById(id);

    let deletedImages: Record<string, any>[] = [];

    let uploadedImages: IThumbnail[] = productDetails?.images as IThumbnail[];

    await Promise.all(
      imagesIds.map(async (imageId) => {
        const result: Record<string, any> = await deleteImage(imageId);
        deletedImages.push(result);
      })
    );

    if (
      deletedImages.length > 0 &&
      deletedImages.every((img) => img.result === "ok")
    ) {
      const filePushed: IThumbnail[] = await Promise.all(
        files.map(async (file) => {
          const result: UploadApiResponse = await uploadImage(
            file.buffer,
            "demo"
          );
          return {
            imageId: result.public_id,
            url: result.secure_url,
            format: result.format,
          };
        })
      );

      const imagesToUpdate: IThumbnail[] = uploadedImages.map((imgDetails) => {
        if (imagesIds.includes(imgDetails.imageId)) {
          const newImage = filePushed.shift();
          return newImage
            ? {
                imageId: newImage.imageId,
                url: newImage.url,
                format: newImage.format,
              }
            : imgDetails;
        } else {
          return imgDetails;
        }
      });

      await ProductModel.findByIdAndUpdate(id, {
        images: imagesToUpdate,
      });

      res.status(200).json({
        message: "Images Updated Successfully",
      });
    } else {
      throw new ApiError(
        `Failed to delete images , imageIds given ${imagesIds.join(
          ", "
        )} are invalid`,
        400
      );
    }
  }
);
