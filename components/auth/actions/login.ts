'use server'

export const handleLoginAction = async (formData: FormData) => {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  // The identifier can be either an email or a username, so we no longer enforce the '@' symbol.

  // You can optionally log or validate against DB here
  return { success: true }
}
