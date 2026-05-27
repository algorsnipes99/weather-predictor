# Frontend Overview

## What Is the Frontend?

The frontend is the part of the app you actually see and interact with in your browser. It's the page at `http://localhost:3000` — the search box, the results cards, and the 7-day weather breakdowns.

It has no weather logic of its own. Its job is simple: ask you where you want to go, send that to the backend, and display whatever the backend sends back.

---

## What It Does, Step by Step

1. **You type a city name** into the search box. As you type, Google Maps suggests matching places in a dropdown.

2. **You select a place** from the dropdown. At that moment, Google quietly hands the app the exact coordinates (latitude and longitude) for that place — so "Cape Town" becomes `{ latitude: -33.92, longitude: 18.42 }`. No guessing, no ambiguity.

3. **The app sends those coordinates to the backend** and waits. A loading spinner appears while it's thinking.

4. **The backend responds** with a ranked list of activities, each with a score out of 100, a label (EXCELLENT / GOOD / FAIR / POOR), a short summary, and a breakdown for each of the next 7 days.

5. **The app displays the results** as four cards, sorted best to worst. Each card shows the activity name, its overall score, and a summary. You can click "7-day view" on any card to expand it and see the day-by-day detail.

---

## Why Google Places?

Typing a city name into a plain text box is deceptively hard to get right. Is "Springfield" in Illinois, Missouri, or one of the other 30+ US cities with that name? Google Places Autocomplete solves this completely — it shows you a dropdown of real, unambiguous places and hands the app precise coordinates the moment you pick one.

---

## The Pieces That Make It Up

| Piece | What It Does |
|---|---|
| **Search bar** | The input field powered by Google Places. Handles the dropdown, the selection, and extracting coordinates. |
| **Activity card** | Displays one activity: its name, score badge, summary text, and the expand/collapse toggle for the daily view. |
| **Score badge** | The coloured label chip — green for EXCELLENT, blue for GOOD, amber for FAIR, red for POOR. |
| **Daily breakdown** | The table that appears when you expand a card — one row per day with the date, score, and the top reasons the score is what it is. |
| **Results section** | The container that manages what's shown on screen: the loading spinner while waiting, an error message if something goes wrong, or the list of activity cards when results arrive. |

---

## How It Talks to the Backend

The frontend uses a technology called **GraphQL** to request data. Instead of asking for everything and throwing most of it away, GraphQL lets the app ask for exactly the fields it needs — no more, no less.

Under the hood, every search triggers a single request to `http://localhost:4000/graphql` with the location coordinates. The backend processes it and sends back the ranked results. The frontend never touches the weather data directly — that's entirely the backend's concern.

---

## What It Doesn't Do

- It doesn't calculate any weather scores — all scoring logic lives in the backend.
- It doesn't store anything — there's no local history or saved searches.
- It doesn't have user accounts — authentication happens at the API level, transparently.
- It's not fully optimised for mobile screens (functional, but not polished on small devices).
