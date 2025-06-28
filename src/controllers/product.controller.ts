import { Request, Response } from 'express';
import errorWrapper from "../utils/errorCatching";
import { Product } from '../types/product.types';
import ProductModel from '../schema/product.schema';

export const getAllProducts = errorWrapper( async (req: Request, res: Response) => {
  const products = await ProductModel.find();
  res.status(200).json(products);
});

export const createProduct = errorWrapper(async (req: Request, res: Response) => {
    const {
      title,
      description,
      price,
      stock,
      brand,
      category,  
    } = req.body as Product;

    const product = await ProductModel.create({
      title,
      description,
      price,
      stock,
      brand,
      category,  
    });

    res.status(201).json(product);
});
