"use client";

import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import type { DashboardSnapshot, DeleteSessionButtonProps } from "@/types/dashboard";
import { cn } from "@/utils/ui/cn";

const isDashboardSnapshot = (value: unknown): value is DashboardSnapshot => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DashboardSnapshot>;
  return (
    Array.isArray(candidate.sessions) &&
    Array.isArray(candidate.practiceExcerpts) &&
    Boolean(candidate.masteryGraph) &&
    Array.isArray(candidate.masteryGraph?.nodes) &&
    Array.isArray(candidate.masteryGraph?.edges)
  );
};

const readResponse = async (response: Response) => {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : "The session could not be deleted.";
    throw new Error(message);
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("dashboardSnapshot" in body) ||
    !isDashboardSnapshot(body.dashboardSnapshot)
  ) {
    throw new Error("The dashboard could not be refreshed after deletion.");
  }
  return body.dashboardSnapshot;
};

const DeleteSessionButton = ({
  className,
  filename,
  onDeleted,
  sessionId,
}: DeleteSessionButtonProps) => {
  const router = useRouter();
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
      const dashboardSnapshot = await readResponse(response);

      onDeleted(dashboardSnapshot);
      setIsOpen(false);
      toast.success("Session deleted.");
      router.refresh();
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
          className={cn(className)}
          variant="destructive"
        >
          <Trash2 aria-hidden="true" data-icon="inline-start" />
          Delete session
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
