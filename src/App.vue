<template>
  <div>
    <svg
      v-if="isFetchingData"
      viewBox="0 0 800 800"
      xmlns="http://www.w3.org/2000/svg"
      class="spinner"
    >
      <circle
        cx="400"
        cy="400"
        fill="none"
        r="200"
        stroke-width="50"
        stroke="#476ef9"
        stroke-dasharray="378 1400"
        stroke-linecap="round"
      />
    </svg>

    <AgGridVue
      v-else
      ref="table"
      pagination
      :pagination-page-size="25"
      :pagination-page-size-selector="[25, 50]"
      :get-row-id="({ data }) => data?.id"
      :style="{
        width: '900px',
        height: '900px',
      }"
      :column-defs="[
        { field: 'name' },
        { field: 'country' },
        { field: 'sector' },
      ]"
      :row-data="entities"
    >
    </AgGridVue>
  </div>
</template>

<script setup lang="ts">
import { AgGridVue } from "ag-grid-vue3";

import { useAppStorage } from "./composables/use-app-storage";
import { onBeforeMount, ref } from "vue";

const { fetchData } = useAppStorage();

const entities = ref<any[]>([]);
const isFetchingData = ref(false);

onBeforeMount(async () => {
  isFetchingData.value = true;
  try {
    await fetchData(entities);
    console.log("Data transferred to AG Grid");
  } finally {
    isFetchingData.value = false;
  }
});
</script>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin2 {
  0% {
    stroke-dasharray: 1, 800;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 400, 400;
    stroke-dashoffset: -200px;
  }
  100% {
    stroke-dasharray: 800, 1;
    stroke-dashoffset: -800px;
  }
}

.spinner {
  width: 80px;
}

.spinner circle {
  transform-origin: center;
  animation: spin2 1.5s ease-in-out infinite, spin 2s linear infinite;
  animation-direction: alternate;
}
</style>
