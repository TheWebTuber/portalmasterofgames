import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFOperator,
  PDFOperatorNames,
  PageSizes,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export type PrintSheet = {
  name: string;
  level: number;
  subtitle: string;
  portrait: string;
  sections: { title: string; rows: [string, string][]; compact?: boolean }[];
};
export type PdfOptions = {
  mode: "full" | "compact" | "blank";
  paper: "a4" | "letter";
  portrait: boolean;
};

const ink = rgb(0.12, 0.13, 0.17);
const muted = rgb(0.3, 0.31, 0.36);
const plum = rgb(0.25, 0.17, 0.31);
const gold = rgb(0.59, 0.43, 0.2);
const rule = rgb(0.78, 0.76, 0.72);
const pale = rgb(0.96, 0.95, 0.93);
const margin = 37;
const bottom = 45;
const lineHeight = 14;
const fontUrl = new URL("./fonts/LiberationSans-Regular.ttf", import.meta.url);
let fontBytes: Promise<ArrayBuffer> | undefined;

function getFont() {
  if (!fontBytes) {
    fontBytes = fetch(fontUrl)
      .then((response) => {
        if (!response.ok)
          throw new Error("The PDF font could not be loaded. Please retry.");
        return response.arrayBuffer();
      })
      .catch((error) => {
        fontBytes = undefined;
        throw error;
      });
  }
  return fontBytes;
}

function wrap(
  value: string,
  width: number,
  measure: (value: string) => number,
): string[] {
  const result: string[] = [];
  for (const paragraph of value
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "    ")
    .split("\n")) {
    let line = "";
    for (const word of paragraph.match(/\S+| +/gu) ?? []) {
      if (measure(line + word) <= width) {
        line += word;
        continue;
      }
      if (line.trim()) {
        result.push(line.trimEnd());
        line = "";
      }
      if (!word.trim()) continue;
      if (measure(word) <= width) {
        line = word;
        continue;
      }
      // URLs, unspaced scripts and other long tokens must wrap too.
      for (const glyph of Array.from(word)) {
        if (line && measure(line + glyph) > width) {
          result.push(line);
          line = "";
        }
        line += glyph;
      }
    }
    result.push(line.trimEnd());
  }
  return result;
}

export async function makePDF(
  sheets: PrintSheet[],
  options: PdfOptions,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(await getFont(), { subset: true });
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const display = await doc.embedFont(StandardFonts.TimesRomanBold);
  const [width, height] =
    options.paper === "letter" ? PageSizes.Letter : PageSizes.A4;
  const inner = width - margin * 2;
  const modeLabel = {
    full: "Character sheet",
    compact: "Session reference",
    blank: "Blank character sheet",
  }[options.mode];
  doc.setCreator("Character Forge");
  doc.setSubject(
    "Includes material adapted from System Reference Document 5.1 by Wizards of the Coast LLC (https://dnd.wizards.com/resources/systems-reference-document), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).",
  );
  doc.setTitle(
    sheets.length === 1 && options.mode !== "blank"
      ? sheets[0].name + " | " + modeLabel
      : "Character Forge | " + modeLabel,
  );
  const coverage = new Set(regular.getCharacterSet());
  const fallbackImages: Promise<void>[] = [];
  let canvas: HTMLCanvasElement | undefined;
  let page: PDFPage;
  let y = 0;

  // Latin, Greek and Cyrillic stay embedded and selectable. Use system fonts
  // for other scripts and preserve their original Unicode in PDF ActualText.
  function nativeFont(text: string, requested: PDFFont) {
    if (/^[\x20-\x7e]*$/.test(text)) return requested;
    return Array.from(text).every((char) => coverage.has(char.codePointAt(0)!))
      ? regular
      : null;
  }
  function systemContext() {
    if (typeof document === "undefined")
      throw new Error("This script needs a browser font for PDF export.");
    canvas ??= document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("The browser cannot render this script in the PDF.");
    return context;
  }
  function measure(text: string, size: number, requested = regular) {
    const font = nativeFont(text, requested);
    if (font) return font.widthOfTextAtSize(text, size);
    const context = systemContext();
    context.font = size + "px sans-serif";
    return context.measureText(text).width;
  }
  function text(
    value: string,
    x: number,
    baseline: number,
    size = 10,
    font = regular,
    color = ink,
  ) {
    if (!value) return;
    const supported = nativeFont(value, font);
    if (supported) {
      page.drawText(value, { x, y: baseline, size, font: supported, color });
      return;
    }
    const context = systemContext();
    const w = measure(value, size) + 4,
      h = size * 1.75;
    const imageCanvas = context.canvas;
    imageCanvas.width = Math.ceil(w * 3);
    imageCanvas.height = Math.ceil(h * 3);
    context.scale(3, 3);
    context.font = size + "px sans-serif";
    context.fillStyle =
      "rgb(" +
      [color.red, color.green, color.blue]
        .map((n) => Math.round(n * 255))
        .join(",") +
      ")";
    context.fillText(value, 2, size * 1.22);
    const target = page;
    const data = imageCanvas.toDataURL("image/png");
    fallbackImages.push(
      doc.embedPng(data).then((image) => {
        const props = doc.context.obj({
          ActualText: PDFHexString.fromText(value),
        });
        target.pushOperators(
          PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [
            PDFName.of("Span"),
            props.toString(),
          ]),
        );
        target.drawImage(image, {
          x: x - 2,
          y: baseline - h + size * 1.22,
          width: w,
          height: h,
        });
        target.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent));
      }),
    );
  }
  function line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color = rule,
    thickness = 0.6,
  ) {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      color,
      thickness,
    });
  }
  function newPage() {
    page = doc.addPage([width, height]);
    page.drawRectangle({
      x: margin,
      y: height - 41,
      width: 4,
      height: 12,
      color: gold,
    });
    text("CHARACTER FORGE", margin + 11, height - 39, 9, bold, plum);
    const right = modeLabel.toUpperCase();
    text(
      right,
      width - margin - measure(right, 8, bold),
      height - 39,
      8,
      bold,
      muted,
    );
    line(margin, height - 49, width - margin, height - 49);
    y = height - 76;
  }
  function room(points: number) {
    if (y - points < bottom) newPage();
  }
  function bar(title: string) {
    const heading = wrap(title, inner - 22, (s) => measure(s, 11, bold));
    room(heading.length * 14 + 40);
    for (const lineText of heading) {
      page.drawRectangle({
        x: margin,
        y: y - 5,
        width: inner,
        height: 18,
        color: pale,
      });
      page.drawRectangle({
        x: margin,
        y: y - 5,
        width: 2.4,
        height: 18,
        color: gold,
      });
      text(lineText, margin + 9, y, 11, bold, plum);
      y -= 15;
    }
    y -= 10;
  }
  function contentLines(
    value: string,
    size: number,
    font: PDFFont,
    color = ink,
    maxWidth = inner,
    advance = lineHeight,
  ) {
    for (const item of wrap(value, maxWidth, (s) => measure(s, size, font))) {
      room(advance);
      text(item, margin, y, size, font, color);
      y -= advance;
    }
  }
  async function portrait(data: string) {
    if (/^data:image\/png[;,]/i.test(data)) return doc.embedPng(data);
    if (/^data:image\/jpe?g[;,]/i.test(data)) return doc.embedJpg(data);
    throw new Error("Choose a PNG or JPEG portrait to include it in the PDF.");
  }

  async function filled(sheet: PrintSheet) {
    newPage();
    const withImage = options.portrait && !!sheet.portrait;
    const headerWidth = withImage ? inner - 83 : inner;
    const headerTop = y + 13;
    if (withImage) {
      const image = await portrait(sheet.portrait);
      const box = image.scaleToFit(65, 65);
      page.drawImage(image, {
        x: width - margin - box.width,
        y: headerTop - box.height,
        ...box,
      });
    }
    contentLines(
      sheet.name || "Unnamed character",
      23,
      display,
      plum,
      headerWidth,
      29,
    );
    contentLines("Level " + sheet.level, 10, bold, gold, headerWidth);
    if (sheet.subtitle)
      contentLines(sheet.subtitle, 10, regular, muted, headerWidth);
    if (withImage && y > headerTop - 75) y = headerTop - 75;
    y -= 13;

    for (const section of sheet.sections) {
      if (options.mode === "compact" && !section.compact) continue;
      if (!section.rows.length) continue;
      bar(section.title);
      const colGap = 20;
      const colWidth = (inner - colGap) / 2;
      let left: [string, string] | undefined;
      function pair(first: [string, string], second?: [string, string]) {
        if (y - 33 < bottom) {
          newPage();
          bar(section.title + " (continued)");
        }
        const items = second ? [first, second] : [first];
        items.forEach(([label, value], index) => {
          const x = margin + index * (colWidth + colGap);
          text(label, x, y, 8.7, bold, muted);
          text(value || "—", x, y - 13, 10.5);
          line(x, y - 19, x + colWidth, y - 19);
        });
        y -= 34;
      }
      function flush() {
        if (left) pair(left);
        left = undefined;
      }
      for (const row of section.rows) {
        const [label, value] = row;
        const short =
          !/[\r\n\t]/.test(label + value) &&
          measure(label, 8.7, bold) <= colWidth &&
          measure(value, 10.5) <= colWidth;
        if (short) {
          if (left) {
            pair(left, row);
            left = undefined;
          } else left = row;
          continue;
        }
        flush();
        if (y - 39 < bottom) {
          newPage();
          bar(section.title + " (continued)");
        }
        contentLines(label, 9, bold, muted, inner, 14);
        for (const item of wrap(value || "—", inner, (s) => measure(s, 10))) {
          if (y - lineHeight < bottom) {
            newPage();
            bar(section.title + " (continued)");
          }
          text(item, margin, y);
          y -= lineHeight;
        }
        y -= 5;
        line(margin, y, width - margin, y);
        y -= 12;
      }
      flush();
      y -= 10;
    }
  }

  function blankFields(labels: string[], rows = 1) {
    const gap = 12;
    const fieldWidth = (inner - gap * (labels.length - 1)) / labels.length;
    labels.forEach((label, index) => {
      const x = margin + index * (fieldWidth + gap);
      text(label, x, y, 9, bold, muted);
      for (let row = 0; row < rows; row++)
        line(x, y - 18 - row * 17, x + fieldWidth, y - 18 - row * 17);
    });
    y -= 36 + (rows - 1) * 17;
  }
  function blank() {
    newPage();
    contentLines("Character record", 23, display, plum, inner, 34);
    blankFields(["Character name", "Campaign / timeline"]);
    blankFields(["Species / lineage", "Class / subclass", "Level / XP"]);
    blankFields(["Background", "Alignment", "Proficiency bonus"]);
    bar("Ability scores, modifiers and saves");
    blankFields(
      [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma",
      ],
      2,
    );
    bar("Combat");
    blankFields(["Armor class", "Initiative", "Speed", "Passive Perception"]);
    blankFields(["Maximum HP", "Current HP", "Temporary HP", "Hit dice"]);
    blankFields([
      "Death save successes",
      "Death save failures",
      "Conditions / resistances",
    ]);
    bar("Skills");
    const skills = [
      "Acrobatics",
      "Animal Handling",
      "Arcana",
      "Athletics",
      "Deception",
      "History",
      "Insight",
      "Intimidation",
      "Investigation",
      "Medicine",
      "Nature",
      "Perception",
      "Performance",
      "Persuasion",
      "Religion",
      "Sleight of Hand",
      "Stealth",
      "Survival",
    ];
    for (let i = 0; i < skills.length; i += 3)
      blankFields(skills.slice(i, i + 3));

    newPage();
    contentLines("Equipment & magic", 23, display, plum, inner, 34);
    blankFields(["Character name", "Campaign"]);
    bar("Attacks");
    blankFields(["Weapon / attack", "Attack bonus", "Damage / type"], 3);
    bar("Spellcasting");
    blankFields([
      "Spellcasting ability",
      "Spell attack",
      "Save DC",
      "Concentration",
    ]);
    blankFields(["Spell slots by level / expended"], 2);
    blankFields(["Cantrips, known spells and prepared spells"], 6);
    bar("Possessions");
    blankFields(["Equipment / items", "Quantity / notes"], 4);
    blankFields(["CP", "SP", "EP", "GP", "PP"]);

    newPage();
    contentLines("Features & story", 23, display, plum, inner, 34);
    blankFields(["Character name", "Campaign"]);
    bar("Features, feats and proficiencies");
    blankFields(["Traits / class features / limited uses"], 5);
    bar("Personality");
    blankFields(["Appearance and personality", "Ideals, bonds and flaws"], 4);
    bar("Campaign journal");
    blankFields(["Backstory, allies and goals"], 5);
    blankFields(["Session notes"], 5);
  }

  if (options.mode === "blank") blank();
  else {
    if (!sheets.length)
      throw new Error("Choose at least one character to export.");
    for (const sheet of sheets) await filled(sheet);
  }
  await Promise.all(fallbackImages);
  const pages = doc.getPages();
  pages.forEach((item, index) => {
    page = item;
    line(margin, 35, width - margin, 35);
    text(
      "Based on SRD 5.1 by Wizards of the Coast LLC | CC BY 4.0",
      margin,
      21,
      8,
      regular,
      muted,
    );
    const counter = index + 1 + " / " + pages.length;
    text(counter, width - margin - measure(counter, 8), 21, 8, regular, muted);
  });
  return doc.save();
}
