// Translation dictionary. EN is the default; RU is complete.
// Keys not present in a locale fall back to EN, then to the fallback/key.
// Values may contain placeholders {n}, {date}, {from}, {to}, {done}, {total},
// {i}, {shown} which components replace via String.replace.

export type Locale = "en" | "ru";

export const DEFAULT_LOCALE: Locale = "en";

export type Dict = Record<string, string>;

export const dict: Record<Locale, Dict> = {
  en: {
    "app.name": "Solana Validator Geo",

    // Navigation
    "nav.overview": "Overview",
    "nav.map": "Map",
    "nav.charts": "Charts",
    "nav.data": "Data",

    // Hero
    "hero.eyebrow": "On-chain infrastructure, mapped",
    "hero.title": "Solana Validator Geolocation",
    "hero.lead":
      "Explore where Solana validators live around the world, how stake is distributed across countries and hosting providers, and how the network is decentralized.",
    "hero.meta.validators": "validators tracked",
    "hero.meta.lastUpdate": "Last updated",
    "hero.meta.live": "Live",
    "hero.meta.replaying": "Replaying {date}",

    // Section headers
    "section.stats.eyebrow": "Overview",
    "section.stats.title": "Network at a glance",
    "section.stats.lead":
      "Key metrics across the entire validator set, updated daily.",
    "section.insights.eyebrow": "Insights",
    "section.insights.title": "What the data says",
    "section.insights.lead":
      "Notable patterns in where validators run and how stake concentrates.",
    "section.map.eyebrow": "Geography",
    "section.map.title": "Validator map",
    "section.map.lead":
      "Every validator placed on the map by the geolocation of its IP address.",
    "section.charts.eyebrow": "Distributions",
    "section.charts.title": "How stake is distributed",
    "section.charts.lead":
      "Breakdowns by country, hosting provider, client version and more.",
    "section.table.eyebrow": "Directory",
    "section.table.title": "Validator directory",
    "section.table.lead":
      "Search and browse the full list of tracked validators.",
    "section.replay.eyebrow": "Time machine",
    "section.replay.title": "Replay the history",
    "section.replay.lead":
      "Watch how the validator landscape changed over time, day by day.",

    // Stat cards
    "stat.totalStake": "Total Stake",
    "stat.validators": "Validators",
    "stat.countries": "Countries",
    "stat.cities": "Cities",
    "stat.regions": "Regions",
    "stat.hosting": "Hosting Providers",
    "stat.jitoShare": "Jito Share",
    "stat.jitoStake": "Jito Stake",

    // Download bar
    "download.latest": "Download latest CSV",
    "download.history": "Download all history",
    "download.daysAvailable": "{n} days available to download ({from} → {to})",
    "download.howMuch": "How much history do you need?",
    "download.all": "All ({n} days)",
    "download.lastN": "Last {n} days",
    "download.start": "Download",
    "download.cancel": "Cancel",
    "download.progress": "{done} / {total} · {date}",
    "download.loadingHistory": "Loading available history…",
    "download.building": "Building history archive…",
    "download.ready": "Archive ready — download started",
    "download.failed": "Download failed",
    "download.close": "Close",
    "toggle.jitoOnly": "Jito only",

    // Replay
    "replay.badge": "REPLAY",
    "replay.selectStart": "Start date",
    "replay.pickDate": "Pick a date",
    "replay.speed": "Speed",
    "replay.prepare": "Prepare replay",
    "replay.preparing": "Caching {done}/{total} days…",
    "replay.play": "Play",
    "replay.pause": "Pause",
    "replay.exit": "Exit to live",
    "replay.ready": "Ready — {n} days cached",
    "replay.day": "Day {i} of {n}",
    "replay.hint":
      "Pick a start date and speed, then the whole page animates through history.",

    // Table
    "table.search": "Search validators…",
    "table.col.name": "Name",
    "table.col.city": "City",
    "table.col.country": "Country",
    "table.col.hosting": "Hosting",
    "table.col.version": "Version",
    "table.col.jito": "Jito",
    "table.col.stake": "Stake",
    "table.col.commission": "Commission",
    "table.col.ip": "IP",
    "table.showing": "Showing {shown} of {total}",
    "table.yes": "Yes",
    "table.no": "No",
    "table.empty": "No matching validators.",

    // Loading / error states
    "state.loading": "Loading the latest validator dataset…",
    "state.error": "Failed to load validator data.",
    "state.retry": "Retry",

    // Footer
    "footer.built": "Open-source dataset, updated daily.",
    "footer.source": "Source & data",
  },
  ru: {
    "app.name": "Геолокация валидаторов Solana",

    // Navigation
    "nav.overview": "Обзор",
    "nav.map": "Карта",
    "nav.charts": "Графики",
    "nav.data": "Данные",

    // Hero
    "hero.eyebrow": "Инфраструктура сети на карте",
    "hero.title": "Геолокация валидаторов Solana",
    "hero.lead":
      "Узнайте, где по всему миру расположены валидаторы Solana, как распределён стейк по странам и хостинг-провайдерам и насколько децентрализована сеть.",
    "hero.meta.validators": "валидаторов",
    "hero.meta.lastUpdate": "Обновлено",
    "hero.meta.live": "Онлайн",
    "hero.meta.replaying": "Реплей {date}",

    // Section headers
    "section.stats.eyebrow": "Обзор",
    "section.stats.title": "Сеть вкратце",
    "section.stats.lead":
      "Ключевые метрики по всему набору валидаторов, обновляются ежедневно.",
    "section.insights.eyebrow": "Выводы",
    "section.insights.title": "Что говорят данные",
    "section.insights.lead":
      "Заметные закономерности в размещении валидаторов и концентрации стейка.",
    "section.map.eyebrow": "География",
    "section.map.title": "Карта валидаторов",
    "section.map.lead":
      "Каждый валидатор размещён на карте по геолокации его IP-адреса.",
    "section.charts.eyebrow": "Распределения",
    "section.charts.title": "Как распределён стейк",
    "section.charts.lead":
      "Разбивка по странам, хостинг-провайдерам, версиям клиента и не только.",
    "section.table.eyebrow": "Каталог",
    "section.table.title": "Каталог валидаторов",
    "section.table.lead":
      "Ищите и просматривайте полный список отслеживаемых валидаторов.",
    "section.replay.eyebrow": "Машина времени",
    "section.replay.title": "Реплей истории",
    "section.replay.lead":
      "Посмотрите, как менялся ландшафт валидаторов день за днём.",

    // Stat cards
    "stat.totalStake": "Всего застейкано",
    "stat.validators": "Валидаторы",
    "stat.countries": "Страны",
    "stat.cities": "Города",
    "stat.regions": "Регионы",
    "stat.hosting": "Хостинг-провайдеры",
    "stat.jitoShare": "Доля Jito",
    "stat.jitoStake": "Стейк Jito",

    // Download bar
    "download.latest": "Скачать актуальный CSV",
    "download.history": "Скачать всю историю",
    "download.daysAvailable": "Доступно {n} дней для скачивания ({from} → {to})",
    "download.howMuch": "За сколько истории нужны данные?",
    "download.all": "Всё ({n} дней)",
    "download.lastN": "Последние {n} дней",
    "download.start": "Скачать",
    "download.cancel": "Отмена",
    "download.progress": "{done} / {total} · {date}",
    "download.loadingHistory": "Загружаем список истории…",
    "download.building": "Собираем архив истории…",
    "download.ready": "Архив готов — загрузка началась",
    "download.failed": "Ошибка загрузки",
    "download.close": "Закрыть",
    "toggle.jitoOnly": "Только Jito",

    // Replay
    "replay.badge": "РЕПЛЕЙ",
    "replay.selectStart": "Дата начала",
    "replay.pickDate": "Выберите дату",
    "replay.speed": "Скорость",
    "replay.prepare": "Подготовить реплей",
    "replay.preparing": "Кэшируем {done}/{total} дней…",
    "replay.play": "Плей",
    "replay.pause": "Пауза",
    "replay.exit": "Выйти в онлайн",
    "replay.ready": "Готово — {n} дней в кэше",
    "replay.day": "День {i} из {n}",
    "replay.hint":
      "Выберите дату и скорость — сайт проиграет всю историю.",

    // Table
    "table.search": "Поиск валидаторов…",
    "table.col.name": "Имя",
    "table.col.city": "Город",
    "table.col.country": "Страна",
    "table.col.hosting": "Хостинг",
    "table.col.version": "Версия",
    "table.col.jito": "Jito",
    "table.col.stake": "Стейк",
    "table.col.commission": "Комиссия",
    "table.col.ip": "IP",
    "table.showing": "Показано {shown} из {total}",
    "table.yes": "Да",
    "table.no": "Нет",
    "table.empty": "Ничего не найдено.",

    // Loading / error states
    "state.loading": "Загружаем данные валидаторов…",
    "state.error": "Не удалось загрузить данные.",
    "state.retry": "Повторить",

    // Footer
    "footer.built": "Открытый датасет, обновляется ежедневно.",
    "footer.source": "Исходники и данные",
  },
};
