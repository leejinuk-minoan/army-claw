import test from "node:test";
import assert from "node:assert/strict";
import { buildMergedTableGrid } from "./army-claw-hancom-tools.mjs";

test("builds a logical grid with anchor cells only", () => {
  const grid = buildMergedTableGrid({
    rows: 3,
    cols: 4,
    column_widths: [1000, 2000, 3000, 4000],
    row_heights: [100, 200, 300],
    cells: [
      { row: 0, col: 0, row_span: 2, col_span: 2, text: "병합 머리글", role: "header" },
      { row: 0, col: 2, col_span: 2, text: "상단 머리글", role: "header" },
      { row: 2, col: 0, text: "A" },
      { row: 2, col: 1, text: "B" },
      { row: 2, col: 2, text: "C" },
      { row: 2, col: 3, text: "D" },
    ],
  });

  assert.equal(grid.row_count, 3);
  assert.equal(grid.col_count, 4);
  assert.equal(grid.table_width, 10000);
  assert.deepEqual(grid.occupied_coordinates.sort(), [
    "0:0", "0:1", "0:2", "0:3",
    "1:0", "1:1",
    "2:0", "2:1", "2:2", "2:3",
  ].sort());
  assert.equal(grid.rendered_cells.length, 6);

  const merged = grid.rendered_cells.find((cell) => cell.text === "병합 머리글");
  assert.equal(merged.width, 3000);
  assert.equal(merged.height, 300);
  assert.equal(merged.row_span, 2);
  assert.equal(merged.col_span, 2);
});

test("rejects duplicate anchors and span collisions", () => {
  assert.throws(
    () => buildMergedTableGrid({
      rows: 2,
      cols: 2,
      cells: [
        { row: 0, col: 0, col_span: 2, text: "A" },
        { row: 0, col: 1, text: "B" },
      ],
    }),
    /merged cell collision/u,
  );

  assert.throws(
    () => buildMergedTableGrid({
      rows: 2,
      cols: 2,
      cells: [{ row: 1, col: 1, row_span: 2, text: "out" }],
    }),
    /outside table bounds/u,
  );
});
