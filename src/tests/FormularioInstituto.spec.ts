import { mount } from '@vue/test-utils';

import FormularioInstituto
  from '@/components/admin/FormularioInstituto.vue';

describe('FormularioInstituto', () => {

  test('muestra errores y no envía si hay campos vacíos', async () => {
    const wrapper = mount(FormularioInstituto);

    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Este campo es obligatorio.');
    expect(wrapper.emitted('guardar')).toBeUndefined();
  });

  test('emite los datos cuando el formulario es válido', async () => {
    const wrapper = mount(FormularioInstituto);

    await wrapper.find('#instituto-code').setValue('ITO');
    await wrapper.find('#instituto-name').setValue('Instituto Tecnológico de Oaxaca');
    await wrapper.find('#instituto-shortName').setValue('ITO');
    await wrapper.find('#instituto-city').setValue('Oaxaca');
    await wrapper.find('#instituto-state').setValue('Oaxaca');

    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('guardar')?.[0]).toEqual([
      {
        code: 'ITO',
        name: 'Instituto Tecnológico de Oaxaca',
        shortName: 'ITO',
        city: 'Oaxaca',
        state: 'Oaxaca',
        isActive: true,
      },
    ]);
  });

});