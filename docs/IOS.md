# Пътят до App Store

Този документ описва какво остава да се направи ръчно. Кодът и Xcode проектът
са готови — оттук нататък работата е в Apple Developer портала, в Clerk и в
App Store Connect.

---

## 0. Какво трябва да имаш

| | |
| --- | --- |
| **Mac с Xcode 16+** | Няма заобикаляне. iOS приложение се компилира и подписва само на macOS. Всичко останало в това repo работи и на Linux. |
| **Apple Developer Program** | Имаш го. |
| **Clerk акаунт** | Безплатният план стига за старт (до 10 000 активни потребители месечно). |
| **Vercel деплоймънт** | Приложението в App Store вика функциите от `api/` през мрежата. |

---

## 1. Bundle ID и Apple Developer портал

Приложението е конфигурирано с bundle ID **`bg.fathers.sp500`**
(в `capacitor.config.json`). Ако решиш да го смениш, смени го и в
`ios/App/App/Info.plist` → `CFBundleURLSchemes`, защото OAuth връщането
минава през същия низ.

1. [developer.apple.com](https://developer.apple.com/account) → **Identifiers**
   → **+** → App IDs → App.
2. Bundle ID: `bg.fathers.sp500`, Description: `SP500 Calculator`.
3. Capabilities: включи **Sign in with Apple**.

---

## 2. Clerk

### 2.1 Инстанция и ключове

1. Създай приложение в [dashboard.clerk.com](https://dashboard.clerk.com).
2. **API Keys** → копирай `Publishable key` и `Secret key`.
3. **User & Authentication → Email, Phone, Username**:
   - Email address: **required**, verification: **Email verification code**
   - Password: **off**
   - Name / Username: **off**

   Това е важно. Ако Clerk изисква парола или име, регистрацията ще стигне до
   статус `missing_requirements` и панелът ще покаже „Входът не завърши“.

### 2.2 Sign in with Apple

В Apple Developer портала:

1. **Identifiers → Services IDs → +**: напр. `bg.fathers.sp500.web`.
   Включи Sign in with Apple, Configure → Primary App ID: `bg.fathers.sp500`.
2. Return URL: адресът, който Clerk ти дава в екрана за Apple.
3. **Keys → +** → Sign in with Apple → свали `.p8` файла (дава се само веднъж).

В Clerk → **SSO Connections → Apple**: попълни Services ID, Team ID, Key ID и
съдържанието на `.p8` файла.

### 2.3 Google

Clerk има вграден Google за development. За продукция направи OAuth Client ID
в [Google Cloud Console](https://console.cloud.google.com/apis/credentials) и
го въведи в Clerk → **SSO Connections → Google**.

> Apple изисква Sign in with Apple навсякъде, където се предлага друг социален
> вход (guideline 4.8). Затова или оставяш и двата, или махаш Google —
> само Google не е опция.

### 2.4 Разрешени адреси за връщане

Clerk → **Paths / Redirects** (или **Allowed redirect URLs**), добави:

```
bg.fathers.sp500://sso-callback
https://<твоят-домейн>/sso-callback
```

Първият е за приложението, вторият за сайта. Без тях Apple и Google връщат
грешка вместо сесия.

---

## 3. Vercel

**Settings → Environment Variables**:

```
CLERK_SECRET_KEY            = sk_live_...
CLERK_AUTHORIZED_PARTIES    = https://<твоят-домейн>,https://localhost
VITE_CLERK_PUBLISHABLE_KEY  = pk_live_...
VITE_API_BASE_URL           =                     # празно за уеб билда
```

`https://localhost` в `CLERK_AUTHORIZED_PARTIES` е origin-ът на iOS
приложението, не грешка.

---

## 4. Билд за iOS

```bash
# .env.production.local — ползва се само от native билда
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_BASE_URL=https://<твоят-домейн>
```

```bash
npm run ios     # билд + cap sync + отваря Xcode
```

`VITE_API_BASE_URL` е задължителен тук. Без него приложението се сервира от
`https://localhost` и всяка заявка към `/api/...` остава вътре в устройството —
графиката ще показва „Липсва VITE_API_BASE_URL“.

В Xcode:

1. Избери таргета **App** → **Signing & Capabilities**.
2. Team: твоят Apple Developer акаунт. Остави **Automatically manage signing**.
3. **+ Capability** → **Sign in with Apple**.
4. Смени **Version** (`MARKETING_VERSION`) и **Build** (`CURRENT_PROJECT_VERSION`)
   при всяко качване.
5. Пусни на устройство: Product → Run.

Ако си сменил иконата или splash екрана:

```bash
npm run assets && npm run assets:ios
```

---

## 5. Какво трябва да се провери на истинско устройство

Симулаторът не е достатъчен за тези неща:

- [ ] **Sign in with Apple** — пълният кръг: приложение → системен браузър →
      обратно в приложението със сесия. Това е единствената част от кода,
      която зависи от custom URL scheme (`bg.fathers.sp500://sso-callback`).
- [ ] **Google вход** — същият кръг.
- [ ] **Код по имейл** — не ползва пренасочвания, така че е и добрият тест дали
      Clerk изобщо говори с приложението.
- [ ] **Сесията преживява рестарт** — затвори приложението напълно и го отвори.
      Ако те е излогнало, токенът не се пази (`src/auth/tokenCache.js`).
- [ ] **Safe area** — заглавието да не влиза под изреза, бутонът „Запази“ да не
      е под home индикатора.
- [ ] **Клавиатурата** не закрива полетата за суми.

---

## 6. App Store Connect

### 6.1 Записът на приложението

[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → My Apps → **+**.

- Name: `S&P 500 Калкулатор`
- Primary Language: Bulgarian
- Bundle ID: `bg.fathers.sp500`
- Category: **Finance**

### 6.2 Privacy policy — задължително

Приложението събира имейл адрес, значи **трябва** публично достъпна политика
за поверителност на URL. Без нея записът не може да се подаде. Трябва да казва
поне: какви данни се събират (имейл, настройки на калкулатора), кой ги обработва
(Clerk, Vercel), защо, и как се изтриват (бутонът в приложението).

### 6.3 App Privacy („хранителният етикет“)

- **Contact Info → Email Address** → App Functionality → **Linked to the user**
- **User Content → Other** (настройките) → App Functionality → Linked
- Tracking: **не**

### 6.4 Изтриване на акаунт

Вече е вградено (Акаунт → Изтрий акаунта). Ревюърите го проверяват —
guideline 5.1.1(v). Посочи им пътя в **Notes for Review**.

### 6.5 Скрийншотове

Задължителни са за 6.9" (iPhone 16 Pro Max) и 6.5" (iPhone 11 Pro Max).
Най-лесно от Simulator: `Cmd+S`.

---

## 7. Рискове при ревюто

**Guideline 4.2 — Minimum Functionality.** Това е основният риск. Apple
отхвърля приложения, които са само опакован сайт. В наша полза е, че
калкулаторът работи офлайн, има native splash, haptics, интеграция със status
bar-а и акаунт със синхронизация. Ако все пак дойде отхвърляне, най-евтините
добавки, които го решават:

- **Home screen widget** с крайната стойност на прогнозата;
- **Face ID / Touch ID** заключване на приложението;
- **известие** при промяна на цената на SXR8 с повече от X%;
- **Share sheet** за изнасяне на прогнозата като картинка.

**Guideline 5.1.1(v) — Account sign-in.** Затова входът е опционален.
Не го прави задължителен — това е най-честата причина за отхвърляне на
приложения, които нямат нужда от акаунт.

**Финансово съдържание.** Приложението не дава съвет и не приема пари, така че
не попада под 3.1.1 (in-app purchase) или 5.2.1 (финансови институции).
Дисклеймърът в дъното на екрана трябва да остане.

---

## 8. Какво не е направено

Съзнателно извън обхвата, подредено по полза:

| | |
| --- | --- |
| **Keychain за токена** | Сесията се пази в `UserDefaults` през `@capacitor/preferences`. Това е вътре в sandbox-а на приложението, но влиза в незашифровани бекъпи. За токен, който пази четири числа, е приемливо; ако някога добавиш нещо чувствително, смени само `src/auth/tokenCache.js`. |
| **Универсални линкове** | Сега `?y=&m=&i=&r=` линковете се отварят в браузър, не в приложението. Изисква `apple-app-site-association` файл и Associated Domains capability. |
| **Offline кеш за цената** | Графиката показва грешка без мрежа. Калкулаторът работи. |
| **Android** | `npx cap add android` и същият цикъл. Иконите вече се генерират и за адаптивната маска. |
| **Lazy-loading на Clerk** | clerk-js е ~360 kB gzip и се зарежда при старт. В приложението няма значение (всичко е локално), в уеб е най-голямото перо. |
