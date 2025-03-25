
import { ReactNode } from "react";

interface TabPanelProps {
  children: ReactNode;
  value: string;
  activeTab: string;
}

export function TabPanel({ children, value, activeTab }: TabPanelProps) {
  return activeTab === value ? (
    <div className="space-y-6 mt-6">{children}</div>
  ) : null;
}
