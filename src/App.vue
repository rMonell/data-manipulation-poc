<template>
  <div
    class="h-screen w-screen flex justify-center items-center bg-slate-950 text-white"
  >
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

    <div v-else>
      <input
        placeholder="Search"
        class="mb-4 rounded-md bg-slate-700 p-2"
        @input="(e: Event) => updateSearchText(e)"
      />

      <AgGridVue
        ref="table"
        pagination
        :pagination-page-size="25"
        :pagination-page-size-selector="[25, 50, 100, 500]"
        :get-row-id="({ data }) => data?.id"
        :style="{
          width: '900px',
          height: '900px',
        }"
        :column-defs="[
          {
            field: 'name',
            filter: 'agTextColumnFilter',
            cellDataType: 'text',
          },
          {
            field: 'country',
            filter: 'agSetColumnFilter',
            cellDataType: 'text',
          },
          {
            field: 'sector',
            filter: 'agSetColumnFilter',
            cellDataType: 'text',
          },
          {
            field: 'createdAt',
            filter: 'agDateColumnFilter',
            cellDataType: 'date',
            valueGetter: ({ data }) => {
              return data ? new Date(data.createdAt) : undefined;
            },
          },
          { field: 'createdBy', filter: true, cellDataType: 'text' },
          {
            field: 'updatedAt',
            filter: 'agDateColumnFilter',
            cellDataType: 'date',
            valueGetter: ({ data }) => {
              return data ? new Date(data.createdAt) : undefined;
            },
          },
        ]"
        :row-data="entities"
      >
      </AgGridVue>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AgGridVue } from "ag-grid-vue3";

import { onBeforeMount, ref, useTemplateRef } from "vue";
import { debounce } from "lodash-es";
import type { Entity } from "./types";

const tableRef = useTemplateRef("table");

const entities = ref<any[]>([]);
const isFetchingData = ref(false);

const updateSearchText = debounce((event: Event) => {
  tableRef.value?.api?.setGridOption(
    "quickFilterText",
    (event.target as HTMLInputElement).value
  );
}, 400);

const fetchData = async (): Promise<Entity[]> => {
  const response = await fetch("/dataset.json");
  const entities = await response.json();
  return entities;
};

onBeforeMount(async () => {
  isFetchingData.value = true;
  try {
    entities.value = await fetchData();
    console.log("Data transferred");
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
