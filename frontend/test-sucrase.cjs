const sucrase = require('./node_modules/sucrase');
const fs = require('fs');
const content = fs.readFileSync('src/main.tsx', 'utf-8');
const result = sucrase.transform(content, {
  transforms: ['typescript', 'jsx'],
  jsxPragma: 'React.createElement',
  jsxFragmentPragma: 'React.Fragment',
  production: false,
});
console.log(result.code);
