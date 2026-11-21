import { mount } from '@vue/test-utils';

import DataTable
  from '@/components/ui/Tabla.vue';

describe('DataTable', () => {

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'city', label: 'Ciudad' },
  ];

  test('muestra encabezados y filas', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns,
        rows: [
          { id: 1, name: 'ITO', city: 'Oaxaca' },
        ],
      },
    });

    expect(wrapper.text()).toContain('Nombre');
    expect(wrapper.text()).toContain('ITO');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
  });

  test('muestra mensaje cuando no hay filas', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns,
        rows: [],
        emptyMessage: 'Sin institutos.',
      },
    });

    expect(wrapper.text()).toContain('Sin institutos.');
  });

  test('muestra el estado de carga', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns,
        rows: [],
        loading: true,
      },
    });

    expect(wrapper.text()).toContain('Cargando');
  });

});