'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pocket, Subpocket } from './pocketList';

// ✅ SortableItem sous-composant
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// ✅ Composant principal PocketCard
export default function PocketCard({
  pocket,
  isOpen,
  onToggleOpen,
}: {
  pocket: Pocket;
  isOpen: boolean;
  onToggleOpen: () => void;
}) {
  
  const [orderedSubPockets, setOrderedSubPockets] = useState<Subpocket[]>(
    [...(pocket.subPockets ?? [])].sort((a, b) => a.order - b.order)
  );

  const queryClient = useQueryClient();

  const updatePocketOrder = async ({ id, order }: { id: string; order: number }) => {
    const res = await fetch(`http://localhost:8000/sub-pockets`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, order }),
    });

    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  };

  const { mutate: mutatePocketOrder } = useMutation({
    mutationFn: updatePocketOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subPockets'] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSubDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedSubPockets.findIndex((p) => p.id === active.id);
    const newIndex = orderedSubPockets.findIndex((p) => p.id === over.id);

    const reordered = [...orderedSubPockets];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const updatedWithOrder = reordered.map((p, index) => ({ ...p, order: index }));
    setOrderedSubPockets(updatedWithOrder);

    updatedWithOrder.forEach((sub) => {
      const original = pocket.subPockets.find((p) => p.id === sub.id);
      if (original && original.order !== sub.order) {
        mutatePocketOrder({ id: sub.id, order: sub.order });
      }
    });
  };

  return (
    <div className="border border-gray-300 shadow-md p-4 rounded-lg bg-white hover:shadow-lg transition">
      <h2
        className="text-xl font-semibold mb-2 cursor-pointer text-blue-600"
        onClick={onToggleOpen}
      >
        {pocket.name}
      </h2>
      <p className="text-gray-600 mb-2">Order: {pocket.order}</p>

      {isOpen && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubDragEnd}>
          <SortableContext items={orderedSubPockets.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="mt-4 border-t pt-2 text-sm text-gray-700">
              {orderedSubPockets.length === 0 ? (
                <li className="text-gray-400 italic">No subpockets</li>
              ) : (
                orderedSubPockets.map((sub) => (
                  <SortableItem key={sub.id} id={sub.id}>
                    <li className="py-1 pl-2 border-l-2 border-blue-400">📂 {sub.name}</li>
                  </SortableItem>
                ))
              )}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
