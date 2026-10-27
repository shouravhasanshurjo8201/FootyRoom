import { Document, Types } from "mongoose";
import type { Request } from "express";

export interface IUser extends Document {
    name: string;
    email: string;
    avatar?: string;
    googleId: string;
    createdAt: Date;
    updatedAt: Date;
    refreshToken?: string;
}

export interface IBrand extends Document {
    name: string;
    slug: string;
}

export interface ICategory extends Document {
    name: string;
    slug: string;
}

export interface IProduct extends Document {
    productName: string;
    avatar: string;
    brand: Types.ObjectId | IBrand;
    category: Types.ObjectId | ICategory;
    price: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
    user?: IUser;
}