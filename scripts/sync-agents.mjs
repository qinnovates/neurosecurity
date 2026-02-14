import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const claudeMdPath = path.join(rootDir, 'CLAUDE.md');
const packageJsonPath = path.join(rootDir, 'package.json');
const tsconfigPath = path.join(rootDir, 'tsconfig.json');

// 1. Define Vendors
const vendors = [
    { file: 'CLAUDE.md', format: 'markdown' },
    // Future vendors can be added here (e.g., .windsurf/rules, COPILOT.md)
];

// 2. Generate Content
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const commands = `## Commands
- **Dev Server**: \`npm run dev\`
- **Build**: \`npm run build\`
- **Preview**: \`npm run preview\`
- **Updates**: \`npm run fetch-news\`
- **Type Check**: \`npm run type-check\`
- **Sync Context**: \`npm run sync\` (Refreshes this file)
`;

function getStructure() {
    const pagesDir = path.join(rootDir, 'src/pages');
    const apiDir = path.join(pagesDir, 'api');
    let structure = `## Project Structure
- \`src/\`: Astro website source
  - \`pages/\`: Routes
`;

    if (fs.existsSync(apiDir)) {
        structure += `    - \`api/\`: Data endpoints (e.g. tara.json)\n`;
    }

    if (fs.existsSync(path.join(pagesDir, 'TARA', '[id].astro'))) {
        structure += `    - \`TARA/[id].astro\`: Dynamic Threat Pages\n`;
    }

    structure += `  - \`components/\`: React/Astro components
  - \`layouts/\`: Page layouts
  - \`lib/\`: Utility functions and constants
- \`qif-framework/\`: QIF security specification docs
- \`governance/\`: Policy and ethics documents
- \`shared/\`: Shared data (Source of Truth)
- \`public/\`: Static assets
`;
    return structure;
}

const techStack = `## Tech Stack
- Framework: Astro 5.x
- UI: React 19, TailwindCSS 4
- Language: TypeScript
`;

const guidelines = `## Guidelines
- Use Semantic HTML.
- Follow Tailwind v4 conventions.
- Update \`shared/\` JSON files for data changes, which are copied to \`docs/data\` during build.
- Documentation is a primary product; keep markdown clean and standard.
`;

const governance = `## Standards & Governance (Scale)
- **QIF (Security)**: All architectural changes must align with the 11-band hourglass model.
- **TARA (Threats)**: New techniques must be scored with NISS (Neural Impact Scoring System).
- **Governance**: Refer to \`governance/\` for ethics, consent, and regulatory compliance.
- **Scale**: This is a standards body. Changes affect the industry. Verification is critical.
`;

const content = `# Qinnovate Project Guide
${commands}
${getStructure()}
${techStack}
${guidelines}
${governance}
`;

// 3. Write to all vendors
vendors.forEach(v => {
    const filePath = path.join(rootDir, v.file);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${v.file}`);
});
