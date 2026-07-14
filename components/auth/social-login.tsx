// ============================================= Server side way start =======================================
import { doSocialLogin } from "@/app/actions";
import { useLoading } from "@/contexts/LoadingContext";
import GoogleIcon from "@/public/assets/images/icons/google-icon.png";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Button } from "../ui/button";

const MicrosoftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21">
    <path fill="#f25022" d="M1 1h9v9H1z"/>
    <path fill="#7fba00" d="M11 1h9v9h-9z"/>
    <path fill="#00a4ef" d="M1 11h9v9H1z"/>
    <path fill="#ffb900" d="M11 11h9v9h-9z"/>
  </svg>
);

const SocialLogin = () => {
  const { loading, setLoading } = useLoading();

  const [loadingButtonProvider, setLoadingButtonProvider] = useState<
    null | "google" | "microsoft"
  >(null);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);

    const form = e.currentTarget;
    const clickedButton = (document.activeElement as HTMLButtonElement)?.value;
    setLoadingButtonProvider(
      clickedButton === "google" || clickedButton === "microsoft"
        ? clickedButton
        : null
    );

    setTimeout(() => {
      setLoading(false);
      setLoadingButtonProvider(null);
    }, 2000);
  };

  return (
    <form
      className="mt-8 flex items-center gap-3"
      action={doSocialLogin}
      onSubmit={handleFormSubmit}
    >
      {/* Google Button */}
      <Button
        className="font-semibold text-neutral-600 hover:text-neutral-600 dark:text-neutral-200 py-6 px-2 w-1/2 border border-neutral-600/50 rounded-xl text-sm flex items-center justify-center gap-3 line-height-1 hover:border-blue-400 hover:bg-primary/10 disabled:opacity-80"
        variant="outline"
        type="submit"
        name="action"
        value="google"
        disabled={loadingButtonProvider === "google" || loading}
      >
        {loadingButtonProvider === "google" ? (
          <>
            <Loader2 className="animate-spin h-4.5 w-4.5" />
            Loading...
          </>
        ) : (
          <>
            <Image src={GoogleIcon} alt="google" width={18} height={18} />
            Google
          </>
        )}
      </Button>

      {/* Microsoft Button */}
      <Button
        className="font-semibold text-neutral-600 hover:text-neutral-600 dark:text-neutral-200 py-6 px-2 w-1/2 border border-neutral-600/50 rounded-xl text-sm flex items-center justify-center gap-3 line-height-1 hover:border-slate-400 hover:bg-slate-600/10 disabled:opacity-80"
        variant="outline"
        type="submit"
        name="action"
        value="microsoft"
        disabled={loadingButtonProvider === "microsoft" || loading}
      >
        {loadingButtonProvider === "microsoft" ? (
          <>
            <Loader2 className="animate-spin h-4.5 w-4.5" />
            Loading...
          </>
        ) : (
          <>
            <MicrosoftIcon />
            Microsoft
          </>
        )}
      </Button>
    </form>
  );
};

export default SocialLogin;
// ============================================= Server side way end =======================================
