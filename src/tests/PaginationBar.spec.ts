import { mount } from '@vue/test-utils';

import PaginationBar
  from '@/components/ui/PaginationBar.vue';

describe('PaginationBar', () => {

  test('deshabilita Anterior en la primera página', () => {
    const wrapper = mount(PaginationBar, {
      props: { page: 1, totalPages: 3 },
    });

    const buttons = wrapper.findAll('button');

    expect(buttons[0]!.attributes('disabled')).toBeDefined();
    expect(buttons[1]!.attributes('disabled')).toBeUndefined();
  });

  test('emite la nueva página al presionar Siguiente', async () => {
    const wrapper = mount(PaginationBar, {
      props: { page: 1, totalPages: 3 },
    });

    await wrapper.findAll('button')[1]!.trigger('click');

    expect(wrapper.emitted('update:page')?.[0]).toEqual([2]);
  });

});