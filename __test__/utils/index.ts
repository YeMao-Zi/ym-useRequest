import { createApp, defineComponent } from 'vue';

export function mount<C>(Comp: C) {
  const el = document.createElement('div');
  const app = createApp(Comp as any);
  const unmount = () => app.unmount();
  const comp = app.mount(el) as any;
  comp.unmount = unmount;
  return comp;
}

export const componentVue = (setup: any) => {
  const demo = mount(
    defineComponent({
      template: '<div/>',
      setup,
    }),
  );

  return demo;
};
