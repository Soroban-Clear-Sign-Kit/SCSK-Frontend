# @clearsign/vue

Vue 3 composables and UI components for the **Soroban Clear-Sign Kit (SCSK)**. Inspect, simulate, and preview Soroban transactions with fail-closed security and human-readable clarity in Vue 3 applications.

---

## Installation

```bash
# Using npm
npm install @clearsign/vue @clearsign/core @stellar/stellar-sdk

# Using pnpm
pnpm add @clearsign/vue @clearsign/core @stellar/stellar-sdk
```

---

## Quick Start (Vue 3 + Testnet)

```vue
<template>
  <div class="transaction-container">
    <button @click="handleSign" :disabled="loading">
      {{ loading ? "Simulating..." : "Preview & Sign Transaction" }}
    </button>

    <ClearSignModal
      v-if="open"
      :preview="preview"
      :loading="loading"
      @approve="onApprove"
      @reject="onReject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ClearSignModal, useClearSign } from "@clearsign/vue";
import "@clearsign/vue/styles.css";

// Soroban Testnet invocation XDR
const xdr = ref("AAAAAgAAAAA...");

const { open, preview, loading, requestApproval, onApprove, onReject } =
  useClearSign({
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  });

const handleSign = async () => {
  const approved = await requestApproval(xdr.value);
  if (approved) {
    console.log("User approved transaction preview; submit to wallet signer.");
  } else {
    console.warn("Transaction was rejected by user or gated as blocked.");
  }
};
</script>
```

---

## Props & Events Reference (`ClearSignModal.vue`)

| Prop / Event | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `preview` | `ClearSignPreview \| null` | `null` | The parsed and simulated Soroban transaction preview payload from `@clearsign/core`. |
| `loading` | `boolean` | `false` | When `true`, displays a busy modal dialog with a spinner while simulation executes. |
| `@approve` | `() => void` | — | Emitted when the user confirms and approves the transaction (enabled only for `ok` or acknowledged `review`). |
| `@reject` | `() => void` | — | Emitted when the user clicks Reject, presses `Escape`, or closes the modal dialog. |

---

## Composable: `useClearSign`

```ts
const {
  open, // Ref<boolean>: modal open state
  preview, // Ref<ClearSignPreview | null>: decoded preview data
  loading, // Ref<boolean>: preview building indicator
  requestApproval, // (xdr: string) => Promise<boolean>: opens modal and returns user decision
  onApprove, // () => void: handles approve button action
  onReject, // () => void: handles reject button action
} = useClearSign({
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
});
```

---

## Guarding Wallet Calls: `withClearSign`

```ts
import { withClearSign } from "@clearsign/vue";

// Wrap your wallet signing function to fail-closed unless user approves preview
const safeSignTransaction = withClearSign(walletSignMethod, {
  requestApproval,
});
```
