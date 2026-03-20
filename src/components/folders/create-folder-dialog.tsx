"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createFolderSchema, FOLDER_COLORS, type CreateFolderInput } from "@/lib/validations/folder";
import { useCreateFolder } from "@/hooks/use-folders";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreateFolderDialogProps {
  children: React.ReactNode;
}

export function CreateFolderDialog({ children }: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const createFolder = useCreateFolder();

  const form = useForm<CreateFolderInput>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: { name: "", color: FOLDER_COLORS[0] },
  });

  async function onSubmit(values: CreateFolderInput) {
    try {
      await createFolder.mutateAsync(values);
      toast.success(`Folder "${values.name}" created`);
      form.reset();
      setOpen(false);
    } catch {
      toast.error("Failed to create folder");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Design Inspiration"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 flex-wrap">
                      {FOLDER_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                            field.value === color
                              ? "border-text-primary scale-110"
                              : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-purple hover:bg-brand-purple-dark"
                disabled={createFolder.isPending}
              >
                {createFolder.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
