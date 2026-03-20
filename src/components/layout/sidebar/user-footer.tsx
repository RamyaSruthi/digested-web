"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

export function UserFooter() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      router.push("/login");
      router.refresh();
    }
  }

  if (!user) return null;

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "?";
  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";

  return (
    <div className="p-3 border-t border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 transition-colors hover:bg-muted group">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xs text-white font-semibold gradient-brand">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold truncate text-text-primary">{displayName}</p>
              <p className="text-[10px] truncate text-text-muted">{user.email}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-52 mb-1">
          <DropdownMenuItem asChild>
            <Link href="/app/settings" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
