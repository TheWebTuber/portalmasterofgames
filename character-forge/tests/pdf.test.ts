import assert from "node:assert/strict";
import { before, test } from "node:test";
import { readFileSync } from "node:fs";
import { PDFDocument, PDFName, type PDFDict } from "pdf-lib";
import { makePDF, type PrintSheet, type PdfOptions } from "../src/pdf";

before(() => {
  const fetchNetwork = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (input instanceof URL && input.protocol === "file:") {
      return new Response(new Uint8Array(readFileSync(input)));
    }
    return fetchNetwork(input, init);
  };
});

const character: PrintSheet = {
  name: "Élodie of Ash",
  level: 4,
  subtitle: "Wayfarer / winter campaign",
  portrait: "",
  sections: [
    {
      title: "Combat",
      compact: true,
      rows: [
        ["Armor class", "15"],
        ["Current HP", "29"],
      ],
    },
    { title: "Backstory", rows: [["First winter", "A curious traveler."]] },
  ],
};
const options: PdfOptions = { mode: "full", paper: "a4", portrait: false };
const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=";

test("compact omits long story; full and collection paginate without mixing characters", async () => {
  const story: PrintSheet = {
    ...character,
    sections: [
      ...character.sections,
      {
        title: "Session notes",
        rows: [
          ["Journal", "A tide of silver. ".repeat(650)],
          ["Reference", "x".repeat(400)],
        ],
      },
    ],
  };
  const compact = await PDFDocument.load(
    await makePDF([story], { ...options, mode: "compact" }),
  );
  const full = await PDFDocument.load(await makePDF([story], options));
  const library = await PDFDocument.load(
    await makePDF([story, character], options),
  );
  assert.equal(compact.getPageCount(), 1);
  assert.ok(full.getPageCount() >= 3);
  assert.equal(library.getPageCount(), full.getPageCount() + 1);
  assert.equal(Math.round(full.getPage(0).getWidth()), 595);
});

test("blank is a three-page printable without saved characters and supports US Letter", async () => {
  const bytes = await makePDF([], {
    mode: "blank",
    paper: "letter",
    portrait: false,
  });
  const blank = await PDFDocument.load(bytes);
  assert.equal(Buffer.from(bytes.subarray(0, 5)).toString(), "%PDF-");
  assert.equal(blank.getPageCount(), 3);
  assert.deepEqual(blank.getPage(0).getSize(), { width: 612, height: 792 });
});

test("portrait switch controls image embedding", async () => {
  for (const include of [true, false]) {
    const doc = await PDFDocument.load(
      await makePDF([{ ...character, portrait: tinyPng }], {
        ...options,
        portrait: include,
      }),
    );
    const resources = doc.getPage(0).node.Resources()!;
    const xobjects = resources.get(PDFName.of("XObject")) as
      | PDFDict
      | undefined;
    assert.equal(Boolean(xobjects?.keys().length), include);
  }
});
