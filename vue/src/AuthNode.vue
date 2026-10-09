<template>
  <div :class="styles.treeNode">
    <div><strong>{{ node.kind }}</strong></div>
    <div v-if="node.contractId">Contract: <span :title="node.contractId">{{ shortenAddress(node.contractId) }}</span></div>
    <div v-if="node.functionName">Function: {{ node.functionName }}</div>
    <div v-if="node.children && node.children.length > 0">
      Sub-invocations:
      <AuthNodeComponent v-for="(child, i) in node.children" :key="i" :node="child" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AuthNode } from '@clearsign/core';
import styles from './styles.module.css';

defineProps<{
  node: AuthNode;
}>();

const shortenAddress = (addr: string) => {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
};
</script>

<script lang="ts">
// Give it a name for self-referencing in recursive components
export default {
  name: 'AuthNodeComponent'
};
</script>
