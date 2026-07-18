"use client";

import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteSessionButtonProps = {
  filename: string;
  onDeleted: (sessionId: string) => void;
  sessionId: string;
};

const readError = async (response: Response) => {
  const body: unknown = await response.json().catch(() => null);
  return body && typeof body === "object" && "error" in body && typeof body.error === "string"
    ? body.error
    : "The session could not be deleted.";
};

const DeleteSessionButton = ({ filename, onDeleted, sessionId }: DeleteSessionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteSession = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/learning-sessions/${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error(await readError(response));

      onDeleted(sessionId);
      setIsOpen(false);
      toast.success("Session deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The session could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Delete session for ${filename}`}
          className="absolute bottom-3 right-3 text-foreground/50 hover:bg-destructive/10 hover:text-destructive"
          size="icon-sm"
          title="Delete session"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-secondary text-2xl font-medium">
            Delete this session?
          </DialogTitle>
          <DialogDescription>
            This permanently deletes the learning session for {filename}, including its turns,
            concepts, evidence, questions, snapshots, source PDF, chunks, and embeddings. Source
            data shared by another session will be preserved.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={isDeleting} variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={isDeleting} onClick={() => void deleteSession()} variant="destructive">
            {isDeleting ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 aria-hidden="true" />
                Delete session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSessionButton;