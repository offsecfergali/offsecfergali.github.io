# offsecfergali // Red Teaming & Vulnerability Research

Personal offensive security blog, bug bounty write-ups, and red teaming methodologies authored by Alae Eddine.

## Deployment on GitHub Pages

1. Create a new repository on GitHub (e.g. `offsecfergali`).
2. Push this codebase to your repository:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/offsecfergali.git
   git push -u origin main
   \`\`\`
3. Go to your repository **Settings** -> **Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. The included GitHub Actions workflow (\`.github/workflows/deploy.yml\`) will automatically build and deploy your site on every push to \`main\`.

## Local Development

\`\`\`bash
npm install
npm run dev
\`\`\`
