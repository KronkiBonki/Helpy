import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Trash2, Save } from "lucide-react";
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

type HelpMessage = {
  id: number;  // Changed from string to number
  message: string;  // Changed from text to message
};

const CustomHelp = () => {
  const navigate = useNavigate();
  const [helpText, setHelpText] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);  // Changed from string to number
  const [editingText, setEditingText] = useState("");

  // Fetch existing messages on mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("http://localhost:42069/custom-help", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        console.log("Fetched messages:", data); // Debug log
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Error fetching custom help messages:", err);
        toast.error("Failed to load custom help messages");
      }
    };
    fetchMessages();
  }, []);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    customHelpSchema.parse({ helpText });

    const res = await fetch("http://localhost:42069/custom-help", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: helpText }),
    });

    const data = await res.json();
    console.log("Post response:", data); // Debug log
    
    // Backend returns {message: {id: int, message: string}}
    if (data.message) {
      setMessages((prev) => [...prev, data.message]);
    }
    
    setHelpText("");
    toast.success("Custom help saved successfully!");
  } catch (err) {
    if (err instanceof z.ZodError) setError(err.errors[0].message);
    else {
      console.error(err);
      toast.error("Failed to save custom help");
    }
  }
};

  const handleDelete = async (id: number) => {  // Changed from string to number
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await fetch(`http://localhost:42069/custom-help/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      toast.success("Message deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete message");
    }
  };

  const handleEdit = (id: number, text: string) => {  // Changed from string to number
    setEditingId(id);
    setEditingText(text);
  };

  const handleSaveEdit = async (id: number) => {  // Changed from string to number
    try {
      customHelpSchema.parse({ helpText: editingText });

      const res = await fetch(`http://localhost:42069/custom-help/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: editingText }),  // Changed from text to message
      });

      const data = await res.json();
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? data.message : msg))
      );
      setEditingId(null);
      setEditingText("");
      toast.success("Message updated");
    } catch (err) {
      if (err instanceof z.ZodError) setError(err.errors[0].message);
      else {
        console.error(err);
        toast.error("Failed to update message");
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
      <main className="flex-1 flex flex-col items-center justify-start px-6 py-12 space-y-8 w-full max-w-3xl mx-auto">
        {/* Existing messages */}
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="w-full bg-card p-4 rounded-lg shadow flex flex-col space-y-2">
              {editingId === msg.id ? (
                <>
                  <Textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" onClick={() => handleSaveEdit(msg.id)} className="bg-green-500 hover:bg-green-600 flex items-center space-x-2">
                      <Save className="h-4 w-4" /> <span>Save</span>
                    </Button>
                    <Button size="sm" onClick={() => setEditingId(null)} className="bg-gray-500 hover:bg-gray-600">
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-start">
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => handleEdit(msg.id, msg.message)} className="bg-yellow-400 hover:bg-yellow-500 flex items-center">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleDelete(msg.id)} className="bg-red-500 hover:bg-red-600 flex items-center">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No custom help messages yet. Add one below!</p>
        )}

        {/* Add new message */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <Textarea
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            placeholder="Type your custom help instructions here..."
            className="min-h-[120px]"
            maxLength={500}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full bg-gradient-to-br from-primary to-primary-glow">
            Save Custom Help
          </Button>
        </form>
      </main>
    </div>
  );
};

export default CustomHelp;
