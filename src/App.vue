<template>
  <div
    class="h-screen w-screen flex flex-col gap-4 justify-center items-center bg-slate-950 text-white"
  >
    <AppSpinner v-if="isFetchingData" />

    <template v-else>
      <div
        class="flex justify-start gap-4 items-stretch max-w-1/2 w-full min-w-[750px]"
      >
        <input
          placeholder="Search"
          class="rounded-md bg-slate-700 p-2 h-full"
          @input="(e: Event) => updateSearchText(e)"
        />

        <hr class="h-full w-px border-1 border-slate-800" />

        <button
          class="bg-indigo-500 py-1 px-2 rounded-md cursor-pointer active:bg-indigo-600"
          @click="isWideLayoutEnabled = !isWideLayoutEnabled"
        >
          Toggle ultra wide display
        </button>
      </div>

      <AgGridVue
        ref="table"
        class="min-w-[750px]"
        pagination
        :pagination-page-size="25"
        :pagination-page-size-selector="[25, 50, 100, 500, items.length]"
        :get-row-id="({ data }) => data?.id"
        :style="{
          width: isWideLayoutEnabled ? '100vw' : '50%',
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
    </template>
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
const isWideLayoutEnabled = ref(false);

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
