/**
 * Tests for the Preview/Code toggle tabs in MainContent.
 * These tests isolate the Tabs toggle mechanism to verify that
 * clicking between Preview and Code tabs correctly switches the active view.
 */
import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

afterEach(() => {
  cleanup();
});

/**
 * Minimal reproduction of the toggle in main-content.tsx:
 *   <Tabs value={activeView} onValueChange={setActiveView}>
 *     <TabsList>
 *       <TabsTrigger value="preview">Preview</TabsTrigger>
 *       <TabsTrigger value="code">Code</TabsTrigger>
 *     </TabsList>
 *   </Tabs>
 *   {activeView === "preview" ? <PreviewArea /> : <CodeArea />}
 */
function ToggleHarness() {
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");
  return (
    <>
      <Tabs
        value={activeView}
        onValueChange={(v) => setActiveView(v as "preview" | "code")}
      >
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
      </Tabs>
      <div data-testid="active-view">{activeView}</div>
    </>
  );
}

test("defaults to preview tab", () => {
  render(<ToggleHarness />);
  expect(screen.getByTestId("active-view").textContent).toBe("preview");
});

test("clicking Code tab switches to code view", async () => {
  const user = userEvent.setup();
  render(<ToggleHarness />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  expect(screen.getByTestId("active-view").textContent).toBe("code");
});

test("clicking Preview tab after Code switches back to preview view", async () => {
  const user = userEvent.setup();
  render(<ToggleHarness />);

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("active-view").textContent).toBe("code");

  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(screen.getByTestId("active-view").textContent).toBe("preview");
});

test("toggle can alternate multiple times", async () => {
  const user = userEvent.setup();
  render(<ToggleHarness />);

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("active-view").textContent).toBe("code");

  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(screen.getByTestId("active-view").textContent).toBe("preview");

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("active-view").textContent).toBe("code");
});

test("active tab has correct aria-selected attribute", async () => {
  const user = userEvent.setup();
  render(<ToggleHarness />);

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  const codeTab = screen.getByRole("tab", { name: "Code" });

  expect(previewTab).toHaveAttribute("aria-selected", "true");
  expect(codeTab).toHaveAttribute("aria-selected", "false");

  await user.click(codeTab);

  expect(previewTab).toHaveAttribute("aria-selected", "false");
  expect(codeTab).toHaveAttribute("aria-selected", "true");
});
