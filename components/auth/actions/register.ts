"use server";

import { registerSchema } from "@/lib/zod";

export async function registerUser(formData: FormData): Promise<
  | { success: true }
  | { error: string }
> {
  try {
    const email = formData.get("email")?.toString() ?? "";
    const firstName = formData.get("firstName")?.toString() ?? "";
    const lastName = formData.get("lastName")?.toString() ?? "";
    const phone = formData.get("phone")?.toString() ?? "";
    const companyName = formData.get("companyName")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";
    const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";
    const acceptTerms = formData.get("acceptTerms") === "on";

    const result = registerSchema.safeParse({
      email,
      firstName,
      lastName,
      phone,
      companyName: companyName || undefined,
      password,
      confirmPassword,
      acceptTerms,
    });

    if (!result.success) {
      const errorMessages = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return { error: `Validation error: ${errorMessages}` };
    }

    await new Promise((res) => setTimeout(res, 1000));

    return { success: true };
  } catch (error) {
    console.error("Register error:", error);
    return { error: "Something went wrong during registration." };
  }
}

