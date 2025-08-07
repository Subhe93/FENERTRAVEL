const fs = require("fs");
const path = require("path");

function updateRequireStatements(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updateRequireStatements(filePath);
    } else if (file.endsWith(".js")) {
      // Read file content
      let content = fs.readFileSync(filePath, "utf8");

      // Update require statements for relative imports
      content = content.replace(
        /require\("\.\/([^"]+)"\)/g,
        'require("./$1.cjs")'
      );
      content = content.replace(
        /require\("\.\.\/([^"]+)"\)/g,
        'require("../$1.cjs")'
      );

      // Write back the content
      fs.writeFileSync(filePath, content);

      // Rename to .cjs
      const newPath = filePath.replace(/\.js$/, ".cjs");
      fs.renameSync(filePath, newPath);

      console.log(`Renamed ${filePath} to ${newPath}`);
    }
  }
}

// Start the process
console.log("Updating require statements and renaming files...");
updateRequireStatements("dist/server");
console.log("Build complete!");
