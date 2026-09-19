# Качване в App Store — какво е готово и какво остава

Това приложение работи като native iOS обвивка (Capacitor) около съществуващото
уеб приложение. Целият код в тази папка е подготвен и проверен доколкото е
възможно **без Mac и Xcode** — генериране на iOS проекта, икони, launch screen,
настройки в `Info.plist`, версия на пакета. Финалните стъпки изискват реален
Mac, защото компилирането, подписването и архивирането на `.ipa` минават само
през Xcode.

## Преди да отвориш Xcode

1. **Bundle ID.** В `capacitor.config.json` и в Xcode проекта е зададен
   `bg.fathers.sp500calculator`. Това е **предположение** — трябва да съвпада
   с App ID, който регистрираш в [developer.apple.com](https://developer.apple.com/account)
   (Certificates, Identifiers & Profiles → Identifiers). Смени го **преди**
   първия архив — след първо подаване в App Store bundle ID-то не се сменя без
   да стане ново приложение.
2. **Support / privacy имейл.** `public/support.html` и `public/privacy.html`
   имат `REPLACE_WITH_SUPPORT_EMAIL` на мястото на реален имейл — App Store
   Connect изисква работещ Support URL. Смени преди подаване.
3. **Apple Developer Program** — платен акаунт ($99/год), необходим за
   качване в App Store (безплатен Apple ID стига само за тест на симулатор/
   собствено устройство през Xcode).

## На Mac

```bash
npm install
npm run cap:sync          # билд с абсолютен API адрес + npx cap sync ios
open ios/App/App.xcodeproj
```

Xcode ще изтегли Capacitor през Swift Package Manager при първо отваряне
(изисква интернет за този единствен път) — **няма нужда от CocoaPods/`pod
install`**, проектът е чист SPM.

В Xcode: избери своя Team под Signing & Capabilities, изчакай SPM резолвиране,
пусни на симулатор за да провериш реално рендиране (най-важно: theme toggle,
offline банер, живата графика), после `Product → Archive` →
`Distribute App → App Store Connect`.

## Устройства

Проектът е зададен **само за iPhone** (`TARGETED_DEVICE_FAMILY = "1"`) за по-
просто първо подаване — по-малко размери скрийншоти за App Store Connect.
Оформлението (responsive CSS, тествано до 1440px) би се държало прилично и на
iPad; добавяне на iPad означава да смениш тази настройка на `"1,2"` в Xcode
(Target → General → Supported Destinations) и да добавиш iPad скрийншоти.

## Проект на листинга за App Store Connect

| Поле | Предложение |
| --- | --- |
| Име | S&P 500 Калкулатор |
| Подзаглавие | Лихва върху лихва, на живо |
| Категория | Finance (Finance) |
| Възрастов рейтинг | 4+ |
| Privacy Policy URL | `https://sp500-app.vercel.app/privacy.html` |
| Support URL | `https://sp500-app.vercel.app/support.html` |
| App Privacy (nutrition label) | **Contact Info → Email Address**, „Linked to the user“ — виж бележката по-долу |

**За App Privacy въпросника:** това вече **не е** „Data Not Collected“.
Приложението предлага вход по избор и когато някой го използва, събира:

| Данни | Категория в App Store Connect | Цел | Свързани с потребителя |
| --- | --- | --- | --- |
| Имейл адрес | Contact Info → Email Address | App Functionality | Да |
| Име, профилна снимка (ако доставчикът ги даде) | Contact Info → Name | App Functionality | Да |
| Настройките на калкулатора | User Content → Other User Content | App Functionality | Да |

Tracking: **не** — нищо не се свързва с данни от други приложения или сайтове.

Ако потребителят не влезе, нищо от горното не се събира. Apple обаче иска
въпросникът да описва какво приложението **може** да събере, а не какво събира
в най-добрия случай — така че попълни таблицата, дори входът да е опционален.

Заявката за цената остава каквато беше: към собствената ни функция
(`api/sxr8.js`), носи само избрания диапазон (`?range=5y`), без идентификатор.
Ако искаш максимална точност: всеки сървър вижда IP адреса на повикващия като
част от обикновена HTTP обработка (през Vercel-ната инфраструктура), тъй че при
съмнение провери актуалните насоки на Apple за IP адрес в контекста на
инфраструктурни/anti-abuse логове, вместо да се доверяваш на това резюме — не
съм сигурен на 100% къде точно Apple тегли границата тук.

Известието при цена (виж README, „Native усещане“) не променя това: прагът и
разрешението за известия се пазят само на устройството, през
`UNUserNotificationCenter` — нищо ново не тръгва към сървър.

Описание (BG чернова, за App Store Connect — можеш да съкратиш/промениш):

> Калкулатор за лихва върху лихва при периодични инвестиции в индексен фонд
> върху S&P 500, с живата цена на SXR8 (iShares Core S&P 500 UCITS ETF).
> Нагласяш години, месечна вноска, начална сума и очаквана доходност — и
> веднага виждаш крайната стойност, общо вложеното и печалбата, плюс графика
> на натрупването във времето. Работи изцяло offline; живата цена се обновява
> при връзка и се пази локално междувременно. Без реклами и без проследяване.
> Регистрацията е по избор — служи само за да намерите настройките си на
> друго свое устройство.

## Guideline 4.2 (Minimum Functionality) — реалният риск

Apple подлага под особено внимание приложения, които са само уебсайт в native
обвивка, без нищо, което да оправдае съществуването си извън браузъра.
Отхвърляне по тази точка е реален и документиран риск за точно този тип
приложение, не формалност.

**Какво вече смекчава риска, вградено в тази промяна:**
- Приложението работи **изцяло offline** за самия калкулатор; живата цена пази
  последна известна стойност локално и показва ясен банер вместо да блокира.
- Икона, launch screen и подредба, направени специално за native контекст (не
  просто препакетиран сайт визуално).
- Тема, следваща системната настройка на устройството.
- Акаунт със синхронизация на настройките между устройства — нещо, което
  отварянето на сайта в Safari не дава.

**Какво би засилило позицията допълнително** — виж предложенията в
разговора извън тази папка: локални нотификации за цена, native Share Sheet,
haptics, Home Screen Widget с живата цена. Нито едно от тях не е добавено тук
— изискват решение кои да влязат, а Home Screen Widget конкретно изисква
Swift код в Xcode, който не може да се направи в тази среда.

## Вход (Clerk) — какво трябва да се настрои

Входът е **опционален**: калкулаторът работи изцяло без акаунт, а без
`VITE_CLERK_PUBLISHABLE_KEY` билдът дори не показва бутон. Това е нарочно —
guideline 5.1.1(v) отхвърля приложения, които искат акаунт без да имат нужда
от него.

### 1. Clerk инстанция

1. Създай приложение в [dashboard.clerk.com](https://dashboard.clerk.com) и
   вземи `Publishable key` и `Secret key`.
2. **User & Authentication → Email, Phone, Username**:
   - Email address: **required**, verification: **Email verification code**
   - Password: **off**; Name / Username: **off**

   Важно е. Ако Clerk изисква парола или име, регистрацията стига до статус
   `missing_requirements` и панелът показва „Входът не завърши“.

### 2. Sign in with Apple

Apple изисква Sign in with Apple навсякъде, където се предлага друг социален
вход (guideline 4.8). Или остави и двата доставчика, или махни Google — само
Google не е опция.

В Apple Developer портала:

1. **Identifiers → App IDs** → за `bg.fathers.sp500calculator` включи
   **Sign in with Apple**.
2. **Identifiers → Services IDs → +**, напр. `bg.fathers.sp500calculator.web`;
   Configure → Primary App ID: `bg.fathers.sp500calculator`; Return URL: адресът,
   който Clerk показва в екрана за Apple.
3. **Keys → +** → Sign in with Apple → свали `.p8` файла (дава се само веднъж).

В Clerk → **SSO Connections → Apple**: Services ID, Team ID, Key ID и
съдържанието на `.p8`.

В Xcode: таргет **App** → Signing & Capabilities → **+ Capability** →
**Sign in with Apple**.

### 3. Адреси за връщане

Clerk → **Allowed redirect URLs**:

```
bg.fathers.sp500calculator://sso-callback
https://sp500-app.vercel.app/sso-callback
```

Първият е за приложението, вторият за сайта. Схемата е регистрирана като
`CFBundleURLScheme` в `Info.plist` и трябва да остане равна на `appId` в
`capacitor.config.json` — `src/auth/config.js` чете точно него.

### 4. Променливи в Vercel

```
CLERK_SECRET_KEY            = sk_live_...
CLERK_AUTHORIZED_PARTIES    = https://sp500-app.vercel.app,https://localhost
VITE_CLERK_PUBLISHABLE_KEY  = pk_live_...
```

`https://localhost` е origin-ът на iOS приложението, не грешка:
`capacitor.config.json` задава `server.iosScheme: "https"`, за да е WebView-ът
защитен контекст.

### 5. Какво трябва да се провери на истинско устройство

Симулаторът не е достатъчен за първите две:

- [ ] **Sign in with Apple** — пълният кръг: приложение → системен браузър →
      обратно в приложението със сесия. Това е единствената част, която зависи
      от custom URL scheme.
- [ ] **Google вход** — същият кръг.
- [ ] **Код по имейл** — не ползва пренасочвания и е добрият тест дали Clerk
      изобщо говори с приложението.
- [ ] **Сесията преживява рестарт** — затвори приложението напълно и го отвори.
      Ако те е излогнало, токенът не се пази (`src/auth/tokenCache.js`).
- [ ] **Изтриване на акаунт** — Акаунт → Изтрий акаунта. Ревюърите го проверяват
      (guideline 5.1.1(v)); посочи им пътя в **Notes for Review**.

### Какво съзнателно не е направено

- **Keychain за токена.** Сесията се пази в `UserDefaults` през
  `@capacitor/preferences` — вътре в sandbox-а на приложението, но влиза в
  незашифровани бекъпи. За токен, който пази шест числа, е приемливо; ако
  някога добавиш нещо чувствително, смени само `src/auth/tokenCache.js`.
- **Lazy-loading на clerk-js.** ~360 kB gzip при старт. В приложението няма
  значение (всичко е локално), в уеб е най-голямото перо.

## Какво НЕ е и не може да бъде готово оттук

- Компилиране, подписване, архивиране — изисква Xcode на Mac.
- TestFlight качване — изисква архивирания `.ipa` от Xcode.
- Screenshots за App Store Connect — изисква реален симулатор/устройство.
- Privacy manifest предупреждения (`PrivacyInfo.xcprivacy`), ако Xcode 15+
  ги поиска при архивиране — Xcode показва точно какво липсва по време на
  архивиране; следвай насоките му, вместо да познавам предварително.
