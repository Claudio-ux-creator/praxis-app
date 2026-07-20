const fs = require('fs');
const path = require('path');

const pagesDir = 'C:/Uni/8. Semester/Smart Applications/App/frontend/src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const fname of files) {
    const fpath = path.join(pagesDir, fname);
    let content = fs.readFileSync(fpath, 'utf-8');
    const original = content;
    
    // Fix en-dash / em-dash
    content = content.split('\\u00e2\\u0080\\u0093').join('\\u2013');
    content = content.split('\\u00e2\\u0080\\u0094').join('\\u2014');
    content = content.split('\\u00e2\\u0080\\u2122').join(\"'\");
    content = content.split('\\u00e2\\u0080\\u009c').join('\\u201c');
    content = content.split('\\u00e2\\u0080\\u009d').join('\\u201d');
    content = content.split('\\u00e2\\u0080\\u009e').join('\\u201e');
    
    // Fix diaeresis characters
    content = content.split('\\u00c3\\u201e').join('\\u00c4');
    content = content.split('\\u00c3\\u00a4').join('\\u00e4');
    content = content.split('\\u00c3\\u2013').join('\\u00d6');
    content = content.split('\\u00c3\\u00b6').join('\\u00f6');
    content = content.split('\\u00c3\\u0153').join('\\u00dc');
    content = content.split('\\u00c3\\u00bc').join('\\u00fc');
    content = content.split('\\u00c5\\u2018').join('\\u00df');
    
    // Middle dot
    content = content.split('\\u00c2\\u00b7').join('\\u00b7');
    
    if (content !== original) {
        fs.writeFileSync(fpath, content, 'utf-8');
        console.log('Fixed: ' + fname);
    }
}
console.log('Done');
