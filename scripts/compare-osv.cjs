const { readFileSync } = require('node:fs');

function findings(file) {
  const report = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(report.results)) throw new Error('Invalid OSV-Scanner report');

  return new Set(report.results.flatMap((source) =>
    (source.packages ?? []).flatMap(({ package: dependency, vulnerabilities = [] }) =>
      vulnerabilities.map(({ id }) => `${dependency.ecosystem}:${dependency.name} ${id}`)
    )
  ));
}

const base = findings(process.argv[2]);
const head = findings(process.argv[3]);
const added = [...head].filter((finding) => !base.has(finding)).sort();
console.log(`OSV findings: ${base.size} in base, ${head.size} in head, ${added.length} new.`);
if (added.length) {
  console.log(added.join('\n'));
  process.exitCode = 1;
}
