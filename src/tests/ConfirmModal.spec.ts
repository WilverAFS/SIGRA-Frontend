import { mount } from '@vue/test-utils';

import ConfirmModal
  from '@/components/ui/ConfirmModal.vue';

describe('ConfirmModal', () => {

  test('no se muestra cuando está cerrado', () => {
    const wrapper = mount(ConfirmModal, {
      props: { modelValue: false },
    });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  test('emite confirm al presionar Confirmar', async () => {
    const wrapper = mount(ConfirmModal, {
      props: { modelValue: true },
    });

    const buttons = wrapper.findAll('button');

    await buttons[1]!.trigger('click');

    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  test('se cierra al presionar Cancelar', async () => {
    const wrapper = mount(ConfirmModal, {
      props: { modelValue: true },
    });

    await wrapper.findAll('button')[0]!.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

});