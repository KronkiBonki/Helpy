import { Mic, MoreVertical, StopCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const responseRef = useRef<HTMLDivElement>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:42069/cookie", {
          method: "GET",
          credentials: "include",
        });
        
        const data = await response.json();
        
        if (data.cookie) {
          setIsAuthenticated(true);
        } else {
          await fetch("http://localhost:42069/auth", {
            method: "GET",
            credentials: "include",
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        try {
          await fetch("http://localhost:42069/auth", {
            method: "GET",
            credentials: "include",
          });
          setIsAuthenticated(true);
        } catch (authError) {
          console.error("Error authenticating:", authError);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Try different MIME types in order of preference
    let mimeType = '';
    const supportedTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav'
    ];
    
    for (const type of supportedTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        console.log('Using MIME type:', mimeType);
        break;
      }
    }
    
    const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log('Data chunk received:', event.data.size, 'bytes');
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      console.log('Total chunks:', audioChunksRef.current.length);
      
      // Determine file extension based on MIME type
      let extension = 'webm';
      if (mimeType.includes('mp4')) extension = 'm4a';
      else if (mimeType.includes('mpeg')) extension = 'mp3';
      else if (mimeType.includes('ogg')) extension = 'ogg';
      else if (mimeType.includes('wav')) extension = 'wav';
      
      console.log('Audio format:', extension);
      
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
      
      // Debug: Log the blob size
      console.log('Blob size:', audioBlob.size, 'bytes');
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(",")[1];
        
        if (base64Audio) {
          console.log('Base64 length:', base64Audio.length);
          
          try {
            const response = await fetch("http://localhost:42069/voice", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({ 
                audio: base64Audio,
                format: extension
              }),
            });
            
            const data = await response.json();
            setResponse(data.response);
          } catch (error) {
            console.error("Error sending audio:", error);
            setResponse("Error: Could not get response from server");
          }
        }
      };

      stream.getTracks().forEach((track) => track.stop());
    };

    // Start with timeslice to ensure data is captured periodically
    mediaRecorder.start(100); // Request data every 100ms
    setIsRecording(true);
  } catch (error) {
    console.error("Error accessing microphone:", error);
  }
};

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const closeResponse = () => {
    setResponse(null);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (responseRef.current && !responseRef.current.contains(e.target as Node)) {
      closeResponse();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && response) {
        closeResponse();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [response]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
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

      <main 
        className="flex-1 flex items-center justify-center px-6 pb-20 relative"
        onClick={response ? handleBackgroundClick : undefined}
      >
        <Button
          variant="default"
          size="icon"
          onClick={handleButtonClick}
          disabled={!isAuthenticated}
          className={`h-32 w-32 rounded-full ${
            isRecording
              ? "bg-gradient-to-br from-red-500 to-red-600 animate-pulse"
              : "bg-gradient-to-br from-primary to-primary-glow"
          } shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-elegant)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? (
            <StopCircle className="h-16 w-16" />
          ) : (
            <Mic className="h-16 w-16" />
          )}
        </Button>

        {response && (
          <div className="absolute inset-0 bg-black/50 flex items-end justify-center p-6 animate-in fade-in duration-300">
            <div
              ref={responseRef}
              className="bg-card rounded-t-3xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Response</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeResponse}
                  className="rounded-full hover:bg-secondary"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{response}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
