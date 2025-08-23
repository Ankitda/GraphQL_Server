import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinaryConfig";

export const getImageDetails = async (
  imageId: string
): Promise<UploadApiResponse> => {
  return new Promise(async (resolve, reject) => {
    await cloudinary.api.resource(
      imageId,
      {
        resource_type: "image",
      },
      (
        err?: UploadApiErrorResponse | undefined,
        result?: UploadApiResponse
      ) => {
        if (err) return reject(err);
        if (result) return resolve(result);
      }
    );
  });
};

export const deleteImage = async (
  imageId: string
): Promise<Record<string, any>> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      imageId,
      {
        resource_type: "image",
      },
      (
        err?: UploadApiErrorResponse | undefined,
        result?: Record<string, any>
      ) => {
        if (err) reject(err);
        if (result) resolve(result);
      }
    );
  });
};

export const updateImage = async (
  imageId: string,
  folder: string,
  file: Buffer
): Promise<UploadApiResponse> => {
  await deleteImage(imageId);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: imageId,
        overwrite: true,
        resource_type: "auto",
      },
      (
        err?: UploadApiErrorResponse | undefined,
        result?: UploadApiResponse
      ) => {
        if (err) return reject(err);
        if (result) return resolve(result);
      }
    );
    stream.end(file);
  });
};

export const uploadImage = async (
  file: Buffer,
  folder?: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
      },
      (err: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
        if (err) return reject(err);
        if (result) return resolve(result);
      }
    );
    stream.end(file);
  });
};
