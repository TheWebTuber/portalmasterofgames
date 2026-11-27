# Character Forge

Open **dndcharactersheet.html** in the parent PMOG folder, or choose **Character Forge** on the site's D&D campaign page. The prebuilt app runs locally without installing Node. It uses this browser’s IndexedDB for characters and makes PDF and JSON downloads on the device.

## Make a campaign sheet

1. Click **Create character** for the eleven-step guide, or **Advanced editor** to jump between sections. Type into an option field to search the SRD or enter your own name.
2. Enter your campaign name to group sheets into a folder. Duplicate a library card to create a separately editable timeline, level or outfit. Portraits are converted to PNG in your browser.
3. Enter **base** ability scores. Fixed species bonuses are added automatically. The sheet shows the final score and modifier. Clear a manual numeric override to restore automatic calculation.
4. Open **Combat & equipment** to equip armor, record HP and add attacks. Use **Spells & features** for spell slots, known/prepared spells, feats and limited-use abilities. Use the dice tray for rolls during play.
5. Choose **Download PDF** for a full sheet or compact table copy. Choose A4 or US Letter, include a portrait if desired, and preview, print or download. The library also offers a blank printable sheet and a combined PDF. Each character in a collection starts on a fresh page.

## Saving, transfers and backups

Edits are saved as you type. **Export JSON** makes an editable backup for one sheet. **Back up library** saves them all with a version marker. **Import JSON** validates the file before adding any sheets. A matching character ID becomes a new independent copy, preserving the existing sheet.

Browser storage belongs to a browser profile and site address. The local HTML file, local development server and public site may each have a separate library. Export a backup before switching browser, origin or device, or clearing site data. Private browsing may discard saves when the window closes.

## Rules coverage

The calculations target single-class 2014 characters. The catalog covers SRD species and subraces, twelve classes, their SRD subclasses, the Acolyte background, Grappler, damaging weapons and 319 spells. Bundled rules, art and PDF fonts load locally. External reference links are optional. See [rules credits](SOURCES.md).

The editor calculates modifiers, saving throws, skills, expertise, initiative, AC, passive Perception, walking speed, attack bonuses, spell attack/DC and single-class spell slot capacity. Maximum HP defaults to a full first Hit Die and fixed-average increases thereafter. Current HP starts at maximum until filled in. Spell slots and current resources are tracked by the player. The rules source selector records provenance.

Record fighting styles, situational modifiers, complex feature effects, multiclass combinations, table rulings and non-SRD options manually. Use the appropriate override for a house rule, magic item or rolled HP. Custom sources can include a reference URL and the player's own notes. The rules edition field describes the campaign; it does not switch calculation engines.

## Development

Use Node.js 22.12+ and pnpm 11 (or a compatible newer Node). From this directory:

```powershell
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
```

Vite serves the development entry from `index.html`. The production build type-checks the TypeScript and writes the static browser bundle into `site/`. The root-level `../dndcharactersheet.html` loads that build using relative paths. A browser visiting either the prebuilt local HTML or GitHub Pages needs no package manager, backend, account, or API key.

## GitHub Pages

Use PMOG's existing static Pages publishing configuration. Include the root HTML entry, the link in `dnd.html`, and `character-forge/site/` in the published tree. Rebuild and include the updated static files after source edits. The expected URL is `https://pmog.creatorpromote.com/dndcharactersheet.html`. The source, tests and lockfile can be kept in the repository for future changes.

## Tests

The focused tests cover 2014 math, overrides, backup validation, dice, PDF page sizes, portrait inclusion, blank forms and pagination. Browser workflows were also exercised in Edge on desktop and at a mobile viewport, including reload, duplication, JSON transfer, direct-file opening, print preview and downloadable PDFs.
