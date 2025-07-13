import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useProfile(user: any) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  return profile;
} 