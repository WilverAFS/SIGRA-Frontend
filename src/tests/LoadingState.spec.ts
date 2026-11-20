import { mount } from '@vue/test-utils';

import LoadingState
  from '@/components/ui/LoadingState.vue';

describe('LoadingState', () => {

  test('renderiza texto', () => {
    const wrapper =
      mount(LoadingState);

    expect(
      wrapper.text()
    ).toContain(
      'Cargando'
    );
  });

});