
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
    <button
      onClick={handleLogout}
      type="button"
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors group cursor-pointer"
    >
      {loading ? (
        <>
          <Loader2 className="w-4.5 h-4.5 animate-spin text-red-600" />
          <span>Logging out...</span>
        </>
      ) : (
        <>
          <LogOutIcon className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
          <span>Logout</span>
        </>
      )}
    </button>
  );
};

export default Logout;
