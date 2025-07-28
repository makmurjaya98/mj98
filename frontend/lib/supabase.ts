import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "../config";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Supabase credentials are not configured in frontend/config.ts.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
