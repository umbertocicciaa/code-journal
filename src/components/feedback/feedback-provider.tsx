"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FeedbackVariant = "error" | "success" | "info";

interface FeedbackState {
  open: boolean;
  title: string;
  message: string;
  variant: FeedbackVariant;
}

interface FeedbackContextValue {
  showError: (title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const initialState: FeedbackState = {
  open: false,
  title: "",
  message: "",
  variant: "info",
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FeedbackState>(initialState);

  const openFeedback = useCallback(
    (variant: FeedbackVariant, title: string, message: string) => {
      setState({ open: true, title, message, variant });
    },
    [],
  );

  const value = useMemo<FeedbackContextValue>(
    () => ({
      showError: (title, message) => openFeedback("error", title, message),
      showSuccess: (title, message) => openFeedback("success", title, message),
      showInfo: (title, message) => openFeedback("info", title, message),
    }),
    [openFeedback],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(open) => setState((current) => ({ ...current, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{state.title}</DialogTitle>
            <DialogDescription>{state.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant={state.variant === "error" ? "destructive" : "default"}
              onClick={() => setState((current) => ({ ...current, open: false }))}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return context;
}
