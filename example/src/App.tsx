import { useState, useEffect } from "react";
import { ClearSignModal, useClearSign } from "@clearsign/react";
import { freighterAdapter } from "@clearsign/react/adapters/freighter";
import type { ClearSignPreview } from "@clearsign/core";
import "@clearsign/react/styles.css";

const mockReadyPreview: ClearSignPreview = {
  version: 1,
  risk: "ok",
  warnings: [],
  network: {
    passphrase: "Test SDF Network ; September 2015",
    rpcMatches: true,
    signatureBound: true,
  },
  envelope: {
    source: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
    sequence: "12345678",
    fee: "100",
    operations: [],
  },
  invocation: {
    specSource: "wasm",
    contractId: "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
    functionName: "transfer",
    args: [
      {
        name: "to",
        typeName: "address",
        value: {
          kind: "address",
          value: "GDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTPEKGQKJZLDEOJKIOPU",
          addressType: "account",
        },
      },
      {
        name: "amount",
        typeName: "i128",
        value: {
          kind: "int",
          type: "i128",
          value: "100000000",
        },
      },
    ],
  },
  auth: [
    {
      credentials: {
        type: "address",
        address: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        nonce: "1",
        signatureExpirationLedger: 500,
        signed: true,
      },
      root: {
        kind: "contract-fn",
        contractId: "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
        functionName: "transfer",
        args: [],
        depth: 1,
        children: [],
      },
    },
  ],
  simulation: { status: "success" },
  effects: [
    {
      account: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      delta: "-100",
      formatted: "-100.00",
      symbol: "USDC",
      tokenContractId: "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
    },
    {
      account: "GDQJUTQYK2MQX2VGDR2FYWLIYAQIEGXTQVTPEKGQKJZLDEOJKIOPU",
      delta: "100",
      formatted: "+100.00",
      symbol: "USDC",
      tokenContractId: "CA3D5KRYMCMCZVACQ3VOXJDTBC65CV46UMTMVN6AZKQ3M5KN7W3KHA5C",
    },
  ],
  summary: ["Transfer 100 USDC to GDQJ...IOPU"],
  raw: {
    xdr: "AAAAAgAAAABl0k+u9eD8z9vEUxZc273uWn9l3iNl...",
  },
};

const mockReviewPreview: ClearSignPreview = {
  ...mockReadyPreview,
  risk: "review",
  warnings: [
    {
      code: "UNVERIFIED_CONTRACT",
      severity: "review",
      message: "The target contract bytecode is unverified on the network registry.",
    },
  ],
  summary: ["Interact with unverified contract CA3D...HA5C"],
};

const mockBlockedPreview: ClearSignPreview = {
  ...mockReadyPreview,
  risk: "blocked",
  warnings: [
    {
      code: "DRAIN_ATTACK_DETECTED",
      severity: "blocked",
      message: "Potential wallet drain: unlimited spending approval detected.",
    },
  ],
  summary: ["Approve unlimited allowance to untrusted spender"],
};

type ModalState = "loading" | "ready" | "review" | "blocked" | "error" | "success" | null;

function App() {
  const [xdr, setXdr] = useState("");
  const [lastSigned, setLastSigned] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [modalState, setModalState] = useState<ModalState>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("state") as ModalState) || null;
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (modalState) {
      url.searchParams.set("state", modalState);
    } else {
      url.searchParams.delete("state");
    }
    url.searchParams.set("theme", theme);
    window.history.replaceState(null, "", url.toString());
    document.documentElement.setAttribute("data-theme", theme);
  }, [modalState, theme]);

  const {
    open,
    preview,
    loading,
    isSigning,
    signedXdr,
    error,
    signTransaction,
    onApprove,
    onReject,
  } = useClearSign({
    networkPassphrase: "Test SDF Network ; September 2015",
    rpcUrl: "https://soroban-testnet.stellar.org",
    adapter: freighterAdapter(),
  });

  const handleSign = async () => {
    setStatusMessage(null);
    setLastSigned(null);
    try {
      const result = await signTransaction(xdr);
      setLastSigned(result);
      setStatusMessage("Transaction signed successfully on testnet with Freighter!");
    } catch (err) {
      setStatusMessage(`Signing failed: ${(err as Error).message}`);
    }
  };

  const effectivePreview =
    modalState === "loading"
      ? null
      : modalState === "ready"
        ? mockReadyPreview
        : modalState === "review"
          ? mockReviewPreview
          : modalState === "blocked"
            ? mockBlockedPreview
            : modalState === "error"
              ? null
              : modalState === "success"
                ? mockReadyPreview
                : preview;

  const effectiveStatus =
    modalState === "loading"
      ? "decoding"
      : modalState === "error"
        ? "error"
        : modalState === "success"
          ? "success"
          : undefined;

  const effectiveLoading = modalState === "loading" || loading;
  const isModalOpen = modalState !== null || open;

  return (
    <div
      data-theme={theme}
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
        color: theme === "dark" ? "#f8fafc" : "#0f172a",
        transition: "background-color 0.2s, color 0.2s",
      }}
    >
      <h1>Soroban Clear-Sign Kit Demo</h1>
      <p>
        Preview and sign Soroban transactions safely with Freighter or test visual states.
      </p>

      {/* State Switcher & Theme Controller */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          flexWrap: "wrap",
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: theme === "dark" ? "#1e293b" : "#f1f5f9",
          marginBottom: "1.5rem",
        }}
      >
        <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>Modal State:</span>
        {(["loading", "ready", "review", "blocked", "error", "success"] as const).map(
          (state) => (
            <button
              key={state}
              data-testid={`btn-state-${state}`}
              onClick={() => setModalState(state)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "4px",
                border: "1px solid",
                borderColor: modalState === state ? "#0284c7" : "#cbd5e1",
                backgroundColor: modalState === state ? "#0284c7" : "transparent",
                color: modalState === state ? "#ffffff" : "inherit",
                cursor: "pointer",
                fontWeight: modalState === state ? 600 : 400,
                textTransform: "capitalize",
              }}
            >
              {state}
            </button>
          ),
        )}
        {modalState && (
          <button
            data-testid="btn-state-reset"
            onClick={() => setModalState(null)}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "4px",
              border: "1px solid #94a3b8",
              backgroundColor: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        )}
        <div style={{ marginLeft: "auto" }}>
          <button
            data-testid="btn-theme-toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "4px",
              border: "1px solid #94a3b8",
              backgroundColor: "transparent",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Theme: {theme === "light" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      <textarea
        value={xdr}
        onChange={(e) => setXdr(e.target.value)}
        rows={4}
        style={{
          width: "100%",
          padding: "0.5rem",
          marginBottom: "1rem",
          fontFamily: "monospace",
          backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
          color: "inherit",
          border: `1px solid ${theme === "dark" ? "#334155" : "#cbd5e1"}`,
          borderRadius: "4px",
        }}
        placeholder="AAAA..."
      />

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={handleSign}
          disabled={!xdr.trim() || loading || isSigning}
          style={{
            padding: "0.6rem 1.2rem",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: !xdr.trim() || loading || isSigning ? "not-allowed" : "pointer",
            backgroundColor: "#0284c7",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          {loading
            ? "Simulating..."
            : isSigning
              ? "Signing with Freighter..."
              : "Preview & Sign (Freighter)"}
        </button>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
            backgroundColor: error ? "#fee2e2" : "#f0fdf4",
            color: error ? "#991b1b" : "#166534",
            border: `1px solid ${error ? "#f87171" : "#86efac"}`,
          }}
        >
          {statusMessage}
        </div>
      )}

      {(lastSigned || signedXdr) && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Signed Transaction XDR:</h3>
          <textarea
            readOnly
            value={lastSigned || signedXdr || ""}
            rows={4}
            style={{
              width: "100%",
              padding: "0.5rem",
              fontFamily: "monospace",
              backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
              color: "inherit",
              border: `1px solid ${theme === "dark" ? "#334155" : "#cbd5e1"}`,
            }}
          />
        </div>
      )}

      {isModalOpen && (
        <ClearSignModal
          preview={effectivePreview}
          loading={effectiveLoading}
          status={effectiveStatus}
          errorMessage={
            modalState === "error"
              ? "SimulateTransaction failed: Horizon RPC connection timeout"
              : error?.message
          }
          theme={theme}
          isSigning={isSigning}
          onApprove={(ack) => {
            if (modalState) {
              setModalState("success");
            } else {
              onApprove(ack);
            }
          }}
          onReject={() => {
            if (modalState) {
              setModalState(null);
            } else {
              onReject();
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
