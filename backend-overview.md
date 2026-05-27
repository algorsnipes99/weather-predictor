# Backend Overview

## What Is the Backend?

The backend is the engine of the app. It runs invisibly on the server — you never see it directly — but it does all the real work: fetching weather data, calculating scores, and deciding which activities are a good idea for the week ahead.

When the frontend asks "how good is Cape Town for skiing this week?", the backend figures out the answer.

---

## What It Does, Step by Step

1. **Receives a location** (latitude and longitude) from the frontend.

2. **Fetches weather data** from Open-Meteo, a free weather API. It requests two things:
   - A 7-day general forecast: temperature, rain, wind, snowfall, cloud cover.
   - A 7-day marine forecast (if available): wave height, wave period, swell size.

3. **Cleans up the raw data.** Open-Meteo returns data in its own format — parallel arrays, its own field names. The backend translates this into a clean internal format that the scoring logic can work with. This translation layer means the scoring logic never has to care about where the data came from.

4. **Scores each activity** for every day of the 7-day window. Each activity has its own scorer with its own logic:
   - **Skiing** cares about snowfall, cold temperatures, low wind, and minimal rain.
   - **Surfing** cares about wave height, wave period, and manageable wind. If no marine data is available, it flags that clearly instead of guessing.
   - **Outdoor Sightseeing** cares about mild temperatures, low rain, low wind, and light cloud cover.
   - **Indoor Sightseeing** is essentially the inverse — it scores highest when it's miserable outside.

5. **Combines the 7 daily scores** into a single overall score (0–100) for each activity, attaches a label (EXCELLENT / GOOD / FAIR / POOR), and writes a short plain-English summary.

6. **Sorts the activities** by score (best first) and sends the ranked list back to the frontend.

---

## How Scoring Works

Every scorer uses a weighted formula — different factors matter different amounts depending on the activity.

For example, for **skiing**, snowfall is the most important factor (40% of the score), followed by temperature (30%), rain (20%), and wind (10%). A day with 15cm of fresh snow, temperatures below freezing, and calm winds will score close to 100. A warm, rainy day with no snow will score close to 0.

All scores are clamped to a 0–100 range, then labelled:

| Score | Label |
|---|---|
| 85–100 | EXCELLENT |
| 65–84 | GOOD |
| 40–64 | FAIR |
| 0–39 | POOR |

---

## Important Limitations

The backend is honest about what it doesn't know:

- **Ski resort proximity** — the app doesn't know if there's actually a ski resort near the location. It scores based on weather conditions only. Zermatt in a warm week will score poorly for skiing; a random mountain town in a snowy week might score well.
- **Coastline proximity** — similarly, the app doesn't check if you're near the sea. If Open-Meteo returns marine data for a location, surfing will be scored. If it doesn't, the surfing score will be low with a clear explanation.

---

## The Pieces That Make It Up

| Piece | What It Does |
|---|---|
| **GraphQL API** | The "front door" of the backend. Accepts requests from the frontend in a structured format and returns structured results. |
| **Weather service** | Calls Open-Meteo and hands back clean, normalised weather data. Handles the case where marine data isn't available without crashing. |
| **Mapper layer** | Translates Open-Meteo's raw response format into the internal format the scorers understand. |
| **Activity scorers** | One per activity. Each takes the normalised weather data and produces a score, label, reasons, and summary for each day. |
| **Ranking service** | Collects all four scorer results and sorts them by overall score. |
| **Cache (Postgres)** | Stores results for 6 hours. If the same location is searched again within that window, the backend returns the cached result instantly rather than calling Open-Meteo again. |
| **Auth middleware** | Every request must carry a valid login token. Requests without one are rejected before they reach the weather or scoring logic. |

---

## How It's Built

The backend is a Node.js application written in TypeScript. It uses Apollo Server to handle GraphQL requests, Express as the underlying web server, and Postgres for caching results. All the business logic — the scoring formulas, the mapper layer, the ranking — is covered by a suite of automated tests (94 tests) that run without touching any live APIs.
