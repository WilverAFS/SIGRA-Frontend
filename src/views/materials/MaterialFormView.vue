<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import BaseInput from '@/components/forms/BaseInput.vue';
import FileField from '@/components/materials/FileField.vue';
import SelectField from '@/components/materials/SelectField.vue';
import TextAreaField from '@/components/materials/TextAreaField.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import { catalogsService } from '@/services/catalogs.service';
import { materialsService } from '@/services/materials.service';
import { useAuthStore } from '@/stores/auth';
import {
  type CatalogOption,
  type MaterialType,
  type MaterialVisibility,
  materialTypeLabels,
  visibilityLabels,
} from '@/types/materials';
import { archivoValido } from '@/utils/archivos';
import {
  getErrorCode,
  getErrorMessage,
  getFieldError,
} from '@/utils/error-handler';
import { esAdmin, puedeGestionarMaterial } from '@/utils/permisos-materiales';
import { longitudMaxima, requerido } from '@/utils/validaciones';

const TITLE_MAX = 220;
const FIELDS = [
  'subjectId',
  'academicPeriodId',
  'title',
  'description',
  'materialType',
  'visibility',
  'syllabusChangesNote',
  'changelog',
  'file',
] as const;
type Field = (typeof FIELDS)[number];

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const materialId = computed(() =>
  route.params.id ? Number(route.params.id) : null,
);
const isEdit = computed(() => materialId.value !== null);
const isAdmin = computed(() => esAdmin(authStore.user));

const form = reactive({
  subjectId: '',
  academicPeriodId: '',
  title: '',
  description: '',
  materialType: '',
  visibility: 'ESTUDIANTES_Y_DOCENTES',
  syllabusChangesNote: '',
  changelog: 'Versión inicial.',
  isApproved: true,
});
const file = ref<File | null>(null);
const errors = reactive<Record<Field, string>>(
  Object.fromEntries(FIELDS.map((f) => [f, ''])) as Record<Field, string>,
);
const serverError = ref<string | null>(null);
const loading = ref(false);
const loadError = ref<string | null>(null);
const saving = ref(false);
const subjects = ref<CatalogOption[]>([]);
const periods = ref<CatalogOption[]>([]);

const typeOptions = Object.entries(materialTypeLabels).map(([value, label]) => ({
  value,
  label,
}));
const visibilityOptions = Object.entries(visibilityLabels).map(
  ([value, label]) => ({ value, label }),
);
const subjectOptions = computed(() =>
  subjects.value.map((s) => ({ value: String(s.id), label: `${s.code} · ${s.name}` })),
);
const periodOptions = computed(() =>
  periods.value.map((p) => ({ value: String(p.id), label: p.name })),
);

function resetErrors() {
  for (const field of FIELDS) errors[field] = '';
  serverError.value = null;
}

/** Validaciones del lado del cliente (las mismas reglas que el backend). */
function validarFormulario(): boolean {
  resetErrors();
  errors.title =
    requerido(form.title) ?? longitudMaxima(form.title.trim(), TITLE_MAX) ?? '';
  errors.materialType = requerido(form.materialType) ?? '';
  if (!isEdit.value) {
    errors.subjectId = requerido(form.subjectId) ?? '';
    errors.academicPeriodId = requerido(form.academicPeriodId) ?? '';
    errors.file = archivoValido(file.value) ?? '';
  }
  return FIELDS.every((field) => !errors[field]);
}

/** Errores del backend: 422 junto a cada campo; 413/415 junto al archivo. */
function mostrarErrorServidor(err: unknown) {
  let anyField = false;
  for (const field of FIELDS) {
    const message = getFieldError(err, field);
    if (message) {
      errors[field] = message;
      anyField = true;
    }
  }
  const code = getErrorCode(err);
  if (code === 'FILE_TOO_LARGE' || code === 'FILE_TYPE_NOT_ALLOWED') {
    errors.file = getErrorMessage(err);
    return;
  }
  if (!anyField || code !== 'VALIDATION_ERROR') {
    serverError.value =
      code === 'FORBIDDEN_SUBJECT_ASSIGNMENT'
        ? 'No tienes asignada esta materia, así que no puedes subir materiales para ella.'
        : getErrorMessage(err, 'No se pudo guardar el material.');
  }
}

async function submit() {
  if (!validarFormulario()) {
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      const updated = await materialsService.update(materialId.value!, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        materialType: form.materialType as MaterialType,
        visibility: form.visibility as MaterialVisibility,
        syllabusChangesNote: form.syllabusChangesNote.trim() || null,
        ...(isAdmin.value ? { isApproved: form.isApproved } : {}),
      });
      await router.push(`/materiales/${updated.id}`);
    } else {
      const created = await materialsService.create(
        {
          subjectId: Number(form.subjectId),
          academicPeriodId: Number(form.academicPeriodId),
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          materialType: form.materialType as MaterialType,
          visibility: form.visibility as MaterialVisibility,
          syllabusChangesNote: form.syllabusChangesNote.trim() || undefined,
          changelog: form.changelog.trim() || undefined,
        },
        file.value!,
      );
      await router.push(`/materiales/${created.id}`);
    }
  } catch (err) {
    mostrarErrorServidor(err);
  } finally {
    saving.value = false;
  }
}

async function loadMaterial() {
  loading.value = true;
  try {
    const material = await materialsService.get(materialId.value!);
    if (!puedeGestionarMaterial(authStore.user, material)) {
      await router.replace('/403');
      return;
    }
    Object.assign(form, {
      title: material.title,
      description: material.description ?? '',
      materialType: material.materialType,
      visibility: material.visibility,
      syllabusChangesNote: material.syllabusChangesNote ?? '',
      isApproved: material.isApproved,
    });
  } catch (err) {
    loadError.value = getErrorMessage(err, 'No se pudo cargar el material.');
  } finally {
    loading.value = false;
  }
}

async function loadCatalogs() {
  const [subjectsResult, periodsResult] = await Promise.allSettled([
    catalogsService.subjectOptions(),
    catalogsService.periodOptions(),
  ]);
  if (subjectsResult.status === 'fulfilled') subjects.value = subjectsResult.value;
  if (periodsResult.status === 'fulfilled') periods.value = periodsResult.value;
}

onMounted(() => {
  if (isEdit.value) {
    void loadMaterial();
  } else {
    void loadCatalogs();
  }
});
</script>

<template>
  <section class="form-page">
    <RouterLink
      :to="isEdit ? `/materiales/${materialId}` : '/materiales'"
      class="back-link"
    >
      ← Volver
    </RouterLink>
    <h1>{{ isEdit ? 'Editar material' : 'Subir material' }}</h1>
    <p class="page-subtitle">
      {{
        isEdit
          ? 'Edita los datos del material. Para cambiar el archivo sube una versión nueva desde el detalle.'
          : 'Crea el material junto con su primera versión.'
      }}
    </p>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="loadError" :message="loadError" />

    <form v-else class="material-form" novalidate @submit.prevent="submit">
      <div v-if="!isEdit" class="form-row">
        <SelectField
          id="subjectId"
          v-model="form.subjectId"
          label="Materia"
          :options="subjectOptions"
          required
          :error="errors.subjectId"
        />
        <SelectField
          id="academicPeriodId"
          v-model="form.academicPeriodId"
          label="Periodo académico"
          :options="periodOptions"
          required
          :error="errors.academicPeriodId"
        />
      </div>

      <BaseInput
        id="title"
        v-model="form.title"
        label="Título"
        placeholder="Planeación didáctica 2026-2"
        required
        :error="errors.title"
      />

      <TextAreaField
        id="description"
        v-model="form.description"
        label="Descripción"
        placeholder="¿Qué contiene este material?"
        :error="errors.description"
      />

      <div class="form-row">
        <SelectField
          id="materialType"
          v-model="form.materialType"
          label="Tipo de material"
          :options="typeOptions"
          required
          :error="errors.materialType"
        />
        <SelectField
          id="visibility"
          v-model="form.visibility"
          label="Visibilidad"
          placeholder="Estudiantes y docentes"
          :options="visibilityOptions"
          :error="errors.visibility"
        />
      </div>

      <TextAreaField
        id="syllabusChangesNote"
        v-model="form.syllabusChangesNote"
        label="Nota de cambios al temario (opcional)"
        placeholder="Justificación si el material responde a un ajuste del temario"
        :rows="2"
        :error="errors.syllabusChangesNote"
      />

      <template v-if="!isEdit">
        <FileField
          id="file"
          v-model="file"
          label="Archivo"
          required
          :error="errors.file"
        />
        <BaseInput
          id="changelog"
          v-model="form.changelog"
          label="Nota de la versión"
          :error="errors.changelog"
        />
      </template>

      <label v-if="isEdit && isAdmin" class="checkbox">
        <input v-model="form.isApproved" type="checkbox">
        Aprobado (visible en el catálogo para estudiantes)
      </label>

      <p v-if="serverError" class="server-error" role="alert">
        {{ serverError }}
      </p>

      <div class="form-actions">
        <button type="submit" class="button button-primary" :disabled="saving">
          {{ saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Subir material' }}
        </button>
        <RouterLink
          :to="isEdit ? `/materiales/${materialId}` : '/materiales'"
          class="button button-secondary"
        >
          Cancelar
        </RouterLink>
      </div>
    </form>
  </section>
</template>

<style scoped>
.form-page {
  text-align: left;
  max-width: 760px;
  margin: 0 auto;
  padding: 1.5rem;
  color: var(--color-text);
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.form-page h1 {
  margin: 0.75rem 0 0;
  font-size: 1.75rem;
  color: var(--color-primary);
}

.page-subtitle {
  margin: 0.25rem 0 1.5rem;
  color: var(--color-text-secondary);
}

.material-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.server-error {
  margin: 0;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  background: #fef2f2;
  color: var(--color-danger);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.button {
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.2;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-primary {
  background: var(--color-primary);
  color: white;
}

.button-secondary {
  background: white;
  border-color: var(--color-border);
  color: var(--color-text);
}

@media (max-width: 640px) {
  .form-page {
    padding: 1rem;
  }

  .material-form {
    padding: 1rem;
  }

  .form-actions .button {
    flex: 1;
    text-align: center;
  }
}
</style>
