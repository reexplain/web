"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PDF_UPLOAD_DESCRIPTION } from "@/utils/constants";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const PdfUploadBox = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const dragDepthRef = useRef(0);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const selectFile = (nextFile?: File) => {
        if (!nextFile) return;

        if (nextFile.type !== "application/pdf") {
            setError("Choose a PDF file to continue.");
            setFile(null);
            return;
        }

        if (nextFile.size > MAX_FILE_SIZE) {
            setError("Choose a PDF smaller than 20 MB.");
            setFile(null);
            return;
        }

        setError("");
        setFile(nextFile);
    };

    const clearFile = () => {
        setFile(null);
        setError("");
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <Card
            className={cn(
                "upload-shell gap-0 py-0 shadow-none",
                isDragging && "upload-shell-active",
            )}
            onDragEnter={(event) => {
                event.preventDefault();
                dragDepthRef.current += 1;
                setIsDragging(true);
            }}
            onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            }}
            onDragLeave={(event) => {
                event.preventDefault();
                dragDepthRef.current -= 1;

                if (dragDepthRef.current <= 0) {
                    dragDepthRef.current = 0;
                    setIsDragging(false);
                }
            }}
            onDrop={(event) => {
                event.preventDefault();
                dragDepthRef.current = 0;
                setIsDragging(false);
                selectFile(event.dataTransfer.files[0]);
            }}
        >
            <CardHeader className="flex flex-col gap-2 p-5">
                <CardTitle className="flex w-full flex-wrap items-center justify-between gap-3 font-secondary text-xl font-medium sm:text-2xl">
                    <span>Start with something you&apos;re learning</span>
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed sm:text-base">
                    {PDF_UPLOAD_DESCRIPTION}
                </CardDescription>
            </CardHeader>

            <CardContent className="px-5 pb-5">
                <Field className="gap-0" data-invalid={Boolean(error)}>
                    <div className="upload-dropzone">
                        <Input
                            ref={inputRef}
                            className="sr-only"
                            type="file"
                            accept="application/pdf,.pdf"
                            aria-invalid={Boolean(error)}
                            onChange={(event) => selectFile(event.target.files?.[0])}
                        />

                        {file ? (
                            <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-center">
                                <div className="flex min-w-0 flex-1 items-center gap-4">
                                    <div className="grid size-14 shrink-0 place-items-center bg-foreground text-background">
                                        <FileText aria-hidden="true" className="size-6" strokeWidth={1.7} />
                                    </div>
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <p className="truncate font-medium">{file.name}</p>
                                        <p className="text-sm text-foreground/55">
                                            {formatFileSize(file.size)} · Ready to upload
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-lg"
                                    className="shrink-0"
                                    onClick={clearFile}
                                    aria-label="Remove selected PDF"
                                    title="Remove PDF"
                                >
                                    <X aria-hidden="true" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex w-full flex-col items-start gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => inputRef.current?.click()}
                                    aria-label="Choose a PDF"
                                    title="Choose a PDF"
                                >
                                    <Upload aria-hidden="true" data-icon="inline-start" strokeWidth={1.7} />
                                    Choose a PDF
                                </Button>
                                <span className="text-sm text-foreground/55">
                                    or drag and drop it anywhere in this box
                                </span>
                            </div>
                        )}
                    </div>
                </Field>
            </CardContent>

            {error ? (
                <CardFooter className="px-5 pb-5">
                    <FieldError className="text-xs font-medium">{error}</FieldError>
                </CardFooter>
            ) : <CardFooter className="px-5 pb-5 text-xs font-medium">
                PDF • Up to 20 MB
            </CardFooter>}
        </Card>
    );
};

export default PdfUploadBox;