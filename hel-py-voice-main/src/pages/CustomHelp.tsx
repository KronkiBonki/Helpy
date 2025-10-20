import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const customHelpSchema = z.object({
  helpText: z.string()
    .trim()
    .min(1, { message: "Help text cannot be empty" })
    .max(500, { message: "Help text must be less than 500 characters" })
});

const CustomHelp = () => {
  const navigate = useNavigate();
  const [helpText, setHelpText] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      customHelpSchema.parse({ helpText });
      toast.success("Custom help saved successfully!");
      setHelpText("");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center bg-[hsl(var(--header-bg))]">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-[hsl(var(--header-text))] hover:bg-white/20"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold text-[hsl(var(--header-text))] ml-4">Custom Help</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="helpText" className="text-lg font-medium text-foreground">
                Enter your custom help message
              </label>
              <Textarea
                id="helpText"
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                placeholder="Type your custom help instructions here..."
                className="min-h-[200px] resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {helpText.length}/500 characters
                </p>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-br from-primary to-primary-glow"
            >
              Save Custom Help
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CustomHelp;
