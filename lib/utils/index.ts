export function useDelay(fn:Function, delay: number) {
  if (delay) {
    setTimeout(() => {
      fn();
    }, delay);
  } else {
    fn();
  }
}
