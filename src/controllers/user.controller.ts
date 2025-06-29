import { Request, Response } from "express";
import catchAsync from "../utils/errorCatching";
import User from "../schema/user.schema";
import { User as IUser } from "../types/user.types";

export const createUser = catchAsync(async (req : Request, res : Response)=>{
    const { username, email, password } = req.body as IUser;

    const user = await User.findOne({ email });
    
    if(user){
        throw new ApiError("User already exists", 400);
    }

    const newUser = await User.create({
        username,
        email,
        password,
    });

    res.status(201).json(newUser);
});

export const getAllUsers = catchAsync(async (req : Request, res : Response)=>{
    const users = await User.find({});
    res.status(200).json(users);
});
