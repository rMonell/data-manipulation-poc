export interface TableItem {
  id: string;
  [column: string]: string | number | Date | undefined;
}

export interface ColumnMetaData {
  id: string;
  label: string;
  type: "text" | "set" | "number" | "date";
}
