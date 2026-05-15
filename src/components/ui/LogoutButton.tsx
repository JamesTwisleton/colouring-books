"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({
  className,
  children,
  title,
}: {
  className?: string;
  children?: React.ReactNode;
  title?: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className={className} title={title}>
      {children ?? "Log out"}
    </button>
  );
}
