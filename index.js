import { stitch } from "@google/stitch-sdk";

async function main() {
  const projects = await stitch.projects();
  console.log(`Found ${projects.length} project(s):`);
  for (const project of projects) {
    console.log(`  - ${project.projectId}`);
  }
}

main().catch(console.error);
