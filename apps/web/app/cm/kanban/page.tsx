"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

import KanbanBoard from "./_components/KanbanBoard";
import ManageComplaintModal from "./_components/ManageComplaintModal";
import { mockComplaints } from "./_components/kanban-mock";
import type { Complaint, ColumnId } from "./_components/kanban-types";

export default function KanbanPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  /* ---- Fetch data ---- */

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("complaints")
        .select(
          "id,ticket_id,title,description,status,severity,created_at,address_text,ward_name,assigned_department,assigned_officer_id,resolved_at,resolution_note"
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        setComplaints(mockComplaints);
      } else {
        setComplaints(
          (data && data.length > 0 ? data : mockComplaints) as Complaint[]
        );
      }
    } catch {
      setComplaints(mockComplaints);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Drag-and-drop ---- */

  const handleDragStart = (e: React.DragEvent, complaintId: string) => {
    setDraggedItem(complaintId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, _targetColumn: ColumnId) => {
    e.preventDefault();
    if (!draggedItem) return;

    const complaint = complaints.find((c) => c.id === draggedItem);
    if (complaint) {
      // Open the modal for confirmation instead of silently updating
      setSelectedComplaint({ ...complaint });
      setIsModalOpen(true);
    }
    setDraggedItem(null);
  };

  /* ---- Card click ---- */

  const handleCardClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };

  /* ---- Complaint update callback ---- */

  const handleComplaintUpdate = useCallback((updated: Complaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }, []);

  /* ---- Render ---- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#121212] dark:to-[#181818]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Workflow Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Drag and drop complaints between columns to update their status. A
            confirmation modal will open before any changes are saved.
          </p>
        </div>

        {/* Board */}
        <KanbanBoard
          complaints={complaints}
          loading={loading}
          draggedItem={draggedItem}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onCardClick={handleCardClick}
        />
      </div>

      {/* Modal */}
      <ManageComplaintModal
        complaint={selectedComplaint}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onComplaintUpdate={handleComplaintUpdate}
      />
    </div>
  );
}
