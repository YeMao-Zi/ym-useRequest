export function useLoadingDelay(fn:Function, loadingDelay: number) {
  if (loadingDelay) {
    setTimeout(() => {
      fn();
    }, loadingDelay);
  } else {
    fn();
  }
}
