import { z } from 'zod';

export const signupSchema = z.object({
  firstname: z
    .string()
    .min(2, { message: "Firstname must be at least 2 characters" })
    .max(30, { message: "Firstname is too long" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email format (e.g. user@krypt.io)" }),
  password: z
    .string()
    .min(6, { message: "Encryption key (password) must be at least 6 characters" }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email address" }),
  password: z
    .string()
    .min(1, { message: "Password is required" }),
});