import { createClient } from "@supabase/supabase-js";

// Hardcoded for Vercel web deployment to guarantee connection without missing environment variables
const supabaseUrl = "https://hqsvgbosqnvyiwyonz.supabase.co";
const supabaseAnonKey = "sb_publishable_J5o3VOPAN01E8aE5xWTOPQ_BbxESGgA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
