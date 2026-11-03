import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useClearSign } from "../../src/useClearSign.js";
import {
  ClearSignRejectedError,
  WalletSigningError,
  type SignerAdapter,
} from "../../src/types/signer.js";
import { freighterAdapter } from "../../src/adapters/freighter.js";
import { stellarWalletsKitAdapter } from "../../src/adapters/stellar-wallets-kit.js";
import * as core from "@clearsign/core";

vi.mock("@clearsign/core", () => ({
  buildPreview: vi.fn(),
}));

describe("SignerAdapter & useClearSign integration", () => {
  const mockRpcUrl = "https://soroban-testnet.stellar.org";
  const mockPassphrase = "Test SDF Network ; September 2015";
  const mockXdr = "AAAAAgAAAAB...";
  const signedResultXdr = "AAAAAgAAAAB_SIGNED...";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls adapter.signTransaction when transaction is approved", async () => {
    vi.mocked(core.buildPreview).mockResolvedValue({
      risk: "ok",
      invocations: [],
    } as never);

    const mockAdapter: SignerAdapter = {
      getAddress: vi
        .fn()
        .mockResolvedValue(
          "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        ),
      signTransaction: vi.fn().mockResolvedValue(signedResultXdr),
    };

    const { result } = renderHook(() =>
      useClearSign({
        rpcUrl: mockRpcUrl,
        networkPassphrase: mockPassphrase,
        adapter: mockAdapter,
      }),
    );

    let signPromise: Promise<string> | undefined;
    act(() => {
      signPromise = result.current.signTransaction(mockXdr);
    });

    await waitFor(() => {
      expect(result.current.open).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.onApprove();
    });

    const res = await signPromise;
    expect(res).toBe(signedResultXdr);
    expect(result.current.signedXdr).toBe(signedResultXdr);
    expect(result.current.isSigning).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockAdapter.signTransaction).toHaveBeenCalledTimes(1);
    expect(mockAdapter.signTransaction).toHaveBeenCalledWith(mockXdr, {
      networkPassphrase: mockPassphrase,
    });
  });

  it("throws ClearSignRejectedError when user rejects in the modal", async () => {
    vi.mocked(core.buildPreview).mockResolvedValue({
      risk: "ok",
    } as never);

    const mockAdapter: SignerAdapter = {
      getAddress: vi.fn().mockResolvedValue("GBRP..."),
      signTransaction: vi.fn().mockResolvedValue(signedResultXdr),
    };

    const { result } = renderHook(() =>
      useClearSign({
        rpcUrl: mockRpcUrl,
        networkPassphrase: mockPassphrase,
        adapter: mockAdapter,
      }),
    );

    let caughtError: unknown;
    act(() => {
      result.current.signTransaction(mockXdr).catch((err) => {
        caughtError = err;
      });
    });

    await waitFor(() => {
      expect(result.current.open).toBe(true);
    });

    act(() => {
      result.current.onReject();
    });

    await waitFor(() => {
      expect(caughtError).toBeInstanceOf(ClearSignRejectedError);
      expect(result.current.error).toBeInstanceOf(ClearSignRejectedError);
      expect((caughtError as Error).name).toBe("ClearSignRejectedError");
      expect((caughtError as Error).message).toBe(
        "User rejected transaction signature",
      );
    });

    expect(mockAdapter.signTransaction).not.toHaveBeenCalled();
    expect(result.current.signedXdr).toBeNull();
    expect(result.current.isSigning).toBe(false);
  });

  it("surfaces wallet errors as typed WalletSigningError", async () => {
    vi.mocked(core.buildPreview).mockResolvedValue({
      risk: "ok",
    } as never);

    const originalError = new Error("User declined in Freighter pop-up");
    const mockAdapter: SignerAdapter = {
      getAddress: vi.fn().mockResolvedValue("GBRP..."),
      signTransaction: vi.fn().mockRejectedValue(originalError),
    };

    const { result } = renderHook(() =>
      useClearSign({
        rpcUrl: mockRpcUrl,
        networkPassphrase: mockPassphrase,
        adapter: mockAdapter,
      }),
    );

    let caughtError: unknown;
    act(() => {
      result.current.signTransaction(mockXdr).catch((err) => {
        caughtError = err;
      });
    });

    await waitFor(() => {
      expect(result.current.open).toBe(true);
    });

    await act(async () => {
      await result.current.onApprove();
    });

    await waitFor(() => {
      expect(caughtError).toBeInstanceOf(WalletSigningError);
      expect(result.current.error).toBeInstanceOf(WalletSigningError);
      expect((caughtError as WalletSigningError).cause).toBe(originalError);
      expect((caughtError as WalletSigningError).message).toBe(
        "User declined in Freighter pop-up",
      );
    });

    expect(result.current.signedXdr).toBeNull();
    expect(result.current.isSigning).toBe(false);
  });

  it("never calls adapter when transaction is blocked (security gating)", async () => {
    vi.mocked(core.buildPreview).mockResolvedValue({
      risk: "blocked",
      warnings: [
        {
          code: "CRITICAL_ATTACK",
          severity: "blocked",
          explanation: "Malicious contract",
        },
      ],
    } as never);

    const mockAdapter: SignerAdapter = {
      getAddress: vi.fn().mockResolvedValue("GBRP..."),
      signTransaction: vi.fn().mockResolvedValue(signedResultXdr),
    };

    const { result } = renderHook(() =>
      useClearSign({
        rpcUrl: mockRpcUrl,
        networkPassphrase: mockPassphrase,
        adapter: mockAdapter,
      }),
    );

    let caughtError: unknown;
    act(() => {
      result.current.signTransaction(mockXdr).catch((err) => {
        caughtError = err;
      });
    });

    await waitFor(() => {
      expect(caughtError).toBeInstanceOf(WalletSigningError);
      expect((caughtError as Error).message).toContain("blocked");
    });

    expect(mockAdapter.signTransaction).not.toHaveBeenCalled();
    expect(result.current.open).toBe(false);
    expect(result.current.signedXdr).toBeNull();
  });

  it("requires explicit acknowledgement before calling adapter for review-risk transactions", async () => {
    vi.mocked(core.buildPreview).mockResolvedValue({
      risk: "review",
      warnings: [
        {
          code: "UNKNOWN_SOURCE",
          severity: "review",
          explanation: "Unverified contract",
        },
      ],
    } as never);

    const mockAdapter: SignerAdapter = {
      getAddress: vi.fn().mockResolvedValue("GBRP..."),
      signTransaction: vi.fn().mockResolvedValue(signedResultXdr),
    };

    const { result } = renderHook(() =>
      useClearSign({
        rpcUrl: mockRpcUrl,
        networkPassphrase: mockPassphrase,
        adapter: mockAdapter,
      }),
    );

    let signResolved: string | undefined;
    act(() => {
      result.current.signTransaction(mockXdr).then((xdr) => {
        signResolved = xdr;
      });
    });

    await waitFor(() => {
      expect(result.current.open).toBe(true);
    });

    // Approval without acknowledging review warnings should not trigger adapter
    await act(async () => {
      await result.current.onApprove();
    });

    expect(mockAdapter.signTransaction).not.toHaveBeenCalled();
    expect(signResolved).toBeUndefined();

    // Approve with acknowledged review warnings
    await act(async () => {
      await result.current.onApprove([
        {
          code: "UNKNOWN_SOURCE",
          severity: "review",
          explanation: "Unverified contract",
          title: "Review Warning",
        },
      ]);
    });

    await waitFor(() => {
      expect(signResolved).toBe(signedResultXdr);
    });
    expect(mockAdapter.signTransaction).toHaveBeenCalledTimes(1);
  });

  it("provides double-click protection (calls adapter.signTransaction only once)", async () => {
    vi.mocked(core.buildPreview).mockResolvedValue({
      risk: "ok",
    } as never);

    let finishSign!: (xdr: string) => void;
    const slowSignPromise = new Promise<string>((resolve) => {
      finishSign = resolve;
    });

    const mockAdapter: SignerAdapter = {
      getAddress: vi.fn().mockResolvedValue("GBRP..."),
      signTransaction: vi.fn().mockReturnValue(slowSignPromise),
    };

    const { result } = renderHook(() =>
      useClearSign({
        rpcUrl: mockRpcUrl,
        networkPassphrase: mockPassphrase,
        adapter: mockAdapter,
      }),
    );

    let signPromise: Promise<string> | undefined;
    act(() => {
      signPromise = result.current.signTransaction(mockXdr);
    });

    await waitFor(() => {
      expect(result.current.open).toBe(true);
    });

    // First click initiates signing
    act(() => {
      result.current.onApprove();
    });

    expect(result.current.isSigning).toBe(true);

    // Rapid second and third clicks while first is in flight
    act(() => {
      result.current.onApprove();
      result.current.onApprove();
    });

    expect(mockAdapter.signTransaction).toHaveBeenCalledTimes(1);

    // Complete signing
    await act(async () => {
      finishSign(signedResultXdr);
      await signPromise;
    });

    expect(result.current.isSigning).toBe(false);
    expect(result.current.signedXdr).toBe(signedResultXdr);
    expect(mockAdapter.signTransaction).toHaveBeenCalledTimes(1);
  });
});

describe("freighterAdapter", () => {
  const testAddress =
    "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
  const testSignedXdr = "AAAAAgAAAAB_FREIGHTER_SIGNED...";

  it("calls getAddress and normalizes string or object format", async () => {
    // API returning object { address: string }
    const mockApi1 = {
      getAddress: vi.fn().mockResolvedValue({ address: testAddress }),
      signTransaction: vi
        .fn()
        .mockResolvedValue({ signedTxXdr: testSignedXdr }),
    };

    const adapter1 = freighterAdapter({ api: mockApi1 });
    const addr1 = await adapter1.getAddress();
    expect(addr1).toBe(testAddress);

    // API returning direct string
    const mockApi2 = {
      getAddress: vi.fn().mockResolvedValue(testAddress),
      signTransaction: vi.fn().mockResolvedValue(testSignedXdr),
    };

    const adapter2 = freighterAdapter({ api: mockApi2 });
    const addr2 = await adapter2.getAddress();
    expect(addr2).toBe(testAddress);
  });

  it("calls signTransaction with networkPassphrase and returns signed XDR", async () => {
    const mockApi = {
      getAddress: vi.fn().mockResolvedValue({ address: testAddress }),
      signTransaction: vi
        .fn()
        .mockResolvedValue({ signedTxXdr: testSignedXdr }),
    };

    const adapter = freighterAdapter({ api: mockApi });
    const result = await adapter.signTransaction("input-xdr", {
      networkPassphrase: "Test SDF Network ; September 2015",
    });

    expect(result).toBe(testSignedXdr);
    expect(mockApi.signTransaction).toHaveBeenCalledWith("input-xdr", {
      networkPassphrase: "Test SDF Network ; September 2015",
    });
  });

  it("throws typed WalletSigningError when Freighter API returns an error", async () => {
    const mockApi = {
      getAddress: vi
        .fn()
        .mockResolvedValue({ error: "User rejected connection" }),
      signTransaction: vi
        .fn()
        .mockResolvedValue({ error: "User rejected transaction signing" }),
    };

    const adapter = freighterAdapter({ api: mockApi });
    await expect(adapter.getAddress()).rejects.toThrow(WalletSigningError);
    await expect(adapter.getAddress()).rejects.toThrow(
      "User rejected connection",
    );

    await expect(
      adapter.signTransaction("xdr", { networkPassphrase: "pass" }),
    ).rejects.toThrow(WalletSigningError);
    await expect(
      adapter.signTransaction("xdr", { networkPassphrase: "pass" }),
    ).rejects.toThrow("User rejected transaction signing");
  });

  it("throws typed WalletSigningError when Freighter is not installed", async () => {
    const originalWindow = global.window;
    // @ts-expect-error window is not optional on globalThis in standard types
    delete global.window;

    const adapter = freighterAdapter();
    await expect(adapter.getAddress()).rejects.toThrow(WalletSigningError);

    global.window = originalWindow;
  });
});

describe("stellarWalletsKitAdapter", () => {
  const testAddress =
    "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
  const testSignedXdr = "AAAAAgAAAAB_KIT_SIGNED...";

  it("delegates getAddress and signTransaction to kit instance", async () => {
    const mockKit = {
      getAddress: vi.fn().mockResolvedValue(testAddress),
      signTransaction: vi.fn().mockResolvedValue(testSignedXdr),
    };

    const adapter = stellarWalletsKitAdapter({ kit: mockKit });

    const addr = await adapter.getAddress();
    expect(addr).toBe(testAddress);
    expect(mockKit.getAddress).toHaveBeenCalledTimes(1);

    const signed = await adapter.signTransaction("input-xdr", {
      networkPassphrase: "Test SDF Network ; September 2015",
    });
    expect(signed).toBe(testSignedXdr);
    expect(mockKit.signTransaction).toHaveBeenCalledWith("input-xdr", {
      networkPassphrase: "Test SDF Network ; September 2015",
    });
  });

  it("normalizes kit signTransaction object returns", async () => {
    const mockKit = {
      getAddress: vi.fn().mockResolvedValue({ address: testAddress }),
      signTransaction: vi
        .fn()
        .mockResolvedValue({ signedTxXdr: testSignedXdr }),
    };

    const adapter = stellarWalletsKitAdapter({ kit: mockKit });
    const addr = await adapter.getAddress();
    expect(addr).toBe(testAddress);

    const signed = await adapter.signTransaction("input-xdr", {
      networkPassphrase: "test",
    });
    expect(signed).toBe(testSignedXdr);
  });

  it("wraps kit errors in WalletSigningError", async () => {
    const innerError = new Error("Hardware wallet disconnected");
    const mockKit = {
      getAddress: vi.fn().mockRejectedValue(innerError),
      signTransaction: vi.fn().mockRejectedValue(innerError),
    };

    const adapter = stellarWalletsKitAdapter({ kit: mockKit });

    await expect(adapter.getAddress()).rejects.toThrow(WalletSigningError);
    await expect(
      adapter.signTransaction("input-xdr", { networkPassphrase: "test" }),
    ).rejects.toThrow(WalletSigningError);
  });
});
