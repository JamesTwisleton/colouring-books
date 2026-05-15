import { createClient } from "@/lib/supabase/server";
import StudioDashboard from "@/components/studio/StudioDashboard";

export default async function StudioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <StudioDashboard userId={user!.id} />;
}
