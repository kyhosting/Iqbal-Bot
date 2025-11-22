const fs = require('fs');
const path = require('path');

const commandsDir = './commands';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern 1: Handle lines that have { reply_markup: but no parse_mode
  content = content.replace(
    /(\{\s*)reply_markup:/g,
    '$1parse_mode: "HTML", reply_markup:'
  );
  
  // Pattern 2: Handle standalone bot.sendMessage() calls without options
  // This will catch most simple cases
  content = content.replace(
    /bot\.sendMessage\(([^,]+),\s<b>([^,}]+?)\)\s</b>;/g,
    (match) => {
      if (!match.includes('parse_mode') && !match.includes('{')) {
        return match.replace(');', ', { parse_mode: "HTML" });');
      }
      return match;
    }
  );
  
  // Pattern 3: Multi-line cases - look at each line
  let lines = content.split('\n');
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    
    if (line.includes('bot.sendMessage') && !line.includes('parse_mode')) {
      // Collect the full statement if it spans multiple lines
      let fullStatement = line;
      let j = i + 1;
      
      while (j < lines.length && !fullStatement.includes(');')) {
        fullStatement += '\n' + lines[j];
        j++;
      }
      
      // Now fix this full statement
      if (fullStatement.includes('{') && !fullStatement.includes('parse_mode')) {
        fullStatement = fullStatement.replace('{ ', '{ parse_mode: "HTML", ');
      } else if (!fullStatement.includes('{') && fullStatement.includes(');')) {
        fullStatement = fullStatement.replace(');', ', { parse_mode: "HTML" });');
      }
      
      // Put it back
      let newLines = fullStatement.split('\n');
      for (let k = 0; k < newLines.length; k++) {
        lines[i + k] = newLines[k];
      }
      i = j;
    }
    i++;
  }
  
  content = lines.join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fix all JS files in commands
const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
files.forEach(file => {
  fixFile(path.join(commandsDir, file));
  console.log(`✓ ${file}`);
});

console.log(`\n✅ ${files.length} files fixed!`);
