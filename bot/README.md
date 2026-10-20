# ECOBenchmark асистент (Telegram + Claude)

Личен чатбот в Telegram, който вижда данните на ECOBenchmark и пише чернови вместо вас.

Примерни въпроси:
- „Има ли изгодни сделки днес?“
- „Колко струва на пазара Takeuchi TB290?“
- „Потърси JCB 3CX в чуждите сайтове.“
- „Какво чака във входящата кутия?“
- „Напиши отговор до клиента, че машината е налична, с цена по договаряне.“
- „Работи ли събирането на обяви?“

`/new` започва нов разговор (ботът сам започва нов и след 6 часа тишина).

## Как е устроен (`bot.mjs`)

| Част | Къде в кода |
|---|---|
| Спусък | `fetch()` най-долу — Telegram праща всяко съобщение към `/telegram` |
| Мозък | `think()` — цикълът: Claude мисли → иска инструмент → получава резултат → мисли пак |
| Ръце | `TOOLS` (описанията за Claude) и `runTool()` (какво реално се изпълнява) |
| Памет | Cloudflare KV `MEMORY` — разговорът по `chat:<id>` |
| Инструкции | `SYSTEM` — характерът и правилата на бота. Тук се променя поведението му |

**Нов инструмент** = нов запис в `TOOLS` + нов `case` в `runTool()`. Нищо друго.

## Пускане (веднъж, ~20 минути)

Трябва ви компютър с [Node.js](https://nodejs.org).

### 1. Telegram бот
В Telegram пишете на **@BotFather** → `/newbot` → име → получавате **токен** (`123456:ABC...`).

### 2. Ключ за Claude
[console.anthropic.com](https://console.anthropic.com) → **API Keys** → Create Key.
В **Limits** сложете месечен таван (напр. $10), за да няма изненади.

### 3. Cloudflare
В папка `bot/`:
```bash
npm install
npx wrangler login
npx wrangler kv namespace create MEMORY
```
Копирайте показаното `id` в `wrangler.toml` на мястото на `ПОСТАВЕТЕ_ID_ТУК`.

### 4. Тайните (не стоят в кода)
```bash
npx wrangler secret put ANTHROPIC_API_KEY   # ключът от стъпка 2
npx wrangler secret put TELEGRAM_TOKEN      # токенът от стъпка 1
npx wrangler secret put WEBHOOK_SECRET      # измислете дълга дума само от букви и цифри
npx wrangler deploy
```
Получавате адрес: `https://ecobench-bot.<вашето-име>.workers.dev`

### 5. Свързване на Telegram с бота
Отворете в браузъра (с вашите стойности):
```
https://api.telegram.org/bot<TELEGRAM_TOKEN>/setWebhook?url=https://ecobench-bot.<вашето-име>.workers.dev/telegram&secret_token=<WEBHOOK_SECRET>
```
Трябва да видите `"ok":true`.

### 6. Кой е собственикът
Пишете нещо на бота в Telegram. Той отговаря „Това е частен бот. Вашият chat id е …“. Запишете това число:
```bash
npx wrangler secret put OWNER_CHAT_ID
```
Готово — пишете на бота.

## Цена
Моделът е Claude Opus 5.5 с ниско усилие (`effort: 'low'`): около няколко цента на въпрос.
За много по-евтино (около 40 пъти) сменете в `think()` модела на `'claude-haiku-5-5'`
и махнете редовете `betas` и `fallbacks`. Ще е по-бърз, но по-слаб на сложни задачи.

## Сигурност
- Ботът отговаря само на `OWNER_CHAT_ID` — никой друг не може да харчи от ключа ви.
- `WEBHOOK_SECRET` гарантира, че заявките идват от Telegram.
- Ботът само чете данни и пише чернови — нищо не изпраща от ваше име.
