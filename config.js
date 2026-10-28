/**
 * Konfigurace cloudového úložiště pro Trestní Dilemata ČR
 */

window.TRESTY_CONFIG = {
  // URL vaší Google Apps Script webové aplikace
  googleAppScriptUrl: "https://script.google.com/macros/s/AKfycbwXj8IB1X7A5pzpj1XIjw27jfuXCgEbxvTaJ3oiH2WuwQBhdeFsIftIwInDKHLz7wvv/exec",

  // Nastavení chytrého párování (matchmakingu)
  matchmaking: {
    // Sigma v bodech Elo (čím menší číslo, tím těsnější závažnost činů)
    // 220 bodů zaručuje, že ~85 % srovnání bude mezi činy podobné závažnosti
    eloProximitySigma: 220,

    // Pravděpodobnost (0.0 až 1.0) pro občasné srovnání napříč spektrem (pro kalibraci a rozmanitost)
    broadExplorationRate: 0.08
  }
};
