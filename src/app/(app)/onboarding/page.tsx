import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-brand-purple-light rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📚</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">
          Welcome to Digested!
        </h1>
        <p className="text-text-secondary mb-8">
          Start by creating a folder to organize your links, or go straight to
          saving your first link.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild className="bg-brand-purple hover:bg-brand-purple-dark">
            <Link href="/app">Go to my feed</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
