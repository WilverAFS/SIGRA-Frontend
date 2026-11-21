import { mount } from '@vue/test-utils';

import BaseSelect
  from '@/components/forms/BaseSelect.vue';

describe('BaseSelect', () => {

  const options = [
    { value: 1, label: 'Instituto Tecnológico de Oaxaca' },
    { value: 2, label: 'Otro instituto' },
  ];

  test('muestra label y opciones', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        id: 'instituto',
        label: 'Instituto',
        options,
        modelValue: '',
      },
    });

    expect(wrapper.text()).toContain('Instituto');
    expect(wrapper.text()).toContain('Instituto Tecnológico de Oaxaca');
    expect(wrapper.findAll('option')).toHaveLength(3);
  });

  test('muestra el mensaje de error', () => {
    const wrapper = mount(BaseSelect, {
      props: {
        id: 'instituto',
        label: 'Instituto',
        options,
        modelValue: '',
        error: 'Este campo es obligatorio.',
      },
    });

    expect(wrapper.text()).toContain('Este campo es obligatorio.');
  });

});