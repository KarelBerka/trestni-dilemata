# 🚀 Návod: Nasazení na GitHub Pages a ukládání hlasů do Google Sheets

Tento návod popisuje, jak aplikaci **Trestní Dilemata** publikovat online na **GitHub Pages** a jak propojit bezplatnou cloudovou databázi na **Google Sheets / Apps Script** pro spolehlivé ukládání a počítání hlasů od všech návštěvníků.

---

## Část 1: Nasazení na GitHub Pages (Zcela zdarma)

1. Vytvořte si na [GitHub.com](https://github.com) repozitář (např. `trestni-dilemata`).
2. Nahrajte do něj všechny soubory z této složky (`index.html`, `styles.css`, `app.js`, `crimes-data.js`, `config.js`, `google-apps-script.js`).
3. V repozitáři na GitHubu otevřete **Settings** (Nastavení) -> v levém menu zvolte **Pages**.
4. V sekci **Build and deployment** vyberte:
   - Source: **Deploy from a branch**
   - Branch: `main` (nebo `master`) / složka `/ (root)`
5. Klikněte na **Save**. Během 1–2 minut bude vaše stránka dostupná na adrese `https://<vase-jmeno>.github.io/trestni-dilemata/`.

---

## Část 2: Ukládání a počítání hlasů (Google Apps Script + Google Sheets)

Aplikace funguje **ihned i bez cloudu** (data se ukládají v prohlížeči každého uživatele do `localStorage`). Pokud chcete sbírat hlasy od všech lidí z internetu a mít společný živý žebříček bez zamrzání a limitů, slouží k tomu **Google Apps Script**:

### Proč Google Apps Script místo Supabase?
- **Žádné zamrzání počítání**: Backend v Google Sheets si udržuje předpočítané Elo skóre pro všechny delikty přímo v tabulce. Prohlížeč nemusí stahovat tisíce surových záznamů a přepočítávat je.
- **Bezpečné a spolehlivé**: Žádné problémy s CORS nebo RLS (Row Level Security) politikami.
- **Přehledné**: Veškeré hlasy máte přímo ve své Google tabulce v reálném čase.

### Krok 1: Vytvoření Google Tabulky
1. Otevřete novou tabulku na **[sheets.new](https://sheets.new)** (např. s názvem *Trestní Dilemata - Databáze*).
2. V horním menu klikněte na **Rozšíření (Extensions)** -> **Apps Script**.

### Krok 2: Vložení kódu skriptu
1. Smažte veškerý kód v souboru `Code.gs`.
2. Zkopírujte celý obsah souboru **`google-apps-script.js`** z tohoto repozitáře a vložte jej do `Code.gs`.
3. Klikněte na ikonu **Uložit (Save)** (disketa).

### Krok 3: Nasazení jako Webová aplikace (Web App)
1. Vpravo nahoře klikněte na modré tlačítko **Nasadit (Deploy)** -> **Nové nasazení (New deployment)**.
2. Vlevo klikněte na ikonu ozubeného kola (Vybrat typ) a zvolte **Webová aplikace (Web app)**.
3. Vyplňte nastavení:
   - **Popis**: `Trestní dilemata API v1`
   - **Spustit jako (Execute as)**: `Já (Me)`
   - **Kdo má přístup (Who has access)**: `Kdokoli (Anyone)` *(důležité, aby návštěvníci mohli odesílat hlasy bez nutnosti přihlášení ke Google účtu)*
4. Klikněte na **Nasadit (Deploy)**.
5. Google zobrazí dialog pro udělení oprávnění k zápisu do tabulky:
   - Klikněte na *Autorizovat přístup (Authorize access)* -> vyberte svůj Google účet.
   - Pokud se zobrazí upozornění *Google tuto aplikaci neověřil*, klikněte na *Rozšířené (Advanced)* -> *Přejít na... (Go to... nebezpečné/unsafe)* -> *Povolit (Allow)*.
6. Zkopírujte **URL adresu webové aplikace** (ve tvaru `https://script.google.com/macros/s/AKfycb.../exec`).

### Krok 4: Vyplnění URL v `config.js`
Otevřete v repozitáři soubor `config.js` a vložte získanou URL adresu:

```javascript
window.TRESTY_CONFIG = {
  // Vaše URL z Google Apps Scriptu:
  googleAppScriptUrl: "https://script.google.com/macros/s/AKfycb.../exec",

  matchmaking: {
    eloProximitySigma: 220,     // Čím menší, tím podobnější závažnost činů
    broadExplorationRate: 0.08  // 8% šance na širší náhodné srovnání
  }
};
```

Commitněte změnu do repozitáře. Aplikace se automaticky spojí s Google Sheets a v záhlaví duelu se rozsvítí `🟢 Veřejnost: X duelů`.

---

## Část 3: Jak funguje chytrý matchmaking (párování)?

- Místo čistě náhodného losování používá aplikace **Gaussovský vážený výběr podle blízkosti závažnosti a Elo ratingu** ($e^{-\frac{\Delta Elo^2}{2\sigma^2}}$).
- Činy s podobnou závažností (např. *Zabití v afektu* vs. *Těžké ublížení na zdraví*, nebo *Zpronevěra* vs. *Daňový podvod*) jsou párovány přibližně v **85–90 % případů**.
- Vytváří se tím skutečně vyrovnaná, podnětná a statisticky hodnotná morálně-právní dilemata namísto zjevných duelů typu *Vražda vs. Krádež kola*.
