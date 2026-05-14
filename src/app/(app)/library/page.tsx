import { createClient } from "@/lib/supabase/server";
import BookshelfView from "@/components/library/BookshelfView";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // user is guaranteed non-null by the (app) layout auth guard
  return <BookshelfView parentId={user!.id} />;
}
