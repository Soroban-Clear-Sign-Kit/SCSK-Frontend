<template>
  <div v-if="preview" :class="styles.modalOverlay">
    <div
      :class="styles.modalContent"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clearsign-modal-title"
      ref="modalRef"
      tabindex="-1"
    >
      <div :class="styles.modalHeader">
        <h2 id="clearsign-modal-title">Transaction Preview</h2>
      </div>
      
      <div :class="styles.modalBody">
        <div :class="[styles.riskBanner, riskInfo.className]">
          {{ riskInfo.text }}
        </div>

        <div v-if="preview.summary && preview.summary.length > 0" :class="styles.section">
          <h3 :class="styles.sectionTitle">Summary</h3>
          <p v-for="(line, i) in preview.summary" :key="i" :class="styles.summaryLine">{{ line }}</p>
        </div>

        <div v-if="preview.warnings && preview.warnings.length > 0" :class="styles.section">
          <h3 :class="styles.sectionTitle">Warnings</h3>
          <ul :class="styles.warningList">
            <li v-for="(warning, i) in preview.warnings" :key="i" :class="styles.warningItem">
              <strong>{{ warning.severity.toUpperCase() }}:</strong> {{ warning.message }}
              <span v-if="warning.path"> (at {{ warning.path }})</span>
            </li>
          </ul>
        </div>

        <div v-if="preview.auth && preview.auth.length > 0" :class="styles.section">
          <h3 :class="styles.sectionTitle">Authorizations</h3>
          <AuthNodeComponent v-for="(node, i) in preview.auth" :key="i" :node="node.root" />
        </div>

        <div :class="styles.section">
          <h3 :class="styles.sectionTitle">Raw XDR</h3>
          <button type="button" @click="xdrExpanded = !xdrExpanded" :class="styles.toggleBtn">
            {{ xdrExpanded ? 'Hide Raw XDR' : 'Show Raw XDR' }}
          </button>
          <pre v-if="xdrExpanded" :class="styles.xdrCode">{{ preview.raw.xdr }}</pre>
        </div>
      </div>

      <div :class="styles.modalFooter">
        <div v-if="preview.risk === 'review'" :class="styles.checkboxWrapper">
          <input type="checkbox" id="clearsign-ack" v-model="reviewed" />
          <label for="clearsign-ack">I have reviewed the warnings and accept the risks.</label>
        </div>
        <div :class="styles.buttonGroup">
          <button type="button" @click="handleReject" :class="styles.btnReject">Reject</button>
          <button 
            v-if="preview.risk !== 'blocked'"
            type="button" 
            @click="handleApprove" 
            :disabled="preview.risk === 'review' && !reviewed"
            :class="styles.btnApprove"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { ClearSignPreview } from '@clearsign/core';
import styles from './styles.module.css';
import AuthNodeComponent from './AuthNode.vue';

const props = defineProps<{
  preview: ClearSignPreview | null;
}>();

const emit = defineEmits<{
  (e: 'approve'): void;
  (e: 'reject'): void;
}>();

const reviewed = ref(false);
const xdrExpanded = ref(false);
const modalRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);

const riskInfo = computed(() => {
  if (!props.preview) return { text: '', className: '' };
  switch (props.preview.risk) {
    case 'ok': return { text: 'Decoded and verified', className: styles.riskOk };
    case 'review': return { text: 'Review carefully', className: styles.riskReview };
    case 'blocked': return { text: 'Signing blocked', className: styles.riskBlocked };
    default: return { text: 'Unknown risk', className: styles.riskBlocked };
  }
});

const handleApprove = () => {
  emit('approve');
};

const handleReject = () => {
  emit('reject');
};

watch(() => props.preview, (newVal) => {
  if (newVal) {
    triggerRef.value = document.activeElement as HTMLElement;
    setTimeout(() => {
      if (modalRef.value) {
        modalRef.value.focus();
      }
    }, 0);
  }
});

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.preview) return;
  if (e.key === 'Escape') handleReject();
  
  if (e.key === 'Tab' && modalRef.value) {
     const focusable = modalRef.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
     if (focusable.length === 0) return;
     const first = focusable[0] as HTMLElement;
     const last = focusable[focusable.length - 1] as HTMLElement;
     if (e.shiftKey) {
        if (document.activeElement === first) {
           last.focus();
           e.preventDefault();
        }
     } else {
        if (document.activeElement === last) {
           first.focus();
           e.preventDefault();
        }
     }
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  if (triggerRef.value) {
    triggerRef.value.focus();
  }
});
</script>
