"use server"

import { signIn, signOut } from "@/auth";

export async function doSocialLogin (formData:FormData) {
    const action = formData.get('action');
    await signIn("keycloak", { redirectTo: '/dashboard' }, { kc_idp_hint: action as string });
}

export async function doLogout () {
    await signOut();
}
