import { z } from "zod";

export const waitlistSchema = z.object({
    email: z.string().email("Valid email is required"),
    name: z.string().nullable().optional(),
  });
  
  // Type for validated request
export type WaitlistRequest = z.infer<typeof waitlistSchema>;