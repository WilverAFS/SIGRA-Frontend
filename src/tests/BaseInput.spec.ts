import { mount } from '@vue/test-utils';

import BaseInput
  from '@/components/forms/BaseInput.vue';

describe('BaseInput', () => {

  test('muestra label', () => {
    const wrapper = mount(
      BaseInput,
      {
        props: {
          id: 'email',
          label:
            'Correo electrónico',
          modelValue: '',
        },
      }
    );

    expect(
      wrapper.text()
    ).toContain(
      'Correo electrónico'
    );
  });

});