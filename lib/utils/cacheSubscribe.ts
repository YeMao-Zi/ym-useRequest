type Listener = (data: any) => void;
const listeners: Record<string, Listener[]> = {};

export const subscribe = (key: string, listener: Listener) => {
  if (!listeners[key]) {
    listeners[key] = [];
  }
  listeners[key].push(listener)

  return ()=>{
    const index = listeners[key].indexOf(listener);
    listeners[key].splice(index, 1);
  }
};
