export function useDelay(fn: Function, delay?: number) {
  if (delay) {
    return setTimeout(() => {
      fn();
    }, delay);
  } else {
    fn();
  }
}

export const composeMiddleware = (middleArray: any[], hook: any) => {
  return () => {
    let next = hook;
    for (let i = middleArray.length; i-- > 0; ) {
      next = middleArray[i]!(next);
    }
    return next();
  };
};
