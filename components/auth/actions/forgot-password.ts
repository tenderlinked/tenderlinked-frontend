'use server'

import { z } from 'zod'
import { forgotPasswordSchema } from '@/lib/zod'

export async function handleForgotPasswordAction(formData: FormData) {
  const email = formData.get('email')
  const parsed = forgotPasswordSchema.safeParse({ email })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors,
      message: 'Validation failed'
    }
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/auth/send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: parsed.data.email })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        message: errorData?.message || 'Failed to send OTP'
      };
    }

    return {
      success: true,
      email: parsed.data.email
    };
  } catch (error) {
    console.error('Failed to connect to auth API:', error);
    return {
      success: false,
      message: 'Failed to connect to server'
    };
  }
}
