/**
 * Google Apps Script Backend pro aplikaci Trestní Dilemata ČR
 * 
 * NÁVOD K NASAZENÍ (cca 2 minuty):
 * 1. Otevřete novou Google Tabulku na https://sheets.new (např. s názvem "Trestní Dilemata - Databáze").
 * 2. V horním menu zvolte Rozšíření (Extensions) -> Apps Script.
 * 3. Smažte veškerý kód v souboru Code.gs a vložte celý tento skript.
 * 4. Klikněte na ikonu diskety (Uložit).
 * 5. Vpravo nahoře klikněte na modré tlačítko "Nasadit" (Deploy) -> "Nové nasazení" (New deployment).
 * 6. Jako typ vyberte: "Webová aplikace" (ikona ozubeného kola -> Web app).
 * 7. Nastavení:
 *    - Popis: "Trestní dilemata API v1"
 *    - Spustit jako: "Já" (Me)
 *    - Kdo má přístup: "Kdokoli" (Anyone)
 * 8. Klikněte na "Nasadit" (Deploy), schvalte potřebná oprávnění ke Google tabulce.
 * 9. Zkopírujte výslednou URL adresu webové aplikace (ve tvaru https://script.google.com/macros/s/.../exec).
 * 10. Vložte tuto URL adresu do souboru config.js jako `googleAppScriptUrl`.
 */

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // List 1: Detailní auditní log jednotlivých duelů
  let votesSheet = ss.getSheetByName("votes");
  if (!votesSheet) {
    votesSheet = ss.insertSheet("votes");
    votesSheet.appendRow(["Čas (UTC)", "Vítěz ID (závažnější)", "Poražený ID (mírnější)", "Session ID"]);
    votesSheet.setFrozenRows(1);
  }

  // List 2: Průběžně agregované skóre (Elo, výhry, celkový počet duelů)
  let scoresSheet = ss.getSheetByName("scores");
  if (!scoresSheet) {
    scoresSheet = ss.insertSheet("scores");
    scoresSheet.appendRow(["Delikt ID", "Elo skóre", "Počet výher", "Celkem duelů"]);
    scoresSheet.setFrozenRows(1);
  }
}

// GET: Vrátí celkový počet duelů a agregované Elo skóre pro všechny delikty
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let votesSheet = ss.getSheetByName("votes");
    let scoresSheet = ss.getSheetByName("scores");

    if (!votesSheet || !scoresSheet) {
      setupSheet();
      votesSheet = ss.getSheetByName("votes");
      scoresSheet = ss.getSheetByName("scores");
    }

    const totalVotes = Math.max(0, votesSheet.getLastRow() - 1);

    const scores = {};
    const scoresData = scoresSheet.getDataRange().getValues();
    for (let i = 1; i < scoresData.length; i++) {
      const row = scoresData[i];
      const id = row[0];
      if (id) {
        scores[id] = {
          elo: Number(row[1]) || 1500,
          wins: Number(row[2]) || 0,
          matches: Number(row[3]) || 0
        };
      }
    }

    const response = {
      status: "success",
      totalVotes: totalVotes,
      scores: scores
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// POST: Zaznamená výsledek duelu a inkrementálně přepočítá Elo rating obou deliktů
function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    if (!data) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const winnerId = data.winner_id;
    const loserId = data.loser_id;
    const sessionId = data.session_id || "anonymous";
    const winnerBaseElo = Number(data.winner_base_elo) || 1500;
    const loserBaseElo = Number(data.loser_base_elo) || 1500;

    if (!winnerId || !loserId) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Missing winner_id or loser_id" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let votesSheet = ss.getSheetByName("votes");
    let scoresSheet = ss.getSheetByName("scores");

    if (!votesSheet || !scoresSheet) {
      setupSheet();
      votesSheet = ss.getSheetByName("votes");
      scoresSheet = ss.getSheetByName("scores");
    }

    // 1. Záznam do detailního logu hlasů
    votesSheet.appendRow([new Date(), winnerId, loserId, sessionId]);

    // 2. Načtení stávajících skóre
    const scoresData = scoresSheet.getDataRange().getValues();
    let winnerRowIdx = -1;
    let loserRowIdx = -1;
    let winnerElo = winnerBaseElo, winnerWins = 0, winnerMatches = 0;
    let loserElo = loserBaseElo, loserWins = 0, loserMatches = 0;

    for (let i = 1; i < scoresData.length; i++) {
      if (scoresData[i][0] === winnerId) {
        winnerRowIdx = i + 1;
        winnerElo = Number(scoresData[i][1]) || winnerBaseElo;
        winnerWins = Number(scoresData[i][2]) || 0;
        winnerMatches = Number(scoresData[i][3]) || 0;
      }
      if (scoresData[i][0] === loserId) {
        loserRowIdx = i + 1;
        loserElo = Number(scoresData[i][1]) || loserBaseElo;
        loserWins = Number(scoresData[i][2]) || 0;
        loserMatches = Number(scoresData[i][3]) || 0;
      }
    }

    // 3. Přepočet Elo ratingu (k-faktor = 24)
    const kFactor = 24;
    const expWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const newWinnerElo = Math.round(winnerElo + kFactor * (1 - expWinner));
    const newLoserElo = Math.round(loserElo + kFactor * (0 - (1 - expWinner)));

    // 4. Zápis aktualizovaného skóre pro vítěze
    if (winnerRowIdx > 0) {
      scoresSheet.getRange(winnerRowIdx, 2, 1, 3).setValues([[newWinnerElo, winnerWins + 1, winnerMatches + 1]]);
    } else {
      scoresSheet.appendRow([winnerId, newWinnerElo, 1, 1]);
    }

    // 5. Zápis aktualizovaného skóre pro poraženého
    if (loserRowIdx > 0) {
      scoresSheet.getRange(loserRowIdx, 2, 1, 3).setValues([[newLoserElo, loserWins, loserMatches + 1]]);
    } else {
      scoresSheet.appendRow([loserId, newLoserElo, 0, 1]);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
