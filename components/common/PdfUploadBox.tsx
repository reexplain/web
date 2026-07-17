"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Upload, X } from "lucide-react";
import LoginDialog from "@/components/common/LoginDialog";
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
import { stagePdf } from "@/lib/staged-pdf";
import { cn } from "@/lib/utils";
import {
    SESSION_ROUTE,
    MAX_PDF_PAGE_COUNT,
    MAX_PDF_SIZE_BYTES,
    PDF_CONTENT_TYPE,
    PDF_UPLOAD_DESCRIPTION,
} from "@/utils/constants";

const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

type PdfUploadBoxProps = {
    isAuthenticated: boolean;
};

const PdfUploadBox = ({ isAuthenticated }: PdfUploadBoxProps) => {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const dragDepthRef = useRef(0);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const selectFile = (nextFile?: File) => {
        if (!nextFile) return;

        if (nextFile.type !== PDF_CONTENT_TYPE) {
            setError("Choose a PDF file to continue.");
            setFile(null);
            return;
        }

        if (nextFile.size > MAX_PDF_SIZE_BYTES) {
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

    const startExplanation = async () => {
        if (!file) return;

        setError("");
        setIsPreparing(true);

        try {
            await stagePdf(file);

            if (isAuthenticated) {
                router.push(SESSION_ROUTE);
                return;
            }

            setIsLoginOpen(true);
        } catch {
            setError("This browser could not prepare the PDF. Choose the file again.");
        } finally {
            setIsPreparing(false);
        }
    };

    return (
        <>
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
                            <div className="flex w-full gap-4 items-center">
                                <div className="flex min-w-0 flex-1 items-center gap-4">
                                    <div className="grid size-12 shrink-0 place-items-center bg-emerald-50 text-emerald-600">
                                        <FileText aria-hidden="true" className="size-6" strokeWidth={1.7} />
                                    </div>
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <p className="truncate font-medium">{file.name}</p>
                                        <p className="text-sm text-foreground/75">
                                            {formatFileSize(file.size)} · Ready to upload
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-lg"
                                    className="text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive size-12"
                                    onClick={clearFile}
                                    aria-label="Remove selected PDF"
                                    title="Remove PDF"
                                >
                                    <X aria-hidden="true" className="size-6" />
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
                                <span className="text-sm text-foreground/50">
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
                ) : (
                    <CardFooter
                        className={cn(
                            "flex flex-wrap items-center gap-3 px-5 pb-5",
                            file ? "justify-end" : "justify-between",
                        )}
                    >
                        {file ? (
                            <Button
                                className="bg-emerald-500 text-white hover:bg-emerald-600"
                                disabled={isPreparing}
                                onClick={startExplanation}
                            >
                                {isPreparing ? "Extracting PDF..." : "Explain this PDF"}
                                <ArrowRight aria-hidden="true" data-icon="inline-end" />
                            </Button>
                        ) : (
                            <span className="text-xs font-medium">
                                PDF • Up to 20 MB • {MAX_PDF_PAGE_COUNT} pages max
                            </span>
                        )}
                    </CardFooter>
                )}
            </Card>
            <LoginDialog
                callbackURL={SESSION_ROUTE}
                open={isLoginOpen}
                onOpenChange={setIsLoginOpen}
            />
        </>
    );
};

export default PdfUploadBox;