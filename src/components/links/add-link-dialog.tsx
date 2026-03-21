"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateLink, useMetadata, useCheckDuplicate } from "@/hooks/use-links";
import { useUIStore } from "@/store/ui-store";
import { useFolders, useCreateFolder } from "@/hooks/use-folders";
import { FOLDER_COLORS } from "@/lib/validations/folder";
import { toast } from "sonner";
import { Loader2, Link2, ChevronDown, Check, FolderPlus, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  url: z.string().url("Please enter a valid URL"),
  folder_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddLinkDialogProps {
  children: React.ReactNode;
  defaultFolderId?: string;
  defaultUrl?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function FolderSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const { data: folders } = useFolders();
  const createFolder = useCreateFolder();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(FOLDER_COLORS[0]);

  const selected = folders?.find((f) => f.id === value);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      const folder = await createFolder.mutateAsync({ name, color: newColor });
      onChange(folder.id);
      setCreating(false);
      setNewName("");
      setNewColor(FOLDER_COLORS[0]);
      setOpen(false);
      toast.success(`Folder "${name}" created`);
    } catch {
      toast.error("Failed to create folder");
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:border-ring/50 transition-colors"
          )}
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: selected.color }}
              />
              {selected.name}
            </span>
          ) : (
            <span className="text-text-muted">No folder</span>
          )}
          <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-1" align="start">
        {/* No folder option */}
        <button
          type="button"
          onClick={() => { onChange(""); setOpen(false); }}
          className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent text-text-secondary"
        >
          No folder
          {!value && <Check className="w-4 h-4 text-brand-purple" />}
        </button>

        {/* Existing folders */}
        {folders && folders.length > 0 && (
          <div className="my-1 border-t border-border pt-1">
            {folders.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => { onChange(f.id); setOpen(false); }}
                className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: f.color }}
                  />
                  {f.name}
                </span>
                {value === f.id && <Check className="w-4 h-4 text-brand-purple" />}
              </button>
            ))}
          </div>
        )}

        {/* Create new folder */}
        <div className="border-t border-border mt-1 pt-1">
          {creating ? (
            <div className="px-2 py-2 space-y-2">
              <Input
                autoFocus
                placeholder="Folder name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleCreate(); }
                  if (e.key === "Escape") { setCreating(false); setNewName(""); }
                }}
                className="h-7 text-sm"
              />
              <div className="flex gap-1.5 flex-wrap">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                      newColor === color ? "border-text-primary scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 h-7 text-xs bg-brand-purple hover:bg-brand-purple-dark"
                  onClick={handleCreate}
                  disabled={!newName.trim() || createFolder.isPending}
                >
                  {createFolder.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => { setCreating(false); setNewName(""); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent text-brand-purple font-medium"
            >
              <FolderPlus className="w-4 h-4" />
              New folder
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AddLinkDialog({ children, defaultFolderId, defaultUrl, open: controlledOpen, onOpenChange }: AddLinkDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [debouncedUrl, setDebouncedUrl] = useState("");
  const createLink = useCreateLink();
  const { openDetailPanel } = useUIStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { url: defaultUrl ?? "", folder_id: defaultFolderId ?? "" },
  });

  const urlValue = form.watch("url");

  // When dialog opens with no pre-filled URL, try to read a URL from clipboard
  useEffect(() => {
    if (!open || defaultUrl) return;
    navigator.clipboard?.readText().then((text) => {
      const trimmed = text?.trim();
      if (!trimmed) return;
      try {
        new URL(trimmed);
        form.setValue("url", trimmed);
      } catch { /* not a URL */ }
    }).catch(() => { /* permission denied */ });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        new URL(urlValue);
        setDebouncedUrl(urlValue);
      } catch {
        setDebouncedUrl("");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [urlValue]);

  const { data: metadata, isFetching: isLoadingMeta } = useMetadata(
    debouncedUrl,
    debouncedUrl.length > 0
  );
  const { data: dupeCheck } = useCheckDuplicate(debouncedUrl);

  async function onSubmit(values: FormValues) {
    try {
      await createLink.mutateAsync({
        url: values.url,
        title: metadata?.title ?? undefined,
        description: metadata?.description ?? undefined,
        image_url: metadata?.image_url ?? undefined,
        folder_id: values.folder_id || null,
        reading_time_minutes: metadata?.reading_time_minutes ?? undefined,
      });
      toast.success("Link saved");
      form.reset({ url: "", folder_id: defaultFolderId ?? "" });
      setDebouncedUrl("");
      setOpen(false);
    } catch {
      toast.error("Failed to save link");
    }
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      form.reset({ url: "", folder_id: defaultFolderId ?? "" });
      setDebouncedUrl("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save a Link</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <Input
                        placeholder="https://example.com/article"
                        className="pl-9"
                        autoFocus
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Metadata preview */}
            {(isLoadingMeta || metadata) && debouncedUrl && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                {isLoadingMeta ? (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Fetching preview...
                  </div>
                ) : metadata ? (
                  <div className="flex gap-3">
                    {metadata.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={metadata.image_url}
                        alt=""
                        className="w-16 h-16 rounded object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary line-clamp-1">
                        {metadata.title}
                      </p>
                      {metadata.description && (
                        <p className="text-xs text-text-muted line-clamp-2 mt-0.5">
                          {metadata.description}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Duplicate warning */}
            {dupeCheck?.exists && dupeCheck.link && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 min-w-0">
                  <span className="font-medium">Already saved</span>
                  {dupeCheck.link.title && (
                    <span className="text-amber-700"> — {dupeCheck.link.title}</span>
                  )}
                  <button
                    type="button"
                    className="ml-1.5 underline font-medium text-amber-700 hover:text-amber-900"
                    onClick={() => {
                      handleOpenChange(false);
                      openDetailPanel(dupeCheck.link!.id);
                    }}
                  >
                    View it
                  </button>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="folder_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Folder{" "}
                    <span className="text-text-muted font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <FolderSelector value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-purple hover:bg-brand-purple-dark"
                disabled={createLink.isPending}
              >
                {createLink.isPending ? "Saving..." : "Save link"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
