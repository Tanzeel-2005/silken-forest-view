import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

/** Tiny helper: pixel grid drawn with rects on a 16x16 viewBox. */
function Px({ cells, size = 16, ...rest }: P & { cells: [number, number, string][]; size?: number }) {
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {cells.map(([x, y, fill], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={fill} />
      ))}
    </svg>
  );
}

const G = "var(--gold)";
const S = "var(--silk)";
const B = "var(--bark)";
const L = "var(--leaf)";
const F = "var(--forest)";
const M = "var(--moss)";

export function PixelCocoon(props: P) {
  const cells: [number, number, string][] = [];
  const rows: [number, number, number][] = [
    [6, 9, 3],
    [5, 10, 4],
    [5, 10, 5],
    [4, 11, 6],
    [4, 11, 7],
    [4, 11, 8],
    [5, 10, 9],
    [5, 10, 10],
    [6, 9, 11],
    [7, 8, 12],
  ];
  for (const [x0, x1, y] of rows) {
    for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1;
      cells.push([x, y, edge ? B : y % 3 === 0 ? S : G]);
    }
  }
  // silk thread
  cells.push([7, 2, M], [7, 3, M], [7, 4, M], [7, 5, M], [7, 6, M], [7, 7, M], [7, 8, M]);
  return <Px cells={cells} {...props} />;
}

export function PixelButterfly(props: P) {
  const cells: [number, number, string][] = [
    [7, 6, B],
    [7, 7, B],
    [7, 8, B],
    [7, 9, B],
    [6, 5, B],
    [8, 5, B],
    [5, 5, G],
    [4, 6, G],
    [3, 6, G],
    [4, 7, L],
    [5, 7, L],
    [6, 7, G],
    [5, 8, L],
    [4, 9, L],
    [5, 9, G],
    [6, 9, G],
    [9, 5, G],
    [10, 6, G],
    [11, 6, G],
    [10, 7, L],
    [9, 7, L],
    [8, 7, G],
    [9, 8, L],
    [10, 9, L],
    [9, 9, G],
    [8, 9, G],
  ];
  return <Px cells={cells} {...props} />;
}

export function PixelCaterpillar(props: P) {
  const cells: [number, number, string][] = [];
  for (let i = 0; i < 5; i++) {
    const x = 2 + i * 2;
    cells.push([x, 8, i % 2 ? M : L], [x + 1, 8, i % 2 ? M : L], [x, 9, F], [x + 1, 9, F]);
  }
  cells.push([12, 7, L], [13, 7, L], [12, 8, L], [13, 8, L], [13, 6, B], [11, 6, B], [12, 9, F], [13, 9, F]);
  return <Px cells={cells} {...props} />;
}

export function PixelLeaf(props: P) {
  const cells: [number, number, string][] = [];
  for (let y = 3; y <= 12; y++) {
    const w = Math.max(0, 5 - Math.abs(y - 7));
    for (let x = 8 - w; x <= 8 + w; x++) {
      cells.push([x, y, x === 8 ? M : y % 2 === 0 ? L : "var(--olive)"]);
    }
  }
  cells.push([8, 13, B], [8, 14, B]);
  return <Px cells={cells} {...props} />;
}

export function PixelUpload(props: P) {
  const cells: [number, number, string][] = [
    [7, 2, L],
    [8, 2, L],
    [6, 3, L],
    [7, 3, L],
    [8, 3, L],
    [9, 3, L],
    [5, 4, L],
    [10, 4, L],
    [7, 4, L],
    [8, 4, L],
    [7, 5, L],
    [8, 5, L],
    [7, 6, L],
    [8, 6, L],
    [7, 7, L],
    [8, 7, L],
  ];
  for (let x = 3; x <= 12; x++) cells.push([x, 11, G]);
  cells.push([3, 10, G], [12, 10, G], [3, 12, B], [12, 12, B]);
  for (let x = 3; x <= 12; x++) cells.push([x, 13, B]);
  return <Px cells={cells} {...props} />;
}

export function PixelSprout(props: P) {
  const cells: [number, number, string][] = [
    [7, 12, B],
    [7, 11, B],
    [7, 10, B],
    [7, 9, B],
    [6, 8, L],
    [5, 8, L],
    [5, 7, L],
    [4, 7, M],
    [8, 8, L],
    [9, 8, L],
    [9, 7, L],
    [10, 7, M],
    [7, 6, L],
    [7, 5, M],
  ];
  for (let x = 4; x <= 11; x++) cells.push([x, 13, B]);
  return <Px cells={cells} {...props} />;
}

export function PixelEye(props: P) {
  const cells: [number, number, string][] = [];
  for (let x = 4; x <= 11; x++) cells.push([x, 6, F], [x, 10, F]);
  cells.push([3, 7, F], [3, 8, F], [3, 9, F], [12, 7, F], [12, 8, F], [12, 9, F]);
  for (let x = 6; x <= 9; x++) for (let y = 7; y <= 9; y++) cells.push([x, y, G]);
  cells.push([7, 8, F], [8, 8, F]);
  return <Px cells={cells} {...props} />;
}

export function PixelCount(props: P) {
  const cells: [number, number, string][] = [];
  [
    [3, 4],
    [8, 4],
    [3, 9],
    [8, 9],
  ].forEach(([ox, oy]) => {
    for (let x = 0; x < 4; x++)
      for (let y = 0; y < 3; y++)
        cells.push([ox + x, oy + y, (x + y) % 2 === 0 ? G : M]);
  });
  return <Px cells={cells} {...props} />;
}

export function PixelBolt(props: P) {
  const cells: [number, number, string][] = [
    [9, 2, G],
    [8, 3, G],
    [7, 4, G],
    [8, 4, G],
    [6, 5, G],
    [7, 5, G],
    [5, 6, G],
    [6, 6, G],
    [7, 6, G],
    [8, 6, G],
    [9, 6, G],
    [6, 7, G],
    [7, 7, G],
    [8, 7, G],
    [7, 8, G],
    [8, 8, G],
    [6, 9, G],
    [7, 9, G],
    [6, 10, G],
    [5, 11, G],
  ];
  return <Px cells={cells} {...props} />;
}

export function PixelSun(props: P) {
  const cells: [number, number, string][] = [];
  for (let x = 6; x <= 9; x++) for (let y = 6; y <= 9; y++) cells.push([x, y, G]);
  cells.push([7, 3, G], [8, 3, G], [7, 12, G], [8, 12, G], [3, 7, G], [3, 8, G], [12, 7, G], [12, 8, G], [4, 4, G], [11, 11, G], [11, 4, G], [4, 11, G]);
  return <Px cells={cells} {...props} />;
}

export function PixelMoon(props: P) {
  const cells: [number, number, string][] = [];
  for (let y = 3; y <= 12; y++) {
    const w = Math.round(Math.sqrt(Math.max(0, 25 - (y - 7.5) ** 2)));
    for (let x = 8 - w; x <= 8 + w; x++) {
      const inCut = (x - 10) ** 2 + (y - 6) ** 2 < 22;
      if (!inCut) cells.push([x, y, S]);
    }
  }
  return <Px cells={cells} {...props} />;
}

export function PixelGithub(props: P) {
  const cells: [number, number, string][] = [];
  for (let y = 4; y <= 11; y++) {
    const w = y <= 5 || y >= 11 ? 3 : 4;
    for (let x = 8 - w; x <= 8 + w; x++) cells.push([x, y, "currentColor"]);
  }
  cells.push([5, 12, "currentColor"], [6, 13, "currentColor"], [10, 12, "currentColor"], [11, 13, "currentColor"]);
  return <Px cells={cells} {...props} />;
}

export function PixelDownload(props: P) {
  const cells: [number, number, string][] = [
    [7, 3, S],
    [8, 3, S],
    [7, 4, S],
    [8, 4, S],
    [7, 5, S],
    [8, 5, S],
    [5, 6, S],
    [10, 6, S],
    [7, 6, S],
    [8, 6, S],
    [6, 7, S],
    [9, 7, S],
    [7, 7, S],
    [8, 7, S],
    [7, 8, S],
    [8, 8, S],
  ];
  for (let x = 3; x <= 12; x++) cells.push([x, 11, S]);
  cells.push([3, 10, S], [12, 10, S]);
  return <Px cells={cells} {...props} />;
}