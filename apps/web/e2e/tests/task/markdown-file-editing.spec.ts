import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { expect, type Locator, type Page } from "@playwright/test";
import { test } from "../../fixtures/test-base";
import type { SeedData } from "../../fixtures/test-base";
import type { ApiClient } from "../../helpers/api-client";
import { GitHelper, makeGitEnv } from "../../helpers/git-helper";
import { SessionPage } from "../../pages/session-page";
import { watchWs, type WsWatcher } from "../../helpers/causal-waits";

const MARKDOWN_CONTENT = `# Markdown lifecycle

This paragraph stays in the canonical source.

> The rendered editor should match Preview typography.

\`\`\`ts
const ready = true;
\`\`\`

| Area | State |
| --- | --- |
| Preview | Ready |

${Array.from(
  { length: 56 },
  (_, index) => `Long desktop paragraph ${index + 1} keeps the preview scrollable.`,
).join("\n\n")}

<div data-unsupported="true">Unsupported source</div>
`;
const UNSUPPORTED_MARKDOWN_SOURCE = '<div data-unsupported="true">Unsupported source</div>';
const LONG_EDIT_PARAGRAPH =
  "Kandev should read as a restrained developer workbench. The shell is dense and quiet, with panels, command surfaces, and state indicators arranged so users can keep their place across tasks, sessions, repositories, and integrations.";
const PRESERVATION_LINES = [
  "\uFEFF---",
  "title: Preserve source bytes",
  "---",
  "",
  "# Exact source",
  "",
  "Target paragraph stays unchanged.",
  "",
  "**Strong** and _emphasis_ with `inline code`.",
  "",
  "- Parent",
  "  - Nested",
  "- [ ] Task",
  "",
  "| Escaped \\| pipe | Value |",
  "| :--- | ---: |",
  "| first | second |",
  "",
  "```typescript",
  "const preserved = '<Component value={1} />';",
  "```",
  "",
  "$x^2$ and $$y = x + 1$$",
  "",
  "A footnote[^note] and [link](https://example.com).",
  "",
  "![image](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)",
  "",
  '<div data-preserve="true">Raw HTML</div>',
  "",
  "<!-- preserve this comment -->",
  "",
  "<UnknownComponent value={source} />",
  "",
  "[^note]: A footnote definition.",
  "",
];
let restoreMarkdownRepository: (() => void) | undefined;

async function seedMarkdownSession({
  testPage,
  apiClient,
  seedData,
  backend,
  fileName,
  content,
  taskTitle,
}: {
  testPage: Page;
  apiClient: ApiClient;
  seedData: SeedData;
  backend: { tmpDir: string };
  fileName: string;
  content: string;
  taskTitle: string;
}): Promise<{ session: SessionPage; filePath: string; sessionId: string; gateway: WsWatcher }> {
  const repoDir = path.join(backend.tmpDir, "repos", "e2e-repo");
  const git = new GitHelper(repoDir, makeGitEnv(backend.tmpDir));
  const originalSha = git.getCurrentSha();
  restoreMarkdownRepository = () => git.exec(`git reset --hard ${originalSha}`);
  git.createFile(fileName, content);
  git.stageAll();
  git.commit(`seed ${fileName}`);

  const task = await apiClient.createTaskWithAgent(
    seedData.workspaceId,
    taskTitle,
    seedData.agentProfileId,
    {
      description: "/e2e:simple-message",
      workflow_id: seedData.workflowId,
      workflow_step_id: seedData.startStepId,
      repository_ids: [seedData.repositoryId],
    },
  );
  const gateway = watchWs(testPage);
  await testPage.goto(`/t/${task.id}`);
  const session = new SessionPage(testPage);
  await session.waitForLoad();
  await session.waitForChatIdle({ timeout: 45_000 });
  return {
    session,
    filePath: path.join(repoDir, fileName),
    sessionId: task.session_id,
    gateway,
  };
}

async function openFile(session: SessionPage, testPage: Page, fileName: string): Promise<void> {
  await session.clickTab("Files");
  await expect(session.files).toBeVisible({ timeout: 10_000 });
  const fileNode = await session.fileTree.waitForFileTreeNode(fileName);
  await fileNode.click();
  await expect(testPage.getByTestId("markdown-file-editor")).toBeVisible({ timeout: 15_000 });
}

async function appendToHybrid(testPage: Page, marker: string): Promise<void> {
  const editor = testPage.getByTestId("hybrid-markdown-editor");
  await expect(editor).toBeVisible({ timeout: 15_000 });
  const paragraph = editor.locator(".md-paragraph").last();
  await expect(paragraph).toBeVisible({ timeout: 15_000 });
  await paragraph.click();
  await testPage.keyboard.press(process.platform === "darwin" ? "Meta+End" : "Control+End");
  await testPage.keyboard.insertText(`\n\n${marker}`);
  await expect(editor).toContainText(marker);
}

async function editExistingHybridParagraph(testPage: Page): Promise<void> {
  const editor = testPage.getByTestId("hybrid-markdown-editor");
  const paragraph = editor.locator(".md-paragraph", {
    hasText: "This paragraph stays in the canonical source.",
  });
  await expect(paragraph).toHaveCount(1);
  const caretPoint = await paragraph.evaluate((element) => {
    const target = "canonical";
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const offset = node.textContent?.indexOf(target) ?? -1;
      if (offset < 0) continue;
      const range = document.createRange();
      range.setStart(node, offset);
      range.setEnd(node, offset + target.length);
      const rect = range.getBoundingClientRect();
      return { x: rect.right - 1, y: rect.top + rect.height / 2 };
    }
    return null;
  });
  expect(caretPoint).not.toBeNull();
  await testPage.mouse.click(caretPoint!.x, caretPoint!.y);
  await testPage.keyboard.insertText("!");
  await expect(
    editor.locator(".md-paragraph", {
      hasText: "This paragraph stays in the canonical! source.",
    }),
  ).toHaveCount(1);
  await expect(
    editor.getByText("This paragraph stays in the canonical source.", { exact: true }),
  ).toHaveCount(0);
}

async function clickAfterText(testPage: Page, block: Locator, target: string) {
  const point = await block.evaluate((element, text) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const offset = node.textContent?.indexOf(text) ?? -1;
      if (offset < 0) continue;
      const range = document.createRange();
      range.setStart(node, offset);
      range.setEnd(node, offset + text.length);
      const rect = range.getBoundingClientRect();
      return { x: rect.right - 1, y: rect.top + rect.height / 2 };
    }
    return null;
  }, target);
  expect(point).not.toBeNull();
  await testPage.mouse.click(point!.x, point!.y);
}

async function hybridPalette(testPage: Page) {
  return testPage.locator(".md-editor.kandev-hybrid-markdown-editor").evaluate((editor) => {
    const activeBlock = editor.querySelector<HTMLElement>(".md-block-active");
    const codeBlock = editor.querySelector<HTMLElement>(".md-code-block");
    const styles = getComputedStyle(editor);
    return {
      editorColor: styles.color,
      editorBackground: styles.backgroundColor,
      activeBackground: activeBlock ? getComputedStyle(activeBlock).backgroundColor : "",
      codeColor: codeBlock ? getComputedStyle(codeBlock).color : "",
      codeBackground: codeBlock ? getComputedStyle(codeBlock).backgroundColor : "",
    };
  });
}

async function presentationMetrics(testPage: Page, mode: "preview" | "edit") {
  const root =
    mode === "preview"
      ? testPage.getByTestId("markdown-preview-scroll-container")
      : testPage.locator(".md-editor.kandev-hybrid-markdown-editor");
  return root.evaluate(
    (element, selectors) => {
      const query = (selector: string) => element.querySelector<HTMLElement>(selector);
      const elementStyle = (selector: string) => {
        const node = query(selector);
        if (!node) throw new Error(`Missing Markdown element: ${selector}`);
        return { node, computed: getComputedStyle(node) };
      };
      const heading = elementStyle(selectors.heading);
      const blockquote = elementStyle(selectors.blockquote);
      const code = elementStyle(selectors.code);
      return {
        heading: {
          x: heading.node.getBoundingClientRect().x,
          fontSize: heading.computed.fontSize,
          fontWeight: heading.computed.fontWeight,
          lineHeight: heading.computed.lineHeight,
          marginTop: heading.computed.marginTop,
          marginBottom: heading.computed.marginBottom,
        },
        blockquote: {
          borderLeftWidth: blockquote.computed.borderLeftWidth,
          paddingLeft: blockquote.computed.paddingLeft,
          marginTop: blockquote.computed.marginTop,
          marginBottom: blockquote.computed.marginBottom,
          fontStyle: blockquote.computed.fontStyle,
        },
        code: {
          fontSize: code.computed.fontSize,
        },
      };
    },
    {
      heading: mode === "preview" ? "h1" : "h1.md-heading",
      blockquote: mode === "preview" ? "blockquote" : "blockquote.md-blockquote",
      code:
        mode === "preview"
          ? ":is(.monaco-editor, .cm-editor, .shiki-code-block, pre)"
          : "pre.md-code-block code",
    },
  );
}

async function expectSingleCompactToolbar(testPage: Page) {
  const editor = testPage.getByTestId("markdown-file-editor");
  const toolbar = editor.locator(".markdown-file-toolbar:visible");
  const editorBox = await editor.boundingBox();
  const toolbarBox = await toolbar.boundingBox();
  const visibleSurface = editor.locator(
    ":scope > .min-h-0.flex-1 :is(.monaco-editor:visible, [data-testid='markdown-preview-scroll-container']:visible, [data-testid='hybrid-markdown-editor']:visible)",
  );
  const surfaceBox = await visibleSurface.first().boundingBox();
  const modeButton = editor.locator("[data-testid^='markdown-mode-']:visible").first();
  const saveButton = editor.getByTestId("markdown-file-save");
  const buttonBox = await modeButton.boundingBox();
  const saveButtonBox = (await saveButton.count()) > 0 ? await saveButton.boundingBox() : null;
  await expect(toolbar).toHaveCount(1);
  expect(editorBox).not.toBeNull();
  expect(toolbarBox).not.toBeNull();
  expect(surfaceBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(surfaceBox!.y - editorBox!.y).toBeLessThanOrEqual(40);
  expect(buttonBox!.height).toBeLessThanOrEqual(20);
  expect(buttonBox!.height).toBeLessThan(toolbarBox!.height);
  if (saveButtonBox) {
    expect(saveButtonBox.height).toBeLessThanOrEqual(24);
    expect(saveButtonBox.height).toBeLessThan(toolbarBox!.height);
  }
}

test.describe("Markdown file editing", () => {
  test.describe.configure({ retries: 0, timeout: 120_000 });
  test.afterEach(() => {
    restoreMarkdownRepository?.();
    restoreMarkdownRepository = undefined;
  });

  // @covers AC-UI-MARKDOWN-FILE-EDITING-001.5, AC-UI-MARKDOWN-FILE-EDITING-002.4
  test("review regression: position handoff keeps a long-document selection through Preview and Source", async ({
    testPage,
    apiClient,
    seedData,
    backend,
  }) => {
    const fileName = `markdown-position-${Date.now()}.md`;
    const { session, filePath, gateway } = await seedMarkdownSession({
      testPage,
      apiClient,
      seedData,
      backend,
      fileName,
      content: MARKDOWN_CONTENT,
      taskTitle: "Markdown source positions",
    });
    await openFile(session, testPage, fileName);
    const editor = testPage.getByTestId("markdown-file-editor");
    await editor.getByTestId("markdown-mode-edit").click();
    const paragraph = editor
      .getByTestId("hybrid-markdown-editor")
      .locator(".md-paragraph", { hasText: "Long desktop paragraph 40 " });
    await paragraph.scrollIntoViewIfNeeded();
    await clickAfterText(testPage, paragraph, "Long");
    for (let index = 0; index < 4; index++) await testPage.keyboard.press("Shift+ArrowLeft");
    await editor.getByTestId("markdown-mode-preview").click();
    await expect(
      editor.getByTestId("markdown-preview").locator("p", {
        hasText: "Long desktop paragraph 40 ",
      }),
    ).toBeInViewport();
    await editor.getByTestId("markdown-mode-source").click();
    const source = testPage.getByRole("textbox", { name: "Editor content" });
    await source.focus();
    await testPage.keyboard.insertText("Selected");
    const saved = gateway.waitForResponse("workspace.file.update");
    await testPage.keyboard.press(process.platform === "darwin" ? "Meta+s" : "Control+s");
    await saved;
    expect(fs.readFileSync(filePath, "utf8")).toBe(
      MARKDOWN_CONTENT.replace("Long desktop paragraph 40 ", "Selected desktop paragraph 40 "),
    );
    await editor.getByTestId("markdown-mode-edit").click();
    await expect(
      editor.getByTestId("hybrid-markdown-editor").locator(".md-paragraph", {
        hasText: "Selected desktop paragraph 40 ",
      }),
    ).toBeInViewport();
  });

  for (const newline of ["\n", "\r\n"]) {
    test(`preserves the real engine source corpus with ${newline === "\n" ? "LF" : "CRLF"} through edits, undo, modes, and save`, async ({
      testPage,
      apiClient,
      seedData,
      backend,
    }) => {
      const fileName = `markdown-corpus-${Date.now()}.md`;
      const content = PRESERVATION_LINES.join(newline);
      const { session, filePath, gateway } = await seedMarkdownSession({
        testPage,
        apiClient,
        seedData,
        backend,
        fileName,
        content,
        taskTitle: "Markdown exact source",
      });
      await openFile(session, testPage, fileName);
      const editor = testPage.getByTestId("markdown-file-editor");
      await editor.getByTestId("markdown-mode-edit").click();
      const hybrid = editor.getByTestId("hybrid-markdown-editor");
      const paragraph = hybrid.locator(".md-paragraph", {
        hasText: "paragraph stays unchanged.",
      });
      await clickAfterText(testPage, paragraph, "Target");
      await editor.getByTestId("markdown-mode-preview").click();
      await editor.getByTestId("markdown-mode-source").click();
      await editor.getByTestId("markdown-mode-edit").click();
      await expect(editor.getByTestId("markdown-file-save")).toBeDisabled();
      expect(fs.readFileSync(filePath, "utf8")).toBe(content);
      await clickAfterText(testPage, paragraph, "Target");
      await testPage.keyboard.insertText("!");
      await expect(paragraph).toContainText("Target! paragraph stays unchanged.");
      const modifier = process.platform === "darwin" ? "Meta" : "Control";
      await testPage.keyboard.press(`${modifier}+z`);
      await expect(paragraph).toContainText("Target paragraph stays unchanged.");
      await expect(editor.getByTestId("markdown-file-save")).toBeDisabled();
      await testPage.keyboard.press(`${modifier}+Shift+z`);
      await expect(paragraph).toContainText("Target! paragraph stays unchanged.");
      await editor.getByTestId("markdown-mode-preview").click();
      const saved = gateway.waitForResponse("workspace.file.update");
      await editor.getByTestId("markdown-file-save").click();
      await saved;
      expect(fs.readFileSync(filePath, "utf8")).toBe(
        content.replace("Target paragraph", "Target! paragraph"),
      );
    });
  }

  // @covers AC-UI-MARKDOWN-FILE-EDITING-002.13
  test("review regression: repository comments retain secondary identity from editable selection", async ({
    testPage,
    apiClient,
    seedData,
    backend,
  }) => {
    const secondaryName = "markdown-comments-secondary";
    const repoDir = path.join(backend.tmpDir, "repos", secondaryName);
    fs.mkdirSync(repoDir, { recursive: true });
    const gitEnv = makeGitEnv(backend.tmpDir);
    const primaryGit = new GitHelper(path.join(backend.tmpDir, "repos", "e2e-repo"), gitEnv);
    const primarySha = primaryGit.getCurrentSha();
    restoreMarkdownRepository = () => primaryGit.exec(`git reset --hard ${primarySha}`);
    primaryGit.createFile("README.md", "# Primary repository\n\nA separate README document.\n");
    primaryGit.stageAll();
    primaryGit.commit("seed primary Markdown");
    execFileSync("git", ["init", "-b", "main"], { cwd: repoDir, env: gitEnv });
    const git = new GitHelper(repoDir, gitEnv);
    const content = "# Secondary repository\n\nSelect this paragraph to comment.\n";
    git.createFile("README.md", content);
    git.stageAll();
    git.commit("seed secondary Markdown");
    const repository = await apiClient.createRepository(seedData.workspaceId, repoDir, "main", {
      name: secondaryName,
      pull_before_worktree: false,
    });
    let task: { id: string; session_id: string } | undefined;
    try {
      task = await apiClient.createTaskWithAgent(
        seedData.workspaceId,
        "Markdown repository comments",
        seedData.agentProfileId,
        {
          description: "/e2e:simple-message",
          workflow_id: seedData.workflowId,
          workflow_step_id: seedData.startStepId,
          repository_ids: [seedData.repositoryId, repository.id],
          executor_profile_id: seedData.worktreeExecutorProfileId,
        },
      );
      await testPage.goto(`/t/${task.id}`);
      const session = new SessionPage(testPage);
      await session.waitForLoad();
      await session.waitForChatIdle({ timeout: 45_000 });
      const environment = await apiClient.getTaskEnvironment(task.id);
      const secondaryPath = environment?.repos?.find(
        (entry) => entry.repository_id === repository.id,
      )?.worktree_path;
      const primaryPath = environment?.repos?.find(
        (entry) => entry.repository_id === seedData.repositoryId,
      )?.worktree_path;
      expect(secondaryPath).toBeTruthy();
      expect(primaryPath).toBeTruthy();
      expect(environment?.workspace_path).toBeTruthy();
      const primaryRoot = path.relative(environment!.workspace_path!, primaryPath!);
      const workingFilePath = path.join(secondaryPath!, "README.md");
      expect(fs.readFileSync(workingFilePath, "utf8")).toBe(content);
      await session.clickTab("Files");
      await (await session.fileTree.waitForFileTreeNode(secondaryName)).click();
      await (await session.fileTree.waitForFileTreeNode(`${secondaryName}/README.md`)).dblclick();
      const editor = testPage.locator('[data-testid="markdown-file-editor"]:visible');
      await editor.getByTestId("markdown-mode-edit").click();
      const hybrid = editor.getByTestId("hybrid-markdown-editor");
      await hybrid.locator(".md-paragraph").first().click();
      await testPage.keyboard.press("Home");
      await testPage.keyboard.press("Shift+End");
      const commentTrigger = testPage.getByTestId("hybrid-markdown-comment-trigger");
      await expect(commentTrigger).toBeVisible();
      await commentTrigger.click();
      const marker = "Review this secondary repository paragraph";
      await testPage.getByPlaceholder("Add your comment or instruction...").fill(marker);
      await testPage.keyboard.press(process.platform === "darwin" ? "Meta+Enter" : "Control+Enter");
      await expect
        .poll(() =>
          testPage.evaluate(
            ({ sessionId, text }) => {
              const comments = JSON.parse(
                sessionStorage.getItem(`kandev.comments.${sessionId}`) ?? "[]",
              );
              return comments.find((comment: { text: string }) => comment.text === text);
            },
            { sessionId: task!.session_id, text: marker },
          ),
        )
        .toMatchObject({
          source: "diff",
          repositoryName: secondaryName,
          filePath: "README.md",
          text: marker,
          status: "pending",
        });
      await expect(hybrid).toContainText(marker);
      await expect(editor.getByTestId("markdown-file-save")).toBeDisabled();
      expect(fs.readFileSync(path.join(repoDir, "README.md"), "utf8")).toBe(content);
      expect(fs.readFileSync(workingFilePath, "utf8")).toBe(content);
      await session.clickTab("Files");
      if (primaryRoot) await (await session.fileTree.waitForFileTreeNode(primaryRoot)).click();
      await (
        await session.fileTree.waitForFileTreeNode(path.posix.join(primaryRoot, "README.md"))
      ).dblclick();
      await editor.getByTestId("markdown-mode-edit").click();
      await expect(hybrid).not.toContainText(marker);
      await session.clickTab("Files");
      await (await session.fileTree.waitForFileTreeNode(`${secondaryName}/README.md`)).dblclick();
      await expect(hybrid).toContainText(marker);
    } finally {
      if (task) {
        if (!testPage.isClosed()) {
          await testPage.evaluate(
            (sessionId) => sessionStorage.removeItem(`kandev.comments.${sessionId}`),
            task.session_id,
          );
        }
        await apiClient.deleteTask(task.id, { cascade: true, discardWorktreeChanges: true });
      }
      await apiClient.deleteRepository(repository.id);
    }
  });

  // @covers AC-UI-MARKDOWN-FILE-EDITING-002.15
  test("review regression: hybrid recovery retries a failed instance with the unsaved source", async ({
    testPage,
    apiClient,
    seedData,
    backend,
  }) => {
    await testPage.addInitScript(() => {
      const nativeEditContext = Reflect.get(window, "EditContext");
      let attempts = 0;
      Reflect.set(
        window,
        "EditContext",
        new Proxy(nativeEditContext, {
          construct(target, args, newTarget) {
            if (document.querySelector('[data-testid="hybrid-markdown-editor"]')) {
              attempts += 1;
              if (attempts === 1) throw new Error("Expected Markdown initialization failure");
            }
            return Reflect.construct(target, args, newTarget);
          },
        }),
      );
    });
    const fileName = `markdown-retry-${Date.now()}.md`;
    const content = "# Retry preserves source\n\nOriginal paragraph.\n";
    const draft = `${content}\nUnsaved recovery marker`;
    const { session, filePath, gateway } = await seedMarkdownSession({
      testPage,
      apiClient,
      seedData,
      backend,
      fileName,
      content,
      taskTitle: "Markdown retry",
    });
    await openFile(session, testPage, fileName);
    const editor = testPage.getByTestId("markdown-file-editor");
    await editor.getByTestId("markdown-mode-source").click();
    const source = testPage.getByRole("textbox", { name: "Editor content" });
    await expect(source).toBeAttached();
    await source.focus();
    await testPage.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await testPage.keyboard.insertText(draft);
    await editor.getByTestId("markdown-mode-edit").click();
    await expect(editor.getByTestId("markdown-mode-source")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await editor.getByTestId("markdown-mode-edit").click();
    const hybrid = editor.getByTestId("hybrid-markdown-editor");
    await expect(hybrid).toBeVisible();
    await expect(hybrid).toContainText("Unsaved recovery marker");
    const saved = gateway.waitForResponse("workspace.file.update");
    await editor.getByTestId("markdown-file-save").click();
    await saved;
    expect(fs.readFileSync(filePath, "utf8")).toBe(draft);
  });

  // @covers AC-UI-MARKDOWN-FILE-EDITING-001.10
  test("review regression: hybrid recovery keeps Source usable without EditContext", async ({
    testPage,
    apiClient,
    seedData,
    backend,
  }) => {
    await testPage.addInitScript(() => Reflect.deleteProperty(window, "EditContext"));
    const fileName = `markdown-capability-${Date.now()}.md`;
    const content = "# Source fallback\n\nExact content.\n";
    const { session, filePath, gateway } = await seedMarkdownSession({
      testPage,
      apiClient,
      seedData,
      backend,
      fileName,
      content,
      taskTitle: "Markdown browser fallback",
    });
    await openFile(session, testPage, fileName);
    const editor = testPage.getByTestId("markdown-file-editor");
    await expect(editor.getByTestId("markdown-mode-edit")).toBeDisabled();
    await editor.getByTestId("markdown-mode-source").click();
    const source = testPage.getByRole("textbox", { name: "Editor content" });
    await expect(source).toBeAttached();
    await source.focus();
    await testPage.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    const edited = `${content}\nSaved without hybrid editing.`;
    await testPage.keyboard.insertText(edited);
    const saved = gateway.waitForResponse("workspace.file.update");
    await testPage.keyboard.press(process.platform === "darwin" ? "Meta+s" : "Control+s");
    await saved;
    expect(fs.readFileSync(filePath, "utf8")).toBe(edited);
    await expect(editor.getByTestId("hybrid-markdown-editor")).toHaveCount(0);
  });

  test("opens in Preview, edits the rendered hybrid buffer, saves, and restores Edit mode", async ({
    testPage,
    apiClient,
    seedData,
    backend,
    prCapture,
  }) => {
    const fileName = `markdown-lifecycle-${Date.now()}.md`;
    const marker = `saved markdown marker ${Date.now()}`;
    const { session, filePath, sessionId, gateway } = await seedMarkdownSession({
      testPage,
      apiClient,
      seedData,
      backend,
      fileName,
      content: MARKDOWN_CONTENT,
      taskTitle: "Markdown lifecycle",
    });

    await openFile(session, testPage, fileName);
    const editor = testPage.getByTestId("markdown-file-editor");
    const preview = testPage.getByTestId("markdown-preview");
    await expect(editor.getByTestId("markdown-mode-preview")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(preview.locator("h1")).toHaveText("Markdown lifecycle");
    await expectSingleCompactToolbar(testPage);
    const previewMetrics = await presentationMetrics(testPage, "preview");

    await editor.getByTestId("markdown-mode-edit").click();
    await expect(testPage.getByTestId("hybrid-markdown-editor")).toBeVisible({ timeout: 15_000 });
    await expectSingleCompactToolbar(testPage);
    const editMetrics = await presentationMetrics(testPage, "edit");
    expect(editMetrics.heading).toEqual(previewMetrics.heading);
    expect(editMetrics.blockquote).toEqual(previewMetrics.blockquote);
    expect(editMetrics.code).toEqual(previewMetrics.code);
    await editExistingHybridParagraph(testPage);
    await appendToHybrid(testPage, marker);

    const lightPalette = await hybridPalette(testPage);
    expect(lightPalette.editorColor).not.toBe(lightPalette.codeBackground);
    expect(lightPalette.activeBackground).not.toBe("");
    await testPage.evaluate(() => document.documentElement.classList.add("dark"));
    await expect.poll(() => hybridPalette(testPage), { timeout: 5_000 }).not.toEqual(lightPalette);
    const darkPalette = await hybridPalette(testPage);
    expect(darkPalette.editorColor).not.toBe(darkPalette.codeBackground);
    expect(darkPalette.editorBackground).not.toBe(lightPalette.editorBackground);
    expect(darkPalette.codeBackground).not.toBe(lightPalette.codeBackground);

    const saveButton = editor.getByTestId("markdown-file-save");
    await expect(saveButton).toContainText(/Save\s*\((?:Ctrl|⌘)\+S\)/);
    await expect(saveButton).toBeEnabled();
    const saved = gateway.waitForResponse("workspace.file.update");
    await saveButton.click();
    await saved;
    expect(fs.readFileSync(filePath, "utf8")).toBe(
      `${MARKDOWN_CONTENT.replace(
        "This paragraph stays in the canonical source.",
        "This paragraph stays in the canonical! source.",
      )}\n\n${marker}`,
    );
    expect(fs.readFileSync(filePath, "utf8")).toContain(UNSUPPORTED_MARKDOWN_SOURCE);
    await expect(saveButton).toBeDisabled();

    await editor.getByTestId("markdown-mode-preview").click();
    await expect(preview).toContainText(marker);
    const previewScroll = preview.getByTestId("markdown-preview-scroll-container");
    const previewScrollTop = await previewScroll.evaluate((element) => {
      const scroller = element as HTMLElement;
      scroller.scrollTop = scroller.scrollHeight;
      return scroller.scrollTop;
    });
    expect(previewScrollTop).toBeGreaterThan(0);
    await prCapture.screenshot("desktop-markdown-preview", {
      caption: "Desktop Markdown Preview with the saved source change",
    });
    await editor.getByTestId("markdown-mode-edit").click();
    await editor.getByTestId("markdown-mode-preview").click();
    await expect(preview.getByText(marker, { exact: true })).toBeInViewport();
    await editor.getByTestId("markdown-mode-edit").click();
    await expect(testPage.getByTestId("hybrid-markdown-editor")).toBeVisible({ timeout: 15_000 });

    const storedTabs = await testPage.evaluate((sid) => {
      const raw = window.sessionStorage.getItem(`kandev.openFiles.${sid}`);
      return raw ? (JSON.parse(raw) as Array<{ path: string; markdownMode?: string }>) : [];
    }, sessionId);
    const storedTab = storedTabs.find((tab) => tab.path.endsWith(fileName));
    expect(storedTab?.markdownMode).toBe("edit");

    await testPage.reload();
    await expect(testPage.getByTestId("markdown-file-editor")).toBeVisible({ timeout: 30_000 });
    await expect(testPage.getByTestId("markdown-mode-edit")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(testPage.getByTestId("hybrid-markdown-editor")).toBeVisible({ timeout: 15_000 });
  });

  test("keeps normal block editing single, exposes heading markers, and creates blocks with Enter", async ({
    testPage,
    apiClient,
    seedData,
    backend,
  }) => {
    const fileName = `markdown-block-input-${Date.now()}.md`;
    const { session } = await seedMarkdownSession({
      testPage,
      apiClient,
      seedData,
      backend,
      fileName,
      content: `# Direction\n\n${LONG_EDIT_PARAGRAPH}\n\n#### Existing subheader\n`,
      taskTitle: "Markdown block input",
    });

    await openFile(session, testPage, fileName);
    const editor = testPage.getByTestId("markdown-file-editor");
    await editor.getByTestId("markdown-mode-source").click();
    const sourceInput = testPage.getByRole("textbox", { name: "Editor content" });
    await expect(sourceInput).toBeAttached({ timeout: 15_000 });
    await sourceInput.focus();
    await testPage.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await testPage.keyboard.insertText(
      `# Direction\n\n${LONG_EDIT_PARAGRAPH.replace("quiet", "quiet!abcde")}\n\n#### Existing subheader\n`,
    );
    await editor.getByTestId("markdown-mode-edit").click();
    const hybrid = testPage.getByTestId("hybrid-markdown-editor");
    const paragraph = hybrid.locator(".md-paragraph", {
      hasText: "The shell is dense and quiet!abcde",
    });
    await clickAfterText(testPage, paragraph, "quiet!abcde");
    await testPage.keyboard.type("z");
    await expect(
      hybrid.locator(":is(.md-ws-newline-glyph, .md-ws-blockbreak-glyph):visible"),
    ).toHaveCount(0);

    const repeatedPrefixCount = await hybrid.evaluate((element) => {
      const prefix = "Kandev should read as a restrained developer workbench.";
      return element.textContent?.split(prefix).length - 1;
    });
    expect(repeatedPrefixCount).toBe(1);

    const subheader = hybrid.locator("h4.md-heading", { hasText: "Existing subheader" });
    await subheader.click();
    const marker = subheader.locator(".md-marker-headingMarker");
    const [rootBox, markerBox] = await Promise.all([hybrid.boundingBox(), marker.boundingBox()]);
    expect(rootBox).not.toBeNull();
    expect(markerBox).not.toBeNull();
    expect(markerBox!.x).toBeGreaterThanOrEqual(rootBox!.x);

    const editedParagraph = hybrid.locator(".md-paragraph", {
      hasText: "The shell is dense and quiet!abcdez",
    });
    await clickAfterText(testPage, editedParagraph, "quiet!abcdez");
    await testPage.keyboard.press("Enter");
    await testPage.keyboard.type("A new block created with Enter. ");

    await expect(
      hybrid.locator(".md-paragraph", { hasText: "A new block created with Enter." }),
    ).toHaveCount(1);
  });

  test("highlights fenced code and edits bordered tables with source-preserving controls", async ({
    testPage,
    apiClient,
    seedData,
    backend,
  }) => {
    const fileName = `markdown-table-controls-${Date.now()}.md`;
    const content = `# Code and table

\`\`\`ts
const ready = true;
\`\`\`

| Area | State |
| --- | --- |
| Preview | Ready |
`;
    const { session, filePath, gateway } = await seedMarkdownSession({
      testPage,
      apiClient,
      seedData,
      backend,
      fileName,
      content,
      taskTitle: "Markdown table controls",
    });

    await openFile(session, testPage, fileName);
    const editor = testPage.getByTestId("markdown-file-editor");
    const preview = testPage.getByTestId("markdown-preview");
    const previewScroll = preview.getByTestId("markdown-preview-scroll-container");
    const previewCell = preview.locator("td").first();
    await expect(previewCell).toBeVisible();
    expect(await previewCell.evaluate((cell) => getComputedStyle(cell).borderTopWidth)).toBe("1px");
    expect(
      await previewScroll.evaluate((element) => {
        const styles = getComputedStyle(element);
        return { left: styles.paddingLeft, right: styles.paddingRight };
      }),
    ).toEqual({ left: "16px", right: "16px" });

    await editor.getByTestId("markdown-mode-edit").click();
    const hybrid = testPage.getByTestId("hybrid-markdown-editor");
    const keyword = hybrid.locator(".md-code-block .tok-keyword", { hasText: "const" });
    await expect(keyword).toBeVisible({ timeout: 15_000 });
    await keyword.click();
    await expect(hybrid.locator(".md-code-block")).toHaveClass(/md-block-active/);
    await expect(keyword).toBeVisible();
    const table = hybrid.locator(".md-table");
    const firstCell = table.locator("tr:not(.md-table-delimiter-row) td").filter({
      hasText: "Preview",
    });
    await firstCell.click();
    await expect(table).toHaveClass(/md-block-active/);
    expect(await table.evaluate((element) => getComputedStyle(element).borderRadius)).toBe("2px");
    expect(
      await table
        .locator("td")
        .first()
        .evaluate((cell) => getComputedStyle(cell).borderTopWidth),
    ).toBe("1px");

    await expect(table.locator(".md-table-delimiter-row")).toBeHidden();
    await expect(table.locator(".md-glue-tableCellGlue:visible")).toHaveCount(0);
    const [headerBackground, bodyBackground] = await Promise.all([
      table
        .locator("tr")
        .first()
        .locator("td")
        .first()
        .evaluate((cell) => {
          return getComputedStyle(cell).backgroundColor;
        }),
      firstCell.evaluate((cell) => getComputedStyle(cell).backgroundColor),
    ]);
    expect(bodyBackground).not.toBe("rgba(0, 0, 0, 0)");
    expect(headerBackground).not.toBe(bodyBackground);
    const rowAction = hybrid.getByTestId("markdown-table-row-insert-0");
    const columnAction = hybrid.getByTestId("markdown-table-column-insert-1");
    const rowGuide = hybrid.getByTestId("markdown-table-row-guide-0");
    const columnGuide = hybrid.getByTestId("markdown-table-column-guide-1");
    await expect(rowAction).toBeVisible();
    await expect(columnAction).toBeVisible();
    await expect(columnAction.locator("svg")).toHaveCount(1);
    const [tableBox, rowActionBox, columnActionBox] = await Promise.all([
      table.boundingBox(),
      rowAction.boundingBox(),
      columnAction.boundingBox(),
    ]);
    expect(tableBox).not.toBeNull();
    expect(rowActionBox).not.toBeNull();
    expect(columnActionBox).not.toBeNull();
    expect(rowActionBox!.x + rowActionBox!.width).toBeLessThanOrEqual(tableBox!.x);
    expect(columnActionBox!.y + columnActionBox!.height).toBeLessThanOrEqual(tableBox!.y);
    expect(tableBox!.y - (columnActionBox!.y + columnActionBox!.height)).toBeLessThanOrEqual(16);

    await testPage.mouse.move(2, 2);
    expect(await rowGuide.evaluate((element) => getComputedStyle(element).opacity)).toBe("0");
    expect(await columnGuide.evaluate((element) => getComputedStyle(element).opacity)).toBe("0");
    const fineAffordance = await columnAction.evaluate((element) => {
      const icon = element.querySelector("svg");
      return {
        dotContent: getComputedStyle(element, "::before").content,
        dotOpacity: getComputedStyle(element, "::before").opacity,
        iconOpacity: icon ? getComputedStyle(icon).opacity : "",
        opacity: getComputedStyle(element).opacity,
      };
    });
    expect(fineAffordance.opacity).toBe("1");
    expect(fineAffordance.dotContent).not.toBe("none");
    expect(fineAffordance.dotOpacity).toBe("1");
    expect(fineAffordance.iconOpacity).toBe("0");
    await columnAction.hover();
    await expect
      .poll(() =>
        columnAction.evaluate((element) => {
          const icon = element.querySelector("svg");
          return icon ? getComputedStyle(icon).opacity : "";
        }),
      )
      .toBe("1");
    await expect
      .poll(() => columnGuide.evaluate((element) => getComputedStyle(element).opacity))
      .toBe("1");
    const [columnGuideBox, currentTableBox, currentLastHeaderCellBox] = await Promise.all([
      columnGuide.boundingBox(),
      table.boundingBox(),
      table.locator("tr").first().locator("td").last().boundingBox(),
    ]);
    expect(columnGuideBox).not.toBeNull();
    expect(currentTableBox).not.toBeNull();
    expect(currentLastHeaderCellBox).not.toBeNull();
    expect(columnGuideBox!.x + columnGuideBox!.width / 2).toBeCloseTo(
      currentLastHeaderCellBox!.x + currentLastHeaderCellBox!.width,
      0,
    );
    expect(columnGuideBox!.y).toBeLessThanOrEqual(columnActionBox!.y + columnActionBox!.height / 2);
    expect(columnGuideBox!.y + columnGuideBox!.height).toBeGreaterThanOrEqual(
      currentTableBox!.y + currentTableBox!.height,
    );

    await testPage.mouse.move(2, 2);
    await rowAction.hover();
    await expect
      .poll(() => rowGuide.evaluate((element) => getComputedStyle(element).opacity))
      .toBe("1");
    const [rowGuideBox, currentHeaderRowBox, currentRowTableBox] = await Promise.all([
      rowGuide.boundingBox(),
      table.locator("tr").first().boundingBox(),
      table.boundingBox(),
    ]);
    expect(rowGuideBox).not.toBeNull();
    expect(currentHeaderRowBox).not.toBeNull();
    expect(currentRowTableBox).not.toBeNull();
    expect(rowGuideBox!.y + rowGuideBox!.height / 2).toBeCloseTo(
      currentHeaderRowBox!.y + currentHeaderRowBox!.height,
      0,
    );
    expect(rowGuideBox!.x).toBeLessThanOrEqual(rowActionBox!.x + rowActionBox!.width / 2);
    expect(rowGuideBox!.x + rowGuideBox!.width).toBeGreaterThanOrEqual(
      currentRowTableBox!.x + currentRowTableBox!.width,
    );

    await clickAfterText(testPage, firstCell, "Preview");
    await testPage.keyboard.insertText("!");
    await expect(firstCell).toContainText("Preview!");

    const resizer = hybrid.getByTestId("markdown-table-resizer-0");
    await expect(resizer).toHaveAttribute("role", "separator");
    await resizer.focus();
    await testPage.keyboard.press("ArrowRight");
    await expect(hybrid.locator("colgroup")).toHaveCount(1);
    const resizerBox = await resizer.boundingBox();
    expect(resizerBox).not.toBeNull();
    expect(resizerBox!.y + resizerBox!.height).toBeLessThanOrEqual(tableBox!.y);
    const resizerCenterY = resizerBox!.y + resizerBox!.height / 2;
    await testPage.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerCenterY);
    await testPage.mouse.down();
    await testPage.mouse.move(resizerBox!.x + resizerBox!.width / 2 + 16, resizerCenterY);
    await testPage.mouse.up();

    const resizedWidth = await hybrid.locator("colgroup col").first().getAttribute("style");
    await editor.getByTestId("markdown-mode-preview").click();
    await expect(testPage.getByTestId("markdown-preview")).toBeVisible();
    await editor.getByTestId("markdown-mode-edit").click();
    await expect(hybrid).toBeVisible();
    await expect
      .poll(() => hybrid.locator("colgroup col").first().getAttribute("style"))
      .toBe(resizedWidth);

    await columnAction.click();
    await rowAction.click();
    const saved = gateway.waitForResponse("workspace.file.update");
    await editor.getByTestId("markdown-file-save").click();
    await saved;
    expect(fs.readFileSync(filePath, "utf8")).toBe(
      content.replace(
        "| Area | State |\n| --- | --- |\n| Preview | Ready |\n",
        "| Area | State |  |\n| --- | --- | --- |\n|  |  |  |\n| Preview! | Ready |  |\n",
      ),
    );
  });

  test("keeps MDX on the safe Preview and exact Source paths", async ({
    testPage,
    apiClient,
    seedData,
    backend,
  }) => {
    const fileName = `markdown-components-${Date.now()}.mdx`;
    const { session } = await seedMarkdownSession({
      testPage,
      apiClient,
      seedData,
      backend,
      fileName,
      content: "# MDX content\n\n<Component />",
      taskTitle: "Markdown MDX modes",
    });

    await openFile(session, testPage, fileName);
    const editor = testPage.getByTestId("markdown-file-editor");
    await expect(editor.getByTestId("markdown-mode-preview")).toBeVisible();
    await expect(editor.getByTestId("markdown-mode-source")).toBeVisible();
    await expect(editor.getByTestId("markdown-mode-edit")).toHaveCount(0);
    await editor.getByTestId("markdown-mode-source").click();
    await expect(testPage.locator(".monaco-editor:visible").first()).toBeVisible({
      timeout: 15_000,
    });
    await expectSingleCompactToolbar(testPage);
    await expect(testPage.getByTestId("hybrid-markdown-editor")).toHaveCount(0);
  });
});
