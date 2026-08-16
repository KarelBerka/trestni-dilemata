/**
 * Konfigurace cloudového úložiště pro Trestní Dilemata ČR
 */

window.TRESTY_CONFIG = {
  // URL vašeho Supabase projektu (např. 'https://<project-ref>.supabase.co')
  supabaseUrl: "https://byvjqnbpltjwcluigkfj.supabase.co", 

  // Váš Publishable API klíč ze Supabase
  supabaseAnonKey: "sb_publishable_IMAMxmi6B1ui_CposyQnGA_G_wZPVcd",

  // Nastavení chytrého párování (matchmakingu)
  matchmaking: {
    // Sigma v bodech Elo (čím menší číslo, tím těsnější závažnost činů)
    // 220 bodů zaručuje, že ~85 % srovnání bude mezi činy podobné závažnosti
    eloProximitySigma: 220,

    // Pravděpodobnost (0.0 až 1.0) pro občasné srovnání napříč spektrem (pro kalibraci a rozmanitost)
    broadExplorationRate: 0.08
  }
};
