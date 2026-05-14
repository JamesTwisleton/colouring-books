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

  // Ensure a profiles row exists — handles users who signed up before the
  // migration ran (trigger only fires for new sign-ups going forward)
  await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email! }, { onConflict: "id" });

  return (
    <Providers>
      <div className="h-screen flex flex-col bg-[#fff9f0] overflow-hidden">
        {children}
      </div>
    </Providers>
  );
}
