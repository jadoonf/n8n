const fs = require('fs');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const ProgressBar = require('progress');

// Path to the pnpm lockfile
const lockfilePath = 'pnpm-lock.yaml'; 

// Load the lockfile
const lockfile = yaml.load(fs.readFileSync(lockfilePath, 'utf8'));

// To hold the unique dependencies
let uniqueDependencies = new Set();

// Extract unique dependencies
for (let importer of Object.values(lockfile.importers || {})) {
  for (let pkgCategory of ['dependencies', 'devDependencies']) {
    if (!importer[pkgCategory]) continue;
    for (let [pkg, pkgInfo] of Object.entries(importer[pkgCategory])) {
      if (pkg.startsWith('/')) {
        pkg = pkg.substring(1);
      }
      // Ensure that the version is defined and it's not a local package
      if (pkgInfo.version && !pkgInfo.version.startsWith('link:')) {
        let version = pkgInfo.version.split('(')[0];  // Only keep the version part
        uniqueDependencies.add({pkg, version});
      }
    }
  }
}

console.log(`Found ${uniqueDependencies.size} unique dependencies.`);

// Create a progress bar
let bar = new ProgressBar('Scanning [:bar] :percent :etas remaining', {
  complete: '=',
  incomplete: ' ',
  width: 40,
  total: uniqueDependencies.size
});

let successfullyScanned = [];

// Scan each unique dependency
for (let {pkg, version} of uniqueDependencies) {
  console.log(`Scanning ${pkg} at version ${version}...`);
  try {
    let result = execSync(`/usr/local/bin/lstn to ${pkg} ${version}`, { encoding: 'utf8' });
    console.log(result);
    successfullyScanned.push({pkg, version});
  } catch (error) {
    console.log(`Error scanning ${pkg} at version ${version}: ${error.message}`);
  }

  // Increment the progress bar
  bar.tick();
  console.log(`Successfully scanned ${successfullyScanned.length}/${uniqueDependencies.size} dependencies. ${uniqueDependencies.size - successfullyScanned.length} remaining.`);
}

console.log(`Successfully scanned dependencies: ${JSON.stringify(successfullyScanned, null, 2)}`);
