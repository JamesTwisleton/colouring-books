"use client";

import { useState } from "react";
import { useChildren, useAddChild } from "@/hooks/useChildren";

interface ChildProfileSelectorProps {
  parentId: string;
  activeChildId: string | null;
  onSelect: (childId: string) => void;
}

export default function ChildProfileSelector({
  parentId,
  activeChildId,
  onSelect,
}: ChildProfileSelectorProps) {
  const { data: children = [], isLoading } = useChildren(parentId);
  const addChild = useAddChild();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");

  const AVATAR_COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
  ];
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const child = await addChild.mutateAsync({
      parentId,
      name: newName.trim(),
      avatarColor,
    });
    setShowForm(false);
    setNewName("");
    onSelect(child.id);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400 text-sm">Loading profiles…</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Who&apos;s coloring?</h2>
      <p className="text-gray-500 text-sm mb-5">Choose a profile to get started</p>

      <div className="flex flex-wrap gap-4">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => onSelect(child.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
              activeChildId === child.id
                ? "ring-3 ring-[#ff6b6b] ring-offset-2 scale-105"
                : "hover:scale-105"
            }`}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md"
              style={{ backgroundColor: child.avatarColor }}
            >
              {child.name[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {child.name}
            </span>
          </button>
        ))}

        {/* Add new child */}
        <button
          onClick={() => setShowForm(true)}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:scale-105 transition-all"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-gray-400 border-2 border-dashed border-gray-300 bg-gray-50">
            +
          </div>
          <span className="text-sm font-medium text-gray-400">Add child</span>
        </button>
      </div>

      {/* Add child modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Add a child profile
            </h3>
            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child&apos;s name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 focus:border-[#ff6b6b] text-sm"
                  placeholder="e.g. Lily"
                  autoFocus
                  required
                />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Pick a colour
                </p>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        avatarColor === c
                          ? "scale-125 ring-2 ring-gray-700"
                          : "hover:scale-110"
                      }`}
                      onClick={() => setAvatarColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setNewName("");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addChild.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-[#ff6b6b] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {addChild.isPending ? "Adding…" : "Add profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
