import { beforeEach, describe, expect, it, vi } from "vitest";
import PageFlowPlugin from "../src/main";
import { App } from "obsidian";

describe("PageFlowPlugin main commands", () => {
  let app: App;
  let plugin: PageFlowPlugin;
  let registeredCommands: Record<string, any> = {};

  beforeEach(() => {
    app = new App();
    registeredCommands = {};

    plugin = new PageFlowPlugin(app, {
      id: "page-flow",
      name: "Page Flow",
      version: "0.1.2",
      minAppVersion: "1.13.0",
      description: "Test plugin",
      author: "Test",
    } as any);

    plugin.addCommand = vi.fn().mockImplementation((cmd: any) => {
      registeredCommands[cmd.id] = cmd;
      return cmd;
    });
  });

  it("registers show-file-explorer command on load", async () => {
    await plugin.onload();

    expect(registeredCommands["show-file-explorer"]).toBeDefined();
    expect(registeredCommands["show-file-explorer"].name).toContain("file explorer");
  });

  it("calls revealLeaf and setActiveLeaf when show-file-explorer is invoked", async () => {
    const mockLeaf = { id: "leaf-1" };
    app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

    await plugin.onload();

    const cmd = registeredCommands["show-file-explorer"];
    expect(cmd).toBeDefined();

    cmd.callback();

    expect(app.workspace.getLeavesOfType).toHaveBeenCalledWith("file-explorer");
    expect(app.workspace.revealLeaf).toHaveBeenCalledWith(mockLeaf);
    expect(app.workspace.setActiveLeaf).toHaveBeenCalledWith(mockLeaf, { focus: true });
  });

  it("safely does nothing if no file-explorer leaf exists", async () => {
    app.workspace.getLeavesOfType = vi.fn().mockReturnValue([]);

    await plugin.onload();

    const cmd = registeredCommands["show-file-explorer"];
    expect(cmd).toBeDefined();

    expect(() => cmd.callback()).not.toThrow();
    expect(app.workspace.revealLeaf).not.toHaveBeenCalled();
    expect(app.workspace.setActiveLeaf).not.toHaveBeenCalled();
  });
});
