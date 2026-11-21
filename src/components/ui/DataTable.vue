<script setup lang="ts">
import type { TableColumn } from '@/types/ui';
import LoadingState from '@/components/ui/LoadingState.vue';
import EmptyState from '@/components/ui/EmptyState.vue';

interface Props {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  rowKey?: string;
  loading?: boolean;
  emptyMessage?: string;
}

withDefaults(
  defineProps<Props>(),
  {
    rowKey: 'id',
    loading: false,
    emptyMessage: undefined,
  }
);
</script>

<template>
  <LoadingState v-if="loading" />

  <EmptyState
    v-else-if="rows.length === 0"
    :message="emptyMessage"
  />

  <div
    v-else
    class="table-wrapper"
  >
    <table class="data-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
          >
            {{ column.label }}
          </th>

          <th
            v-if="$slots.actions"
            scope="col"
          >
            Acciones
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in rows"
          :key="String(row[rowKey])"
        >
          <td
            v-for="column in columns"
            :key="column.key"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="row[column.key]"
            >
              {{ row[column.key] ?? '—' }}
            </slot>
          </td>

          <td
            v-if="$slots.actions"
            class="actions-cell"
          >
            <slot
              name="actions"
              :row="row"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: .75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  background: var(--color-background);
  color: var(--color-text-secondary);
  font-size: .875rem;
  white-space: nowrap;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.actions-cell {
  display: flex;
  gap: .5rem;
  white-space: nowrap;
}
</style>