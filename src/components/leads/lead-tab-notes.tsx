"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useAddLeadNote,
  useUpdateLeadNote,
  useDeleteLeadNote,
} from "@/hooks/use-lead-mutation";
import type { FullLead, LeadNote } from "@/types/lead";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type LeadTabNotesProps = {
  lead: FullLead;
  userRole: string;
};

export function LeadTabNotes({ lead, userRole }: LeadTabNotesProps) {
  const addNote = useAddLeadNote();
  const updateNote = useUpdateLeadNote();
  const deleteNote = useDeleteLeadNote();

  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const notes = (lead.notes ?? []) as LeadNote[];
  const canEdit = userRole === "SUPER_ADMIN" || userRole === "OWNER" || userRole === "MANAGER";

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    addNote.mutate(
      { leadId: lead.id, content: newNoteContent },
      {
        onSuccess: () => {
          setNewNoteContent("");
        },
      }
    );
  };

  const startEdit = (note: LeadNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditContent("");
  };

  const saveEdit = (noteId: string) => {
    if (!editContent.trim()) return;
    updateNote.mutate(
      { leadId: lead.id, noteId, content: editContent },
      {
        onSuccess: () => {
          setEditingNoteId(null);
          setEditContent("");
        },
      }
    );
  };

  const handleDelete = (noteId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote.mutate({ leadId: lead.id, noteId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Note Form */}
      <div className="space-y-3">
        <Label htmlFor="new-note">Add Note</Label>
        <Textarea
          id="new-note"
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Write a note..."
          rows={3}
          className="resize-none"
        />
        <Button
          onClick={handleAddNote}
          disabled={!newNoteContent.trim() || addNote.isPending}
          className="w-full"
        >
          {addNote.isPending ? "Adding..." : "Add Note"}
        </Button>
      </div>

      {/* Notes Timeline */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No notes yet. Add your first note above.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="border rounded-lg p-4 space-y-2 bg-card"
            >
              {editingNoteId === note.id ? (
                // Edit Mode
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveEdit(note.id)}
                      disabled={!editContent.trim() || updateNote.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {updateNote.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={updateNote.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEdit(note)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {note.createdBy.name} •{" "}
                      {formatDistanceToNow(new Date(note.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {note.updatedAt && (
                      <span className="text-xs">
                        Edited by {note.updatedBy?.name} •{" "}
                        {formatDistanceToNow(new Date(note.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
