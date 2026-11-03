import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useClearSign } from "../../src/useClearSign.js";
import * as core from "@clearsign/core";

vi.mock("@clearsign/core", () => ({
  buildPreview: vi.fn(),
}));

describe("useClearSign", () => {
  it("manages modal open state and requests approval", async () => {
    const mockPreview = { risk: "ok" };
    vi.mocked(core.buildPreview).mockResolvedValue(mockPreview as never);

    const { result } = renderHook(() =>
      useClearSign({ rpcUrl: "http://localhost", networkPassphrase: "test" }),
    );

    expect(result.current.open).toBe(false);

    let approved: boolean | undefined;

    act(() => {
      result.current.requestApproval("xdr").then((res) => {
        approved = res;
      });
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.open).toBe(true);
      expect(result.current.preview).toEqual(mockPreview);
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.onApprove();
    });

    expect(result.current.open).toBe(false);

    await waitFor(() => {
      expect(approved).toBe(true);
    });
  });

  it("resolves false on reject", async () => {
    vi.mocked(core.buildPreview).mockResolvedValue({ risk: "ok" } as never);
    const { result } = renderHook(() =>
      useClearSign({ rpcUrl: "http://localhost", networkPassphrase: "test" }),
    );

    let approved: boolean | undefined;
    act(() => {
      result.current.requestApproval("xdr").then((res) => {
        approved = res;
      });
    });

    await waitFor(() => {
      expect(result.current.open).toBe(true);
    });

    act(() => {
      result.current.onReject();
    });

    await waitFor(() => {
      expect(approved).toBe(false);
    });
  });

  it("fails closed when buildPreview throws", async () => {
    vi.mocked(core.buildPreview).mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() =>
      useClearSign({ rpcUrl: "http://localhost", networkPassphrase: "test" }),
    );

    let approved: boolean | undefined;
    await act(async () => {
      approved = await result.current.requestApproval("xdr");
    });

    expect(approved).toBe(false);
    expect(result.current.open).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.preview).toBeNull();
  });

  it("rejects a pending request when a newer one supersedes it", async () => {
    vi.mocked(core.buildPreview).mockResolvedValue({ risk: "ok" } as never);
    const { result } = renderHook(() =>
      useClearSign({ rpcUrl: "http://localhost", networkPassphrase: "test" }),
    );

    let first: boolean | undefined;
    let second: boolean | undefined;
    act(() => {
      result.current.requestApproval("xdr-1").then((res) => {
        first = res;
      });
    });
    await waitFor(() => expect(result.current.preview).not.toBeNull());

    act(() => {
      result.current.requestApproval("xdr-2").then((res) => {
        second = res;
      });
    });
    await waitFor(() => expect(first).toBe(false));
    await waitFor(() => expect(result.current.preview).not.toBeNull());

    act(() => {
      result.current.onApprove();
    });
    await waitFor(() => expect(second).toBe(true));
  });

  it("ignores a stale preview that resolves after a newer request", async () => {
    let releaseFirst!: (value: core.ClearSignPreview) => void;
    vi.mocked(core.buildPreview)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({ risk: "ok", tag: "second" } as never);
    const { result } = renderHook(() =>
      useClearSign({ rpcUrl: "http://localhost", networkPassphrase: "test" }),
    );

    let first: boolean | undefined;
    act(() => {
      result.current.requestApproval("xdr-1").then((res) => {
        first = res;
      });
    });
    act(() => {
      result.current.requestApproval("xdr-2");
    });
    await waitFor(() =>
      expect(result.current.preview).toEqual({ risk: "ok", tag: "second" }),
    );

    await act(async () => {
      releaseFirst({
        risk: "ok",
        tag: "first",
      } as unknown as core.ClearSignPreview);
    });

    expect(result.current.preview).toEqual({ risk: "ok", tag: "second" });
    expect(first).toBe(false);
  });

  it.each(["blocked", "unknown"])(
    "refuses to approve a %s preview",
    async (risk) => {
      vi.mocked(core.buildPreview).mockResolvedValue({ risk } as never);
      const { result } = renderHook(() =>
        useClearSign({ rpcUrl: "http://localhost", networkPassphrase: "test" }),
      );

      let approved: boolean | undefined;
      act(() => {
        result.current.requestApproval("xdr").then((res) => {
          approved = res;
        });
      });
      await waitFor(() => expect(result.current.preview).not.toBeNull());

      act(() => {
        result.current.onApprove();
      });

      await waitFor(() => expect(approved).toBe(false));
      expect(result.current.open).toBe(false);
    },
  );

  it("ignores onApprove while the preview is still loading", async () => {
    vi.mocked(core.buildPreview).mockImplementation(
      () => new Promise(() => {}),
    );
    const { result } = renderHook(() =>
      useClearSign({ rpcUrl: "http://localhost", networkPassphrase: "test" }),
    );

    let settled = false;
    act(() => {
      result.current.requestApproval("xdr").then(() => {
        settled = true;
      });
    });
    act(() => {
      result.current.onApprove();
    });

    expect(settled).toBe(false);
    expect(result.current.open).toBe(true);
  });

  it("resolves a pending request as rejected when unmounted", async () => {
    vi.mocked(core.buildPreview).mockResolvedValue({ risk: "ok" } as never);
    const { result, unmount } = renderHook(() =>
      useClearSign({ rpcUrl: "http://localhost", networkPassphrase: "test" }),
    );

    let approved: boolean | undefined;
    act(() => {
      result.current.requestApproval("xdr").then((res) => {
        approved = res;
      });
    });
    await waitFor(() => expect(result.current.open).toBe(true));

    unmount();

    await waitFor(() => expect(approved).toBe(false));
  });
});
