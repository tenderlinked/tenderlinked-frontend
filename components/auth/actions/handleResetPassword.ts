'use server';

import { redirect } from "next/navigation";
import { createPasswordSchema } from "@/lib/zod";

export async function handleResetPassword(formData: FormData) {
  const values = {
    email: formData.get("email") as string,
    otp: formData.get("otp") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    acceptTerms: formData.get("acceptTerms") === "on",
  };

  const result = createPasswordSchema.safeParse(values);

  if (!result.success) {
    return {
      success: false,
      message: "Validation failed",
      error: result.error.flatten().fieldErrors,
    };
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/auth/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: values.email, 
        otp: values.otp,
        newPassword: values.password 
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        message: errorData?.message || 'Failed to verify OTP or update password'
      };
    }

    return {
      success: true,
      message: 'Password reset successfully'
    };
  } catch (error) {
    console.error('Failed to connect to auth API for reset password:', error);
    return {
      success: false,
      message: 'Failed to connect to server'
    };
  }
}
