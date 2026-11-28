import { createContext, useContext } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { STAFF_PAGES } from "./menus";

export const StaffAccount = createContext(null);

export function useStaffAccount() {
  return useContext(StaffAccount);
}

const orderedPages = [...STAFF_PAGES].sort((a, b) => a.path.includes(":") - b.path.includes(":"));

export function usePageInfo() {
  const { pathname } = useLocation();
  return orderedPages.find((page) => matchPath(page.path, pathname)) || null;
}
