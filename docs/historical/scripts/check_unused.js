const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = fs.readFileSync('unused_files_list.txt', 'utf8').split('\n').filter(Boolean);
const trulyUnused = [];

for (const file of files) {
  // We only care about src files for now to be safe, but let's check all
  if (!file.startsWith('src/') && !file.startsWith('app/') && !file.startsWith('mcp/')) {
    continue;
  }
  
  let basename = path.basename(file, path.extname(file));
  if (basename === 'index' || basename === 'route' || basename === 'page' || basename === 'layout') {
    // These are special entry points or too generic to grep for easily. Let's just assume they are used if they are page/layout/route.
    if (file.includes('app/') || file.includes('pages/')) {
       continue; 
    }
    // If it's index.ts, check for the parent folder name
    basename = path.basename(path.dirname(file));
  }
  
  try {
    const out = execSync(`git grep -l "${basename}"`).toString().trim().split('\n');
    const references = out.filter(f => {
      if (f === file) return false;
      if (f.endsWith('.map') || f.endsWith('.json') || f.endsWith('.lock')) return false;
      return true;
    });
    
    if (references.length === 0) {
      trulyUnused.push(file);
    }
  } catch(e) {
    // git grep exits with 1 if no matches found
    trulyUnused.push(file);
  }
}

fs.writeFileSync('truly_unused_files.txt', trulyUnused.join('\n'));
console.log('Found ' + trulyUnused.length + ' truly unused files.');
