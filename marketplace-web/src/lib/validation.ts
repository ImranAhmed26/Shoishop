import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['BUYER', 'SHOP_OWNER']),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createShopSchema = z.object({
  name: z.string().trim().min(1, 'Shop name is required'),
  slug: z.string().trim().min(1, 'Shop slug is required'),
});

export const createProductSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  priceCents: z.number().int().positive('Price must be greater than 0'),
  compareAtPriceCents: z.number().int().min(0, 'Compare-at price cannot be negative').optional(),
  costPriceCents: z.number().int().min(0, 'Cost price cannot be negative').optional(),
  stockQty: z.number().int().min(0, 'Stock cannot be negative'),
  weight: z.number().min(0, 'Weight cannot be negative').optional(),
});

export const checkoutSchema = z
  .object({
    isGuest: z.boolean(),
    guestName: z.string().trim().optional(),
    guestPhone: z.string().trim().optional(),
    shippingAddress: z.string().trim().min(5, 'Address must be at least 5 characters'),
    shippingCity: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isGuest) {
      if (!data.guestName) {
        ctx.addIssue({ code: 'custom', path: ['guestName'], message: 'Name is required' });
      }
      if (!data.guestPhone) {
        ctx.addIssue({ code: 'custom', path: ['guestPhone'], message: 'Phone number is required' });
      }
    }
  });

export function firstFieldError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input';
}
