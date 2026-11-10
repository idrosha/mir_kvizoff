# Question bank — block 1 (levels 1–10)

Machine-readable summary for game-core / content pipeline. Human index: [index.md](index.md).

```json
{
  "schemaVersion": 1,
  "locale": "ru",
  "block": 1,
  "levelCount": 10,
  "questionsPerLevel": 30,
  "totalQuestions": 300,
  "formats": ["single_choice", "multi_choice"],
  "difficultyRange": [1, 5],
  "difficultyCurve": "non_decreasing_within_level",
  "media": {
    "imageUrl": "nullable placeholder",
    "imagePrompt": "russian/english art brief for asset pipeline"
  },
  "levels": [
    {"levelId": 1, "slug": "egypt", "countryRu": "Египет", "countryEn": "Egypt", "file": "level-01-egypt.json", "questionCount": 30, "mapHint": "Пирамиды и Сфинкс на плато Гизы"},
    {"levelId": 2, "slug": "italy", "countryRu": "Италия", "countryEn": "Italy", "file": "level-02-italy.json", "questionCount": 30, "mapHint": "Колизей и римские руины"},
    {"levelId": 3, "slug": "japan", "countryRu": "Япония", "countryEn": "Japan", "file": "level-03-japan.json", "questionCount": 30, "mapHint": "Гора Фудзи и тории"},
    {"levelId": 4, "slug": "france", "countryRu": "Франция", "countryEn": "France", "file": "level-04-france.json", "questionCount": 30, "mapHint": "Эйфелева башня"},
    {"levelId": 5, "slug": "russia", "countryRu": "Россия", "countryEn": "Russia", "file": "level-05-russia.json", "questionCount": 30, "mapHint": "Кремль и храм Василия Блаженного"},
    {"levelId": 6, "slug": "brazil", "countryRu": "Бразилия", "countryEn": "Brazil", "file": "level-06-brazil.json", "questionCount": 30, "mapHint": "Христос-Искупитель над Рио"},
    {"levelId": 7, "slug": "india", "countryRu": "Индия", "countryEn": "India", "file": "level-07-india.json", "questionCount": 30, "mapHint": "Тадж-Махал"},
    {"levelId": 8, "slug": "china", "countryRu": "Китай", "countryEn": "China", "file": "level-08-china.json", "questionCount": 30, "mapHint": "Великая Китайская стена"},
    {"levelId": 9, "slug": "greece", "countryRu": "Греция", "countryEn": "Greece", "file": "level-09-greece.json", "questionCount": 30, "mapHint": "Акрополь и Парфенон"},
    {"levelId": 10, "slug": "mexico", "countryRu": "Мексика", "countryEn": "Mexico", "file": "level-10-mexico.json", "questionCount": 30, "mapHint": "Пирамида майя и День мёртвых"}
  ],
  "questionFields": [
    "id",
    "format",
    "domain",
    "difficulty",
    "prompt",
    "imagePrompt",
    "imageUrl",
    "options",
    "correctOptionIds",
    "explanation"
  ],
  "domains": [
    "история",
    "география",
    "еда",
    "напитки",
    "искусство",
    "литература",
    "кино",
    "медицина",
    "музыка",
    "архитектура",
    "наука",
    "спорт",
    "традиции",
    "природа"
  ],
  "verified": {
    "allFilesPresent": true,
    "eachLevelQuestionCount": 30,
    "bothFormatsPerLevel": true,
    "minDomainsPerLevel": 6
  }
}
```

## Per-file shape

Each `level-NN-slug.json`:

- `schemaVersion`, `levelId`, `levelSlug`, `country.{ru,en}`, `locale`, `mapHint`, `questionCount`, `questions[]`
- `single_choice`: exactly 4 options, 1 id in `correctOptionIds`
- `multi_choice`: 5–10 options, ≥2 correct ids
