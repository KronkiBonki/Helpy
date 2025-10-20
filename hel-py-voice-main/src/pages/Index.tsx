import { Mic, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between bg-[hsl(var(--header-bg))]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full text-[hsl(var(--header-text))] hover:bg-white/20">
              <MoreVertical className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-card z-50">
            <DropdownMenuItem onClick={() => navigate("/custom-help")}>
              Custom Help
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <h1 className="text-2xl font-bold text-[hsl(var(--header-text))]">Helpy</h1>
        <div className="w-10"></div>
      </header>

      {/* Main Content - Centered Mic Button */}
      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <Button
          variant="default"
          size="icon"
          className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] hover:scale-105 transition-all duration-300"
        >
          <Mic className="h-16 w-16" />
        </Button>
      </main>
    </div>
  );
};

export default Index;
