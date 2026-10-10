/**
 * Konfigurace cloudového úložiště pro Trestní Dilemata ČR
 */

window.TRESTY_CONFIG = {
  // URL vaší Google Apps Script webové aplikace (např. 'https://script.google.com/macros/s/AKfycb.../exec')
  // Získáte po nasazení skriptu ze souboru google-apps-script.js do Google Tabulky.
  // Ponechte prázdné "" pro běh v lokálním režimu (localStorage).
  googleAppScriptUrl: "",

  // Nastavení chytrého párování (matchmakingu)
  matchmaking: {
    // Sigma v bodech Elo (čím menší číslo, tím těsnější závažnost činů)
    // 220 bodů zaručuje, že ~85 % srovnání bude mezi činy podobné závažnosti
    eloProximitySigma: 220,

    // Pravděpodobnost (0.0 až 1.0) pro občasné srovnání napříč spektrem (pro kalibraci a rozmanitost)
    broadExplorationRate: 0.08
  }
};
