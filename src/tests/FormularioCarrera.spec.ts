import { mount } from '@vue/test-utils';

import FormularioCarrera
  from '@/components/admin/FormularioCarrera.vue';

describe('FormularioCarrera', () => {

  const institutos = [
    { value: 1, label: 'Instituto Tecnológico de Oaxaca' },
  ];

  function montar() {
    return mount(FormularioCarrera, {
      props: { institutos },
    });
  }

  test('muestra errores y no envía si hay campos vacíos', async () => {
    const wrapper = montar();

    await wrapper.find('#carrera-curriculumCode').setValue('');
    await wrapper.find('#carrera-name').setValue('');
    await wrapper.find('#carrera-shortName').setValue('');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Este campo es obligatorio.');
    expect(wrapper.emitted('guardar')).toBeUndefined();
  });

  test('rechaza un número de semestres fuera de 1 a 14', async () => {
    const wrapper = montar();

    await wrapper.find('#carrera-instituteId').setValue('1');
    await wrapper.find('#carrera-curriculumCode').setValue('ISIC-2010-224');
    await wrapper.find('#carrera-name').setValue('Ingeniería en Sistemas Computacionales');
    await wrapper.find('#carrera-shortName').setValue('ISC');
    await wrapper.find('#carrera-totalSemesters').setValue('15');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Debe estar entre 1 y 14 semestres.');
    expect(wrapper.emitted('guardar')).toBeUndefined();
  });

  test('emite los datos cuando el formulario es válido', async () => {
    const wrapper = montar();

    await wrapper.find('#carrera-instituteId').setValue('1');
    await wrapper.find('#carrera-curriculumCode').setValue('ISIC-2010-224');
    await wrapper.find('#carrera-name').setValue('Ingeniería en Sistemas Computacionales');
    await wrapper.find('#carrera-shortName').setValue('ISC');
    await wrapper.find('#carrera-totalSemesters').setValue('9');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('guardar')?.[0]).toEqual([
      {
        instituteId: 1,
        curriculumCode: 'ISIC-2010-224',
        name: 'Ingeniería en Sistemas Computacionales',
        shortName: 'ISC',
        totalSemesters: 9,
        isActive: true,
      },
    ]);
  });

});