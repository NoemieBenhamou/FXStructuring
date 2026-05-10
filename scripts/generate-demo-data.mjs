/* global process */

import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "data", "fx");

const pairs = {
  EURUSD: 1.08,
  GBPUSD: 1.27,
  USDJPY: 151.2,
  USDCHF: 0.9,
  USDCAD: 1.36,
  AUDUSD: 0.67,
  NZDUSD: 0.61,
  EURGBP: 0.85,
  EURJPY: 163.6,
  EURCHF: 0.97,
  GBPJPY: 192.5,
  AUDJPY: 101.4,
  EURCAD: 1.47,
  EURAUD: 1.61,
  USDSEK: 10.8,
  USDNOK: 10.5,
  USDMXN: 17.3,
  USDZAR: 18.4,
  USDTRY: 32.1,
  USDCNH: 7.21
};

function seededNoise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildSeries(base, pairIndex) {
  const today = new Date("2026-05-09T00:00:00.000Z");
  return Array.from({ length: 260 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (259 - index));

    const trend = 1 + Math.sin((index + pairIndex * 5) / 15) * 0.035;
    const seasonal = 1 + Math.cos((index + pairIndex * 3) / 8) * 0.018;
    const noise = 1 + (seededNoise(index + pairIndex * 17) - 0.5) * 0.015;
    const close = Number((base * trend * seasonal * noise).toFixed(base > 10 ? 3 : 5));

    return {
      date: date.toISOString().slice(0, 10),
      close
    };
  });
}

await fs.mkdir(outDir, { recursive: true });

const seriesByPair = Object.fromEntries(
  Object.entries(pairs).map(([pair, base], index) => [pair, buildSeries(base, index)])
);

await fs.writeFile(
  path.join(outDir, "major-fx-daily.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      pairs: seriesByPair
    },
    null,
    2
  )
);

const csvRows = ["date,pair,close"];
for (const [pair, series] of Object.entries(seriesByPair)) {
  for (const point of series) {
    csvRows.push(`${point.date},${pair},${point.close}`);
  }
}

await fs.writeFile(path.join(outDir, "major-fx-daily.csv"), `${csvRows.join("\n")}\n`);
