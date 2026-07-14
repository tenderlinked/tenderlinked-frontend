
"use client";

import { Loader2, LogOutIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { getLogoutUrl } from "./actions/logout";
import { signOut } from "next-auth/react";

const Logout = () => {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const url = await getLogoutUrl();
    await signOut({ callbackUrl: url });
  };

  return (
    <Button
      onClick={handleLogout}
      type="button"
      className={`hover:text-red-600 flex items-center gap-3 py-0.5 text-neutral-900 dark:text-white text-base !px-0.5 cursor-pointer leading-[0] w-full justify-start hover:no-underline h-[25px] ${loading ? "text-red-600" : ""}`}
      variant="link"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin !w-4.5 !h-4.5" />
          Logging out...
        </>
      ) : (
        <>
          <LogOutIcon width={24} height={24} className="!w-4.5 !h-4.5" />
          Logout
        </>
      )}
    </Button>
  );
};

export default Logout;
