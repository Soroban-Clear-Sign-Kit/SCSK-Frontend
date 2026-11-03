import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Repository Templates & Documentation", () => {
  const rootDir = path.resolve(__dirname, "../../");

  it("pull request template mandates screenshots for UI changes", () => {
    const prTemplatePath = path.join(
      rootDir,
      ".github/pull_request_template.md",
    );
    expect(fs.existsSync(prTemplatePath)).toBe(true);
    const content = fs.readFileSync(prTemplatePath, "utf-8");
    expect(content.toLowerCase()).toContain("screenshot");
    expect(content).toContain("Screenshots (Mandatory for UI Changes)");
  });

  it("bug report template prompts for screenshots", () => {
    const bugTemplatePath = path.join(
      rootDir,
      ".github/ISSUE_TEMPLATE/bug_report.md",
    );
    expect(fs.existsSync(bugTemplatePath)).toBe(true);
    const content = fs.readFileSync(bugTemplatePath, "utf-8");
    expect(content.toLowerCase()).toContain("screenshot");
  });

  it("issue configuration file exists", () => {
    const configPath = path.join(rootDir, ".github/ISSUE_TEMPLATE/config.yml");
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it("README includes CI status badge targeting main branch", () => {
    const readmePath = path.join(rootDir, "README.md");
    const content = fs.readFileSync(readmePath, "utf-8");
    expect(content).toContain("badge.svg?branch=main");
  });
});
