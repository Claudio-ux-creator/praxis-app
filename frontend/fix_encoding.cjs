const fs = require("fs");
const path = require("path");

const pagesDir = "C:/Uni/8. Semester/Smart Applications/App/frontend/src/pages";
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith(".tsx"));

// Map corrupted chars to correct ones
// The corruption: ü (U+00FC) was stored as UTF-8 bytes C3 BC
// Then those bytes were re-interpreted as Latin-1 and encoded again as UTF-8
// C3 -> Ã (U+00C3 = bytes C3 83), BC -> ¼ (U+00BC = bytes C2 BC)
// But then the file was saved as UTF-8 again, so we see the bytes C3 83 C2 BC
// Some files have double-encoding (C3 83 C2 BC) and some triple (C3 83 C2 83 C3 82 C2 BC)

// For each page file, fix the corrupted characters
for (const fname of files) {
    const fpath = path.join(pagesDir, fname);
    let buf = fs.readFileSync(fpath);
    let content = buf.toString("utf-8");
    const original = content;
    
    // Fix known corruption patterns
    content = content.replace(/PrÃƒâ€žÂ¼fung/g, "Prüfung");
    content = content.replace(/PrÃƒâ€žÂ¼fen/g, "Prüfen");
    content = content.replace(/PrÃ¼fung/g, "Prüfung");
    content = content.replace(/PrÃ¼fen/g, "Prüfen");
    content = content.replace(/Prüfung/g, "Prüfung");
    
    // Fix Ã¼ -> ü (double-encoded)
    content = content.replace(/\u00c3\u00bc/g, "\u00fc");
    // Fix Ã¤ -> ä
    content = content.replace(/\u00c3\u00a4/g, "\u00e4");
    // Fix Ã¶ -> ö
    content = content.replace(/\u00c3\u00b6/g, "\u00f6");
    // Fix ÃŸ -> ß
    content = content.replace(/\u00c5\u2018/g, "\u00df");
    // Fix Ã„ -> Ä
    content = content.replace(/\u00c3\u201e/g, "\u00c4");
    // Fix Ã– -> Ö
    content = content.replace(/\u00c3\u2013/g, "\u00d6");
    // Fix Ãœ -> Ü
    content = content.replace(/\u00c3\u0153/g, "\u00dc");
    
    // Fix bullet character
    content = content.replace(/\u00c2\u00b7/g, "\u00b7");
    content = content.replace(/\u00e2\u0080\u0093/g, "\u2013");
    content = content.replace(/\u00e2\u0080\u0094/g, "\u2014");
    content = content.replace(/\u00e2\u0080\u0099/g, "\u2019");
    content = content.replace(/\u00e2\u0080\u009c/g, "\u201c");
    content = content.replace(/\u00e2\u0080\u009d/g, "\u201d");
    content = content.replace(/\u00e2\u0080\u009e/g, "\u201e");
    
    // Also fix the specific remaining issue with "ÃƒÂ¼" (triple-encoded ü)
    // This is bytes: C3 83 C2 83 C3 82 C2 BC
    const tripleUe = String.fromCharCode(0xC3, 0x83, 0xC2, 0x83, 0xC3, 0x82, 0xC2, 0xBC);
    content = content.replace(new RegExp(tripleUe, "g"), "\u00fc");
    
    // Also fix "PrÃƒÂ¼fung" patterns  
    // ÃƒÂ¼ = bytes C3 83 C2 83 C3 82 C2 BC
    content = content.replace(/In Prüfung/g, "In Prüfung");  // already correct
    content = content.replace(/In PrÃƒÂ¼fung/g, "In Prüfung");
    
    // More aggressive: find "In Pr" followed by garbage and "fung"
    content = content.replace(/In Pr[^f]+fung/g, "In Prüfung");
    content = content.replace(/\bPr[^f]+fen\b/g, "Prüfen");
    
    if (content !== original) {
        fs.writeFileSync(fpath, content, "utf-8");
        console.log("Fixed: " + fname);
    }
}

console.log("\nDone!");
