import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Fallback to direct string literals if Vercel environment variables aren't injected at build time
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
  "https://hqsvgbosqnvyiwyonz.supabase.co";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_J5o3VOPAN01E8aE5xWTOPQ_BbxESGgA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
