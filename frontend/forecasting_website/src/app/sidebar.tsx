import React from "react";
import { cn } from "@/lib/utils";
import { PlusCircle, Compass, Trophy, Github } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import Image from "next/image";
import CAISLogo from "@/app/assets/cais_logo.svg";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => (
  <div className="md:w-64 h-16 md:h-full p-2 md:p-3 flex flex-row md:flex-col border-t md:border-r border-border bg-background fixed bottom-0 left-0 right-0 md:sticky md:top-0 md:left-0 z-10">
    <div className="hidden md:flex items-center mb-4">
      <Image
        src="/favicon.svg"
        alt="Forecasting AI Logo"
        width={32}
        height={32}
      />
      <span className="ml-2 text-lg font-semibold">FiveThirtyNine</span>
    </div>

    <nav className="flex-grow flex flex-row md:flex-col justify-around md:justify-start">
      <ul className="flex flex-row md:flex-col md:space-y-1 w-full">
        <SidebarItem
          icon={<PlusCircle />}
          label="New Forecast"
          onClick={() => setActiveTab("ask")}
          special
          active={activeTab === "ask"}
        />
        <SidebarItem
          icon={<Compass />}
          label="Discover"
          onClick={() => setActiveTab("discover")}
          active={activeTab === "discover"}
        />
        {/* <SidebarItem
          icon={<Trophy />}
          label="Benchmark"
          onClick={() => setActiveTab("benchmark")}
          active={activeTab === "benchmark"}
        /> */}
        <SidebarItem
          icon={<Image src={CAISLogo} alt="CAIS Logo" width={24} height={24} />}
          label="Blog Post"
          onClick={() => window.open("https://www.safe.ai/blog/forecasting", "_blank")}
        />
        <SidebarItem
          icon={<GitHubLogoIcon width={24} height={24}/>}
          label="GitHub"
          onClick={() => window.open("https://github.com/centerforaisafety/forecasting", "_blank")}
        />
      </ul>
    </nav>

    <div className="hidden md:block mt-auto pt-4">
      <ThemeToggle />
    </div>
  </div>
);

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  special?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  onClick,
  active,
  special,
}) => (
  <li className="flex-1 md:flex-none">
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col md:flex-row items-center justify-center md:justify-start w-full transition-colors",
        "text-foreground",
        "group",
        active && "md:font-semibold"
      )}
    >
      <span
        className={cn(
          "rounded-full p-2 transition-colors",
          special ? "text-primary" : "group-hover:bg-accent/50"
        )}
      >
        <span className="text-lg">{icon}</span>
      </span>
      <span
        className={cn(
          "text-sm mt-1 md:mt-0 md:text-sm hidden md:inline",
          !active && "group-hover:font-medium"
        )}
      >
        {label}
      </span>
    </button>
  </li>
);

export default Sidebar;