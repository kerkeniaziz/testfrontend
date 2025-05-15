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
} from '@dnd-kit/sortable';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

import {SortableItem} from './pocketList'
import { Pocket, Subpocket } from '@/types';



const PocketCard = React.memo( function PocketCard({
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

  // const updatePocketOrder = async ({ id, order }: { id: string; order: number }) => {
  //   const res = await fetch(`http://localhost:8000/sub-pockets`, {
  //     method: 'PATCH',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ id, order }),
  //   });

  //   if (!res.ok) throw new Error('Failed to update order');
  //   return res.json();
  // };

  const updatePocketOrderBulk = async ({ updates }: { updates: { id: string; order: number }[] }) => {
    const res = await fetch(`http://localhost:8000/sub-pockets/order`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });

    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  };

  
  const { mutate: mutatePocketOrderBulk } = useMutation({
    mutationFn: updatePocketOrderBulk,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subPockets'] }),
  });

  // const { mutate: mutatePocketOrder } = useMutation({
  //   mutationFn: updatePocketOrder,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subPockets'] }),
  // });

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

    // updatedWithOrder.forEach((sub) => {
    //   const original = pocket.subPockets.find((p) => p.id === sub.id);
    //   if (original && original.order !== sub.order) {
    //     mutatePocketOrder({ id: sub.id, order: sub.order });
    //   }
    // });

    const changedSubPockets = updatedWithOrder
  .filter((sub) => {
    const original = pocket.subPockets.find((p) => p.id === sub.id);
    return original && original.order !== sub.order;
  })
  .map((sub) => ({
    id: sub.id,
    order: sub.order,
  }));
    
    if (changedSubPockets.length > 0) {
      mutatePocketOrderBulk({ updates: changedSubPockets });
    }
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
);

export default PocketCard;
