"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from "react";
import { Send, Paperclip, X, FileText } from "lucide-react";

interface Attachment {
  name: string;
  contentType: string;
  url: string;
}

interface MessageInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: Attachment[] }
  ) => void;
  isLoading: boolean;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: MessageInputProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: Attachment[] = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        contentType: file.type,
        url: await readFileAsDataURL(file),
      }))
    );
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    handleSubmit(
      e,
      attachments.length > 0 ? { experimental_attachments: attachments } : undefined
    );
    setAttachments([]);
  };

  const canSubmit = input.trim() || attachments.length > 0;

  return (
    <form onSubmit={onSubmit} className="relative p-4 bg-white border-t border-neutral-200/60">
      <div className="relative max-w-4xl mx-auto">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((attachment, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-100 text-sm"
              >
                {attachment.contentType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="h-5 w-5 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                )}
                <span className="text-neutral-700 max-w-[150px] truncate text-xs">
                  {attachment.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="text-neutral-400 hover:text-neutral-600 ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe the component you want, or upload a PDF/image..."
          disabled={isLoading}
          className="w-full min-h-[80px] max-h-[200px] pl-4 pr-24 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-neutral-400 text-[15px] font-normal shadow-sm"
          rows={3}
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Upload PDF or image"
            className="p-2.5 rounded-lg transition-all hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Paperclip className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
          </button>
          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className="p-2.5 rounded-lg transition-all hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
          >
            <Send
              className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                isLoading || !canSubmit ? "text-neutral-300" : "text-blue-600"
              }`}
            />
          </button>
        </div>
      </div>
    </form>
  );
}
