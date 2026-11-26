import { mount } from '@vue/test-utils';

import FormularioUsuario
  from '@/components/admin/FormularioUsuario.vue';

describe('FormularioUsuario', () => {

  const institutos = [
    { value: 1, label: 'Instituto Tecnológico de Oaxaca' },
  ];

  const carreras = [
    {
      id: 1,
      instituteId: 1,
      curriculumCode: 'ISIC-2010-224',
      name: 'Ingeniería en Sistemas Computacionales',
      shortName: 'ISC',
      totalSemesters: 9,
      isActive: true,
    },
  ];

  function montar() {
    return mount(FormularioUsuario, {
      props: { institutos, carreras },
    });
  }

  async function llenarDatosBase(wrapper: ReturnType<typeof montar>) {
    await wrapper.find('#usuario-institutionalId').setValue('22161058');
    await wrapper.find('#usuario-firstName').setValue('Wilver Alfredo');
    await wrapper.find('#usuario-lastName').setValue('Flores Santiago');
    await wrapper.find('#usuario-email').setValue('usuario@itoaxaca.edu.mx');
    await wrapper.find('#usuario-password').setValue('ClaveSegura1!');
    await wrapper.find('#usuario-instituteId').setValue('1');
  }

  test('muestra errores y no envía si hay campos vacíos', async () => {
    const wrapper = montar();

    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Este campo es obligatorio.');
    expect(wrapper.emitted('guardar')).toBeUndefined();
  });

  test('rechaza una contraseña que no cumple la regla', async () => {
    const wrapper = montar();

    await llenarDatosBase(wrapper);
    await wrapper.find('#usuario-password').setValue('abc');
    await wrapper.find('#usuario-role').setValue('ADMIN');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('8 caracteres');
    expect(wrapper.emitted('guardar')).toBeUndefined();
  });

  test('exige carrera cuando el rol no es ADMIN', async () => {
    const wrapper = montar();

    await llenarDatosBase(wrapper);
    await wrapper.find('#usuario-role').setValue('ESTUDIANTE');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.text()).toContain('Este campo es obligatorio.');
    expect(wrapper.emitted('guardar')).toBeUndefined();
  });

  test('un ADMIN puede guardarse sin carrera', async () => {
    const wrapper = montar();

    await llenarDatosBase(wrapper);
    await wrapper.find('#usuario-role').setValue('ADMIN');
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('guardar')?.[0]).toEqual([
      {
        institutionalId: '22161058',
        firstName: 'Wilver Alfredo',
        lastName: 'Flores Santiago',
        email: 'usuario@itoaxaca.edu.mx',
        password: 'ClaveSegura1!',
        role: 'ADMIN',
        instituteId: 1,
        careerId: null,
      },
    ]);
  });

});