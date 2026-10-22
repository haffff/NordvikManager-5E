// The SRD data this addon ships (data/srd-5.1/, data/srd-5.2/ in the addon repo,
// built by scripts/srd), offered as ready-made sources in the settings.

export const SRD_EDITIONS = ["5.1", "5.2"];

const REPO_BLOB = "https://github.com/haffff/NordvikManager-5E/blob/main/data";
const REPO_RAW = "https://raw.githubusercontent.com/haffff/NordvikManager-5E/refs/heads/main/data";

// Derives the resource-key suffix for a source from its display name — must
// match the derivation in each consuming card's own useXData.js hook exactly
// (useSpellsData.js, useItemsData.js, the future useBestiaryData.js), since
// that's how a source's display name maps to the resource key it synced.
export const slugify = (name) =>
  (name ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "source";

/** A { name, url } source for one kind of data ("items", "spells", "feats", ...) of an SRD edition. */
export const srdSource = (edition, kind) => ({ name: `SRD ${edition}`, url: `${REPO_BLOB}/srd-${edition}/${kind}.json` });

/** The raw file URL, for single-URL settings such as languages. */
export const srdRawUrl = (edition, kind) => `${REPO_RAW}/srd-${edition}/${kind}.json`;

// Same statements as scripts/srd/buildData.mjs puts in every data file.
export const SRD_ATTRIBUTION = {
  "5.1":
    "This work includes material taken from the System Reference Document 5.1 (\"SRD 5.1\") by Wizards of the Coast LLC " +
    "and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the " +
    "Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.",
  "5.2":
    "This work includes material from the System Reference Document 5.2.1 (\"SRD 5.2.1\") by Wizards of the Coast LLC, " +
    "available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 " +
    "International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.",
};
