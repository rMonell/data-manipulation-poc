<template>
  <div
    class="h-screen w-screen flex justify-center items-center bg-slate-950 text-white"
  >
    <AppSpinner v-if="isFetchingData" />

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
        :pagination-page-size-selector="[25, 50, 100, 500, items.length]"
        :get-row-id="({ data }) => data?.id"
        :style="{
          width: '900px',
          height: '900px',
        }"
        :loading="isTableLoading"
        :loading-overlay-component="AppSpinner"
        :column-defs="
          columns.map((column) => {
            const filterFromColumnType: Record<ColumnMetaData['type'], string> = {
              'text': 'agTextColumnFilter',
              'set': 'agSetColumnFilter',
              'number': 'agNumberColumnFilter',
              'date': 'agDateColumnFilter',
            }
            const cellDataTypeFromColumnType: Record<ColumnMetaData['type'], string> = {
              'text': 'text',
              'set': 'text',
              'number': 'number',
              'date': 'date',
            }
            return {
              field: column.id,
              headerName: column.label,
              filter: filterFromColumnType[column.type],
              cellDataType: cellDataTypeFromColumnType[column.type],
              valueGetter: ({ data }) => {
                if (!data) {
                  return undefined;
                }
                if (column.type == 'date') {
                  return new Date(data[column.id]);
                }
                return data[column.id];
              },
            };
          })
        "
        :row-data="items"
      >
      </AgGridVue>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AgGridVue } from "ag-grid-vue3";

import { ref, onBeforeMount, useTemplateRef } from "vue";
import { debounce } from "lodash-es";
import type { ColumnMetaData, TableItem } from "./types";
import AppSpinner from "./AppSpinner.vue";

const tableRef = useTemplateRef("table");

const columns = ref<ColumnMetaData[]>([]);

const items = ref<TableItem[]>([]);
const isFetchingData = ref(false);
const isTableLoading = ref(false);

const handleDisplayLoader = (resolver: Function) => {
  isTableLoading.value = true;

  setTimeout(() => {
    resolver();
    isTableLoading.value = false;
  }, 50);
};

const updateSearchText = debounce(async (event: Event) => {
  handleDisplayLoader(() => {
    tableRef.value?.api?.setGridOption(
      "quickFilterText",
      (event.target as HTMLInputElement).value
    );
  });
}, 400);

onBeforeMount(async () => {
  isFetchingData.value = true;
  try {
    const columnsResponse = await fetch("/columns-metadata.json");
    const itemsResponse = await fetch("/dataset.json");

    columns.value = await columnsResponse.json();
    items.value = await itemsResponse.json();

    console.log("Data transferred");
  } finally {
    isFetchingData.value = false;
  }
});
</script>
