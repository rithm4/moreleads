import { createContext, useContext, useState, useCallback } from 'react';

const FabContext = createContext({ action: null, setFabAction: () => {} });

export function FabProvider({ children }) {
  const [action, setAction] = useState(null);

  const setFabAction = useCallback((fn) => {
    setAction(() => fn); // fn=null hides the FAB
  }, []);

  return (
    <FabContext.Provider value={{ action, setFabAction }}>
      {children}
    </FabContext.Provider>
  );
}

export const useFab = () => useContext(FabContext);
