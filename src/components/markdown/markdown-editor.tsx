"use client";

import { useState } from "react";
import { MarkdownViewer } from "@/components/markdown/markdown-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export function MarkdownEditor({
  name,
  defaultValue = "",
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Tabs defaultValue="write">
      <TabsList>
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="min-h-[240px] font-mono text-[13px]"
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="rounded-2xl border border-line bg-card-muted p-4">
          <MarkdownViewer content={value} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
