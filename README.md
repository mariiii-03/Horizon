# HORIZON

An interactive space-exploration and education platform built on NASA's public data services.

Horizon combines a 3D Solar System explorer with live astronomical data feeds, covering daily imagery, near-Earth asteroids, space weather and confirmed exoplanets, and a structured learning module that turns that data into lessons and assessments.

Developed for STEM2Connect AI Hackathon.

---

## Table of Contents

1. [Features](#features)
2. [Data Sources](#data-sources)
3. [Technology Stack](#technology-stack)
4. [Getting Started](#getting-started)
5. [Configuration](#configuration)
6. [Project Structure](#project-structure)
7. [Roadmap](#roadmap)
8. [Team](#team)
9. [Acknowledgements](#acknowledgements)
10. [License](#license)

---

## Features

The platform is organised into six modules.

### 1. Interactive Solar System

The core of the application: a navigable 3D model of the Sun and all eight planets.

- Select any planet to view detailed information
- Zoom, rotate and pan freely through the scene
- Visualise orbital paths and inter-planetary distances
- Compare planetary sizes and physical properties side by side

### 2. NASA Daily Discoveries

Daily astronomy content sourced from NASA's Astronomy Picture of the Day (APOD) service.

- Current Astronomy Picture of the Day with its scientific explanation
- Searchable archive of historical images
- Saved collection of favourite discoveries

### 3. Asteroid Tracker

Near-Earth object monitoring built on the NASA NeoWs API.

- Near-Earth asteroid catalogue
- Closest approach dates
- Estimated diameter
- Relative velocity
- Potentially hazardous classification

### 4. Space Weather

Solar activity monitoring built on the NASA DONKI API.

- Solar flares
- Geomagnetic storms
- Coronal mass ejections
- Chronological timeline of space weather events

### 5. Beyond Our Solar System

Exoplanet exploration built on the NASA Exoplanet Archive.

- Browse confirmed exoplanets
- Explore their host star systems
- Compare planetary sizes
- Learn about habitable zones

### 6. Space Academy

A structured learning module that consolidates the platform's content.

- Interactive lessons
- Planet-specific learning modules
- Knowledge quizzes
- Achievements and progress tracking
- Beginner, intermediate and advanced levels

---

## Data Sources

| Service                                                                                                            | Purpose                          |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| [NASA Open APIs](https://api.nasa.gov)                                                                             | API catalogue and developer key  |
| [Solar System Exploration](https://science.nasa.gov/solar-system/)                                                 | Planetary educational content    |
| [APOD](https://apod.nasa.gov/apod/)                                                                                | Daily astronomical images        |
| [NeoWs](https://api.nasa.gov)                                                                                      | Near-Earth asteroid data         |
| [DONKI](https://api.nasa.gov)                                                                                      | Solar activity and space weather |
| [NASA Image and Video Library](https://images.nasa.gov)                                                            | Images and video assets          |
| [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu)                                                | Exoplanet data                   |
| [NASA GIBS](https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api) | Satellite imagery                |

**APOD endpoint migration.** NASA's API catalogue notes that the legacy APOD endpoint is scheduled for retirement. This project uses the newer endpoint at `https://science.nasa.gov/wp-json/wp/v2/apod-basic`.

---

## Technology Stack

| Layer        | Technology                                                                               |
| ------------ | ---------------------------------------------------------------------------------------- |
| Framework    | [Next.js](https://nextjs.org) (App Router): pages and backend API routes in one project  |
| Language     | TypeScript                                                                               |
| 3D Rendering | [Three.js](https://threejs.org) via [React Three Fiber](https://r3f.docs.pmnd.rs) + drei |
| Styling      | [Tailwind CSS](https://tailwindcss.com)                                                  |
| State        | [Zustand](https://zustand.docs.pmnd.rs)                                                  |
| Charts       | [Recharts](https://recharts.org)                                                         |
| Data Layer   | NASA Open APIs (REST), called only from the server                                       |
| Deployment   | [Vercel](https://vercel.com)                                                             |
| CI           | GitHub Actions: lint, type check, format check, build                                    |

---

## Getting Started

Requires Node.js 22.18 or newer.

### Installation

```bash
git clone https://github.com/mariiii-03/Horizon.git
cd Horizon
npm install
```

### Running Locally

```bash
cp .env.example .env
# Add your NASA API key to .env (see Configuration)
npm run dev
```

The application is served at `http://localhost:3000` by default.

### Production Build

```bash
npm run build
npm start
```

---

## Configuration

Environment variables are read from a `.env` file in the project root.

| Variable       | Description                      | Required |
| -------------- | -------------------------------- | -------- |
| `NASA_API_KEY` | API key issued by NASA Open APIs | Yes      |

Do not commit `.env` to version control. `DEMO_KEY` works for trying things out but is limited to 30 requests an hour; get a free personal key at [api.nasa.gov](https://api.nasa.gov). The key is only read on the server (`server/nasa/client.ts`) and never reaches the browser.

---

## Project Structure

```
.
├── app/
│   ├── <module>/page.tsx      One page per module (thin: renders from features/)
│   └── api/                   Backend routes: apod, asteroids, space-weather,
│                              planets, exoplanets, academy
├── features/<module>/         Frontend components for each module
├── components/ui/             Shared UI components
├── store/                     Zustand stores (favourites, quiz progress)
├── server/                    Server-only code, never imported by a page
│   ├── nasa/                  NASA API client (key + caching) and per-API helpers
│   ├── data/                  Static data: planets, exoplanets, academy content
│   └── scripts/               Data refresh scripts
├── types/                     Shared types: the API contract between backend and frontend
├── mocks/                     Sample API responses for building screens early
├── public/                    Static assets (planet textures)
└── .github/                   CI, CODEOWNERS, pull request template
```

---

## Contributing

1. Pick an issue and create a branch from `main`: `feat/asteroids-api`, `fix/apod-video`, `chore/ci`.
2. Write commits in [Conventional Commits](https://www.conventionalcommits.org) style: `feat(asteroids): add NeoWs feed client`.
3. Open a pull request and fill in the template. CI runs lint, type check, format check and build; Vercel posts a preview link.
4. A code owner reviews (see `.github/CODEOWNERS`). Squash and merge once approved.

Run `npm run format` before pushing so the format check passes.

---

## Roadmap

- Satellite imagery layer using NASA GIBS
- Image and video search using the NASA Image and Video Library
- User accounts with synchronised favourites and progress
- Offline access to Academy lessons

---

## Team

- [Maria Tariq](https://github.com/mariiii-03) (Lead)
- [Wasiq Mansoor](https://github.com/Wasiq2006)
- [Nimra Sultan](https://github.com/nimrasultan2)
- [Aminah Tariq](https://github.com/aminah56)
- [Zainab Tariq](https://github.com/ZainabTariq23)
- [Zainab Zafar](https://github.com/ZainabZafar1234)

---

## Acknowledgements

Data and imagery are provided by NASA through its public APIs. This project is independent and is not affiliated with or endorsed by NASA.

## License

Distributed under the MIT License. See `LICENSE` for details.
