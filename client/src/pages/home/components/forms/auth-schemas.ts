import { z } from "zod";

export const importFormSchema = z
  .object({
    privateKey: z.string().min(1, "Private key is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((val) => {
        const hasUpperCase = /[A-Z]/.test(val);
        const hasLowerCase = /[a-z]/.test(val);
        const hasNumber = /\d/.test(val);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(val);
        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
      }, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
  });
export type ImportFormSchema = z.infer<typeof importFormSchema>;

export const createAccountFormSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username is required")
      .max(20, "Username must be less than 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((val) => {
        const hasUpperCase = /[A-Z]/.test(val);
        const hasLowerCase = /[a-z]/.test(val);
        const hasNumber = /\d/.test(val);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(val);
        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
      }, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
  });
export type CreateAccountFormSchema = z.infer<typeof createAccountFormSchema>;

export const usernameSchema = z.string().min(1, "Username is required");
