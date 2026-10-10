window.SAINO_SUPABASE_CONFIG = {
    url: "",
    anonKey: ""
};

window.sainoSupabase = null;

if (window.SAINO_SUPABASE_CONFIG.url && window.SAINO_SUPABASE_CONFIG.anonKey) {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        console.error("Supabase client failed to load.");
    } else {
        window.sainoSupabase = window.supabase.createClient(
            window.SAINO_SUPABASE_CONFIG.url,
            window.SAINO_SUPABASE_CONFIG.anonKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
    }
}
