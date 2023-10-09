import { createApp } from 'vue';

export function mount<C>(Comp: C) {
  const el = document.createElement('div');
  const app = createApp(Comp as any);
  const unmount = () => app.unmount();
  const comp = app.mount(el) as any;
  comp.unmount = unmount;
  return comp;
}
