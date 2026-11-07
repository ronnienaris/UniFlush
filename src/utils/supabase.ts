import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hqsvbgbosqnvyiwybonz.supabase.co";
const supabaseAnonKey = "sb_publishable_J5o3VOPAN01E8aE5xWtOPQ_BbxESGgA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
