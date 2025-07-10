export const processStepsAsync = (
  steps: number,
  resolver: (stepIndex: number) => unknown,
  options?: { onComplete: Function }
) => {
  let index = 0;

  return new Promise((resolve) => {
    const start = () => {
      const next = async () => {
        resolver(index);
        index++;
        if (index < steps) {
          setTimeout(next, 0);
          return;
        }
        options?.onComplete();
        resolve("success");
      };
      next();
    };
    start();
  });
};
