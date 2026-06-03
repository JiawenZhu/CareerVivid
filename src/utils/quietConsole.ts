const isProductionBuild = import.meta.env.PROD;

export const quietProductionConsole = () => {
  if (!isProductionBuild || typeof window === 'undefined') return;

  console.log = () => undefined;
  console.debug = () => undefined;
  console.info = () => undefined;
};

