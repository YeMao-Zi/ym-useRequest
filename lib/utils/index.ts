export function useDelay(fn: Function, delay: number) {
  if (delay) {
    setTimeout(() => {
      fn();
    }, delay);
  } else {
    fn();
  }
}

// function fn1(serve) {
//   console.log(1);
//   return serve;
// }
// function fn2(serve) {
//   console.log(2);
//   return serve;
// }
// function serve() {
//   console.log('serve');
// }
// const arr = [fn1, fn2];
// composeMiddleware(arr, serve)();
// 2
// 1
// serve
export const composeMiddleware = (middleArray: any[], hook: any) => {
  return () => {
    let next = hook;
    for (let i = middleArray.length; i-- > 0; ) {
      next = middleArray[i]!(next);
    }
    return next();
  };
};
