/* Spreadsheet CSV export: defensive text encoding for fictional demo data.
 * Not a universal guarantee across spreadsheet applications or resave workflows.
 * No network, storage, external libraries or dynamic evaluation.
 */
(function (root) {
  "use strict";
  function cell(value) {
    const raw = String(value == null ? "" : value)
      .normalize("NFKC")
      // Strip control/bidi characters that can hide a formula prefix or mislead reviewers.
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/g, " ")
      .slice(0, 250);
    // Prefix Excel-style formulas with a tab *inside* the quoted cell. See
    // OWASP CSV Injection: other spreadsheet applications can behave differently.
    const safe = /^\s*[=+\-@]/u.test(raw) ? "\t" + raw : raw;
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  function rows(table) {
    if (!Array.isArray(table)) throw new TypeError("Rows must be an array");
    return table.map(function (row) {
      if (!Array.isArray(row) || row.length !== 2) throw new TypeError("Each CSV row needs exactly two cells");
      return row.map(cell).join(",");
    }).join("\r\n");
  }
  const api = Object.freeze({cell: cell, rows: rows});
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.AerieCsv = api;
})(typeof window !== "undefined" ? window : globalThis);
