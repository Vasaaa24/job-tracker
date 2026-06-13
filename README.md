# Job Tracker 🎯

Osobní aplikace na sledování pracovních pozic z LinkedInu. Pozice rozdělené do
dvou skupin (**Top** / **Basic**), u každé můžeš měnit stav, přidávat komentáře
a poznámky. Data jsou v cloudové databázi → **funguje na PC i na mobilu se
stejnými daty**.

Postaveno na **Next.js** + **Postgres (Neon)**, nasazení na **Vercel**.

## Funkce
- ➕ Přidávání pozic (název, firma, odkaz na LinkedIn, poznámka)
- 🗂️ Dvě skupiny: **Top firmy** a **Basic firmy** (pozice lze mezi nimi přesouvat)
- 🔄 Stavy: Poslat CV → CV odesláno → Čekám na odpověď → Odpověděli →
  Pohovor domluven → Čekám na odpověď po pohovoru → Nabídka / Zamítnuto
- 💬 Komentáře a poznámky u každé pozice
- 🔍 Vyhledávání + filtr podle stavu
- 📊 Přehledové statistiky
- 🔒 Ochrana heslem
- 📱 Responzivní — funguje na mobilu

---

## Nasazení na Vercel (krok za krokem)

### 1. Nahraj projekt na GitHub
1. Vytvoř si účet na [github.com](https://github.com) (pokud nemáš).
2. Vytvoř nový **prázdný repozitář** (např. `job-tracker`).
3. Tuto složku (`job-tracker-next`) nahraj do repozitáře. Buď přes GitHub
   Desktop, nebo v příkazové řádce ve složce projektu:
   ```bash
   git init
   git add .
   git commit -m "Job tracker"
   git branch -M main
   git remote add origin https://github.com/TVUJ-UCET/job-tracker.git
   git push -u origin main
   ```

### 2. Vytvoř projekt na Vercelu
1. Účet na [vercel.com](https://vercel.com) — přihlas se přes GitHub.
2. **Add New… → Project** → vyber repozitář `job-tracker` → **Import**.
3. Klikni **Deploy**. (První deploy zatím spadne kvůli chybějící databázi —
   to je v pořádku, vyřešíme v dalším kroku.)

### 3. Připoj databázi (Neon Postgres — zdarma)
1. V projektu na Vercelu jdi na záložku **Storage**.
2. **Create Database → Neon (Serverless Postgres)** → **Continue** → vyber
   region (klidně Frankfurt) → **Create**.
3. Vercel databázi automaticky propojí a vytvoří proměnnou `DATABASE_URL`.
   (Tabulka se vytvoří sama při prvním otevření aplikace.)

### 4. Nastav heslo
1. Záložka **Settings → Environment Variables**.
2. Přidej proměnnou:
   - **Key:** `APP_PASSWORD`
   - **Value:** tvoje zvolené heslo
3. Ulož.

### 5. Znovu nasaď
Záložka **Deployments → … u posledního → Redeploy**. Hotovo! ✅

Aplikaci otevřeš na adrese `https://job-tracker-xxxx.vercel.app`. Na mobilu si
ji ulož na plochu („Přidat na plochu") a chová se jako appka.

---

## Lokální spuštění (na svém PC)
Potřebuješ nainstalovaný [Node.js](https://nodejs.org) (verze 18+).

```bash
npm install
```

Vytvoř soubor `.env.local` (zkopíruj z `.env.example`) a vlož `DATABASE_URL`
z Neonu (najdeš ve Vercelu → Storage → tvoje DB → connection string).

```bash
npm run dev
```
Otevři <http://localhost:3000>.

---

## Změna stavů / skupin
Stavy jsou definované v [lib/statuses.ts](lib/statuses.ts) — můžeš si je
upravit (přidat / přejmenovat / změnit barvy). Názvy skupin „Top" a „Basic"
jsou v [app/page.tsx](app/page.tsx).
