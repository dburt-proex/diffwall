import { describe, expect, it } from "vitest";
import { parseUnifiedDiff } from "../src/git.js";

describe("parseUnifiedDiff", () => {
  it("parses a standard git diff with headers", () => {
    const files = parseUnifiedDiff(
      [
        "diff --git a/src/app.ts b/src/app.ts",
        "index 111..222 100644",
        "--- a/src/app.ts",
        "+++ b/src/app.ts",
        "@@ -1,0 +1,1 @@",
        "+const x = 1;"
      ].join("\n")
    );

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe("src/app.ts");
    expect(files[0]?.additions).toBe(1);
    expect(files[0]?.addedLines).toEqual(["const x = 1;"]);
  });

  it("parses a header-less unified diff (diff -u / svn style)", () => {
    const files = parseUnifiedDiff(
      ["--- a/migrations/drop.sql", "+++ b/migrations/drop.sql", "@@ -0,0 +1 @@", "+DROP TABLE users;"].join("\n")
    );

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe("migrations/drop.sql");
    expect(files[0]?.addedLines).toEqual(["DROP TABLE users;"]);
  });

  it("splits multiple files in a header-less diff", () => {
    const files = parseUnifiedDiff(
      [
        "--- a/one.txt",
        "+++ b/one.txt",
        "@@ -0,0 +1 @@",
        "+first",
        "--- a/two.txt",
        "+++ b/two.txt",
        "@@ -0,0 +1 @@",
        "+second"
      ].join("\n")
    );

    expect(files.map((file) => file.path)).toEqual(["one.txt", "two.txt"]);
    expect(files[0]?.addedLines).toEqual(["first"]);
    expect(files[1]?.addedLines).toEqual(["second"]);
  });

  it("strips a trailing tab-delimited timestamp from marker paths", () => {
    const files = parseUnifiedDiff(
      ["--- a/file.py\t2026-01-01 00:00:00", "+++ b/file.py\t2026-01-02 00:00:00", "@@ -0,0 +1 @@", "+x = 1"].join("\n")
    );

    expect(files[0]?.path).toBe("file.py");
  });

  it("marks new and deleted files and ignores /dev/null paths", () => {
    const added = parseUnifiedDiff(
      ["diff --git a/n.txt b/n.txt", "new file mode 100644", "--- /dev/null", "+++ b/n.txt", "@@ -0,0 +1 @@", "+hi"].join("\n")
    );
    expect(added).toHaveLength(1);
    expect(added[0]?.path).toBe("n.txt");
    expect(added[0]?.isNew).toBe(true);

    const removed = parseUnifiedDiff(
      ["diff --git a/o.txt b/o.txt", "deleted file mode 100644", "--- a/o.txt", "+++ /dev/null", "@@ -1 +0,0 @@", "-bye"].join("\n")
    );
    expect(removed).toHaveLength(1);
    expect(removed[0]?.path).toBe("o.txt");
    expect(removed[0]?.isDeleted).toBe(true);
    expect(removed[0]?.deletions).toBe(1);
  });

  it("does not treat content lines beginning with --- or +++ as file headers", () => {
    const files = parseUnifiedDiff(
      [
        "diff --git a/schema.sql b/schema.sql",
        "--- a/schema.sql",
        "+++ b/schema.sql",
        "@@ -1,0 +1,2 @@",
        "+-- comment: DROP TABLE users;",
        "+DELETE FROM app.users;"
      ].join("\n")
    );

    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe("schema.sql");
    // The `+-- comment...` line is an added content line, not a `---` header.
    expect(files[0]?.additions).toBe(2);
    expect(files[0]?.addedLines).toEqual(["-- comment: DROP TABLE users;", "DELETE FROM app.users;"]);
  });

  it("returns no files for an empty diff", () => {
    expect(parseUnifiedDiff("")).toEqual([]);
    expect(parseUnifiedDiff("\n\n")).toEqual([]);
  });
});
