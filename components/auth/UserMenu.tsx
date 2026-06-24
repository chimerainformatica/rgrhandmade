"use client";

import { useAuth } from "@/lib/useSupabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.push("/auth/login");
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">{user.email}</span>
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white font-medium hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? "Logout..." : "Logout"}
      </button>
    </div>
  );
}
