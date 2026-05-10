export function rangeAroundSpot(spot: number, width = 0.2, points = 81) {
  const min = spot * (1 - width);
  const max = spot * (1 + width);
  const step = (max - min) / (points - 1);
  return Array.from({ length: points }, (_, index) => Number((min + index * step).toFixed(6)));
}
