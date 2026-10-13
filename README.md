# EcoBench

Euro Construction Benchmark — машини, енергия, инфраструктура — обяви, пазарни цени, инфраструктурни проекти, новини и ноу-хау.

- **docs/** — приложението (инсталира се на Android с иконка, работи и офлайн)
- **scraper/** — събира обявите на всеки 20 минути (GitHub Actions); ключовите думи за събиране са в `scraper/config.json`
- **worker/** — по желание: търсачка на живо (Cloudflare Worker)

## Пускане
1. GitHub → Settings → Pages → Branch `main`, папка `/docs`.
2. Actions → „Събиране на обяви“ → Run workflow (първо пускане).
3. Отвори `https://ngerchev-code.github.io/stroiradar/` в Chrome на телефона → „Инсталирай“.
4. Моментални push известия: приложението „ntfy“ от Google Play → абонамент за темата от Настройки в EcoBench.
