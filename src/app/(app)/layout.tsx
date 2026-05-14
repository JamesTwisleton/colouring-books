import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Providers from "@/components/ui/Providers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Providers>
      <div className="h-screen flex flex-col bg-[#fff9f0] overflow-hidden">
        {children}
      </div>
    </Providers>
  );
}
