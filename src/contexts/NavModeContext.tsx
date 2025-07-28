import { createContext } from "react";

const NavModeContext = createContext<'sidebar' | 'dock'>("sidebar");
export default NavModeContext; 