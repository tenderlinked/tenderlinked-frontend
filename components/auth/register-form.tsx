"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLoading } from "@/contexts/LoadingContext";
import { registerSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail, UserRound, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import SocialLogin from "./social-login";

const RegisterForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { loading, setLoading } = useLoading();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isPhoneAvailable, setIsPhoneAvailable] = useState<boolean | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [successData, setSuccessData] = useState<{
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      phone: "",
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const username = form.watch("username");
  const email = form.watch("email");
  const phone = form.watch("phone");

  useEffect(() => {
    if (!username || username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (res.ok) {
          setIsUsernameAvailable(data.available);
        } else {
          setIsUsernameAvailable(null);
        }
      } catch (error) {
        setIsUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setIsEmailAvailable(null);
      return;
    }

    setIsCheckingEmail(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (res.ok) {
          setIsEmailAvailable(data.available);
        } else {
          setIsEmailAvailable(null);
        }
      } catch (error) {
        setIsEmailAvailable(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email]);

  useEffect(() => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setIsPhoneAvailable(null);
      return;
    }

    setIsCheckingPhone(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (res.ok) {
          setIsPhoneAvailable(data.available);
        } else {
          setIsPhoneAvailable(null);
        }
      } catch (error) {
        setIsPhoneAvailable(null);
      } finally {
        setIsCheckingPhone(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [phone]);

  const handleRegisterFormSubmit = async (
    values: z.infer<typeof registerSchema>
  ) => {
    setLoading(true);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.username, // custom username
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          companyName: values.companyName,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created successfully!");
      setSuccessData({
        username: values.username,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      // We don't redirect here anymore, we show the success screen
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  if (successData) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "https:" : "http:";
    // If rootDomain has a port in it (e.g., localhost:3000), we just prepend subdomain.
    // If we're on localhost, the browser might restrict subdomains, but this provides the correct URL.
    const loginUrl = `${protocol}//${successData.username}.${rootDomain}/auth/login`;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Account Created!</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Your workspace has been set up successfully. You can now log in to your dedicated portal.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 w-full text-left space-y-4 border border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Name</p>
            <p className="font-semibold">{successData.firstName} {successData.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Email</p>
            <p className="font-semibold">{successData.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Workspace / Subdomain</p>
            <p className="font-semibold">{successData.username}</p>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Login Address</p>
            <a href={loginUrl} className="text-primary font-medium hover:underline break-all">
              {loginUrl}
            </a>
          </div>
        </div>

        <Button
          onClick={() => window.location.href = loginUrl}
          className="w-full rounded-lg mt-4 h-[52px] text-sm"
        >
          Go to Login Page
        </Button>
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleRegisterFormSubmit)}
          className="space-y-5"
        >
          {/* Username Field */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <UserRound className="absolute start-5 top-1/2 transform -translate-y-1/2 text-xl text-neutral-700 dark:text-neutral-200 w-5 h-5" />
                    <Input
                      {...field}
                      type="text"
                      placeholder="Username (e.g. johndoe123)"
                      className={`ps-13 pe-12 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border ${
                        isUsernameAvailable === true
                          ? "border-green-500 focus-visible:border-green-500"
                          : isUsernameAvailable === false
                          ? "border-red-500 focus-visible:border-red-500"
                          : "border-neutral-300 dark:border-slate-700 focus-visible:border-primary"
                      } focus:border-primary dark:focus:border-primary !shadow-none !ring-0`}
                      disabled={loading}
                    />
                    <div className="absolute end-4 top-1/2 transform -translate-y-1/2 flex items-center">
                      {isCheckingUsername && (
                        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                      )}
                      {!isCheckingUsername && isUsernameAvailable === true && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                      {!isCheckingUsername && isUsernameAvailable === false && (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </FormControl>
                {!isCheckingUsername && isUsernameAvailable === true && (
                  <p className="text-sm text-green-600 mt-1 font-medium">Username is available</p>
                )}
                {!isCheckingUsername && isUsernameAvailable === false && (
                  <p className="text-sm text-red-600 mt-1 font-medium">Username is unavailable</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            {/* First Name Field */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <UserRound className="absolute start-5 top-1/2 transform -translate-y-1/2 text-xl text-neutral-700 dark:text-neutral-200 w-5 h-5" />
                      <Input
                        {...field}
                        type="text"
                        placeholder="First Name"
                        className="ps-13 pe-4 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
                        disabled={loading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name Field */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="text"
                        placeholder="Last Name"
                        className="px-4 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
                        disabled={loading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute start-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-700 dark:text-neutral-200" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="Email"
                      className={`ps-13 pe-12 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border ${
                        isEmailAvailable === true
                          ? "border-green-500 focus-visible:border-green-500"
                          : isEmailAvailable === false
                          ? "border-red-500 focus-visible:border-red-500"
                          : "border-neutral-300 dark:border-slate-700 focus-visible:border-primary"
                      } focus:border-primary dark:focus:border-primary !shadow-none !ring-0`}
                      disabled={loading}
                    />
                    <div className="absolute end-4 top-1/2 transform -translate-y-1/2 flex items-center">
                      {isCheckingEmail && (
                        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                      )}
                      {!isCheckingEmail && isEmailAvailable === true && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                      {!isCheckingEmail && isEmailAvailable === false && (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </FormControl>
                {!isCheckingEmail && isEmailAvailable === true && (
                  <p className="text-sm text-green-600 mt-1 font-medium">Email is available</p>
                )}
                {!isCheckingEmail && isEmailAvailable === false && (
                  <p className="text-sm text-red-600 mt-1 font-medium">Email is already taken</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="text"
                        placeholder="Phone Number"
                        className={`px-4 pe-12 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border ${
                          isPhoneAvailable === true
                            ? "border-green-500 focus-visible:border-green-500"
                            : isPhoneAvailable === false
                            ? "border-red-500 focus-visible:border-red-500"
                            : "border-neutral-300 dark:border-slate-700 focus-visible:border-primary"
                        } focus:border-primary dark:focus:border-primary !shadow-none !ring-0`}
                        disabled={loading}
                      />
                      <div className="absolute end-4 top-1/2 transform -translate-y-1/2 flex items-center">
                        {isCheckingPhone && (
                          <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                        )}
                        {!isCheckingPhone && isPhoneAvailable === true && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                        {!isCheckingPhone && isPhoneAvailable === false && (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  {!isCheckingPhone && isPhoneAvailable === true && (
                    <p className="text-sm text-green-600 mt-1 font-medium">Available</p>
                  )}
                  {!isCheckingPhone && isPhoneAvailable === false && (
                    <p className="text-sm text-red-600 mt-1 font-medium">Already taken</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Field */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        value={field.value || ""}
                        type="text"
                        placeholder="Company Name (Optional)"
                        className="px-4 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
                        disabled={loading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute start-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-700 dark:text-neutral-200" />
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="ps-13 pe-12 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 !p-0 bg-transparent hover:bg-transparent text-muted-foreground h-[unset]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute start-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-700 dark:text-neutral-200" />
                    <Input
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      className="ps-13 pe-12 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 !p-0 bg-transparent hover:bg-transparent text-muted-foreground h-[unset]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remember Me and Forgot Password */}
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2 flex justify-between items-center">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="createAccount"
                      className="border border-neutral-500 w-4.5 h-4.5 mt-1"
                    />
                  </FormControl>
                  <label htmlFor="createAccount" className="text-sm">
                    By creating an account means you agree to the{" "}
                    <Link
                      href="#"
                      className="text-primary font-semibold hover:underline"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and our{" "}
                    <Link
                      href="#"
                      className="text-primary font-semibold hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full rounded-lg mt-1 h-[52px] text-sm mt-2"
            disabled={loading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4.5 w-4.5 mr-2" />
                Loading...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="mt-8 relative text-center before:absolute before:w-full before:h-px before:bg-neutral-300 dark:before:bg-slate-600 before:top-1/2 before:left-0">
        <span className="relative z-10 px-4 bg-white dark:bg-slate-900 text-base">
          Or sign in with
        </span>
      </div>

      {/* Social Login */}
      <SocialLogin />

      {/* Signup Prompt */}
      <div className="mt-8 text-center text-sm">
        <p>
          Already have an account? {" "}
          <Link
            href="/auth/login"
            className="text-primary font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
};

export default RegisterForm;