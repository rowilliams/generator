import { stitch } from "@google/stitch-sdk";
import readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

async function browseScreens(project) {
  const screens = await project.screens();
  if (screens.length === 0) {
    console.log("  (no screens)\n");
    return;
  }
  console.log(`\n  ${screens.length} screen(s):\n`);
  screens.forEach((s, i) => {
    const { title, name, deviceType, width, height } = s.data;
    console.log(`  [${i + 1}] ${title || name}  (${deviceType} ${width}x${height})`);
  });

  const input = await ask("\n  Enter screen number to view HTML, or press Enter to go back: ");
  const idx = parseInt(input) - 1;
  if (idx >= 0 && idx < screens.length) {
    const screen = screens[idx];
    const { title, name, screenshot, htmlCode } = screen.data;
    console.log(`\n  --- ${title || name} ---`);
    if (screenshot) console.log(`  Screenshot: ${screenshot}`);
    if (htmlCode) {
      const preview = htmlCode.slice(0, 300).replace(/\s+/g, " ").trim();
      console.log(`  HTML preview: ${preview}...`);
    }
    console.log();
  }
}

async function main() {
  console.log("\nFetching Stitch projects...\n");
  const projects = await stitch.projects();

  while (true) {
    console.log("=== Your Stitch Projects ===\n");
    projects.forEach((p, i) => {
      const { title, deviceType, updateTime } = p.data;
      console.log(`[${i + 1}] ${title}  (${deviceType})  updated ${formatDate(updateTime)}`);
    });
    console.log("\n[q] Quit");

    const input = await ask("\nSelect a project: ");
    if (input.trim().toLowerCase() === "q") break;

    const idx = parseInt(input) - 1;
    if (idx >= 0 && idx < projects.length) {
      const project = projects[idx];
      const { title, deviceType, projectType, createTime, updateTime } = project.data;
      console.log(`\n--- ${title} ---`);
      console.log(`  ID:      ${project.projectId}`);
      console.log(`  Type:    ${projectType}  |  Device: ${deviceType}`);
      console.log(`  Created: ${formatDate(createTime)}  |  Updated: ${formatDate(updateTime)}`);
      await browseScreens(project);
    } else {
      console.log("Invalid selection.\n");
    }
  }

  rl.close();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
