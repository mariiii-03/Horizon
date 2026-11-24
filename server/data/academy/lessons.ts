import "server-only";
import type { Lesson } from "@/types/academy";

// Owner: Wasiq. One beginner lesson per planet.
// Keep numbers in step with server/data/planets.ts so the site never contradicts itself.

export const lessons: Lesson[] = [
  {
    id: "mercury-intro",
    title: "Mercury: the swift planet",
    level: "beginner",
    planetId: "mercury",
    body: "Mercury is the smallest planet and the closest to the Sun. It races around the Sun in just 88 days, faster than any other planet.\n\nWith almost no atmosphere to hold in heat, Mercury swings from about 430 °C in the day to about −180 °C at night. It has no moons and no rings.",
  },
  {
    id: "venus-intro",
    title: "Venus: the hottest planet",
    level: "beginner",
    planetId: "venus",
    body: "Venus is about the same size as Earth, but it is a very different world. Its thick carbon dioxide atmosphere traps heat, so the surface stays near 464 °C, hot enough to melt lead. That makes Venus hotter than Mercury, even though Mercury is closer to the Sun.\n\nVenus spins backwards compared with most planets, and very slowly: one spin takes 243 Earth days, longer than its 225-day year.",
  },
  {
    id: "earth-intro",
    title: "Earth: our home planet",
    level: "beginner",
    planetId: "earth",
    body: "Earth is the third planet from the Sun and the only place we know of with life. About 71% of its surface is covered by liquid water.\n\nEarth's axis is tilted by 23.4°. As Earth orbits the Sun over 365 days, that tilt means each half of the planet leans towards the Sun for part of the year and away for the rest, which gives us seasons. Earth has one moon.",
  },
  {
    id: "mars-intro",
    title: "Mars: the red planet",
    level: "beginner",
    planetId: "mars",
    body: "Mars is the fourth planet from the Sun. Its red colour comes from iron oxide, the same thing as rust, in its dust and rocks.\n\nA day on Mars lasts about 24.6 hours, very close to an Earth day, but a year lasts 687 Earth days. Gravity on Mars is only about 38% of Earth's. Mars has the tallest volcano in the Solar System, Olympus Mons, and two small moons, Phobos and Deimos.",
  },
  {
    id: "jupiter-intro",
    title: "Jupiter: the giant",
    level: "beginner",
    planetId: "jupiter",
    body: "Jupiter is the largest planet. It is more than twice as massive as all the other planets put together, about 318 times the mass of Earth.\n\nJupiter is a gas giant with no solid surface. Its Great Red Spot is a storm bigger than Earth that has raged for centuries. It spins faster than any other planet: a day lasts under 10 hours. Its moon Ganymede is the largest moon in the Solar System, bigger than the planet Mercury.",
  },
  {
    id: "saturn-intro",
    title: "Saturn: the ringed planet",
    level: "beginner",
    planetId: "saturn",
    body: "Saturn is the second-largest planet and the best known for its rings, which are made of billions of pieces of ice and rock.\n\nSaturn is mostly hydrogen and helium, and it is less dense than water. It takes about 29 Earth years to orbit the Sun. Saturn has more known moons than any other planet. The largest, Titan, has a thick atmosphere and lakes of liquid methane.",
  },
  {
    id: "uranus-intro",
    title: "Uranus: the sideways planet",
    level: "beginner",
    planetId: "uranus",
    body: "Uranus is an ice giant tilted by about 98°, so it rolls around the Sun on its side. Scientists think a huge collision long ago knocked it over.\n\nBecause of that tilt, each pole gets about 42 years of sunlight followed by about 42 years of darkness during Uranus's 84-year orbit. Methane in its atmosphere gives it a blue-green colour.",
  },
  {
    id: "neptune-intro",
    title: "Neptune: the windy planet",
    level: "beginner",
    planetId: "neptune",
    body: "Neptune is the farthest planet from the Sun, about 30 times farther than Earth. One orbit takes about 164 Earth years.\n\nNeptune was the first planet found using maths: astronomers predicted where it should be from the way it tugged on Uranus, and spotted it in 1846. Its winds are the fastest in the Solar System, reaching more than 2,000 km/h.",
  },
];

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}
