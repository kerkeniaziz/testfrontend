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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import PocketCard from './pocketCard';

export interface Subpocket {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Pocket {
  id: string;
  name: string;
  description: string;
  order: number;
  subPockets: Subpocket[];
}

const fetchPockets = async (): Promise<Pocket[]> => {
  const res = await fetch('http://localhost:8000/pockets');
  if (!res.ok) throw new Error('Failed to fetch pockets');
  return res.json();
};

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

export default function PocketList() {
  const { data: pockets, isLoading, isError } = useQuery({ queryKey: ['pockets'], queryFn: fetchPockets });
  const [openPocketId, setOpenPocketId] = useState<string | null>(null);
  const [orderedPockets, setOrderedPockets] = useState<Pocket[] | null>(null);

  const pocketData = (orderedPockets || pockets || []).slice().sort((a, b) => a.order - b.order);



///// react query to patch the orders
  
const queryClient = useQueryClient();

const updatePocketOrder = async ({ id, order }: { id: string; order: number }) => {
  const res = await fetch(`http://localhost:8000/pockets`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, order }),
  });

  if (!res.ok) throw new Error('Failed to update order');
  
  return res.json(); 
};

const { mutate: mutatePocketOrder } = useMutation({
  mutationFn: updatePocketOrder,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pockets'] }),
});
//////////////////////////////

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  /// handel the drag and mutate the order with backend
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    // Check if the drag-and-drop action is valid
    if (!over || active.id === over.id) return;
  
    // Find the old and new indexes of the pockets in the array
    const oldIndex = pocketData.findIndex((p) => p.id === active.id);
    const newIndex = pocketData.findIndex((p) => p.id === over.id);
  
    // Create a new array of pockets with updated order
    const reordered = [...pocketData];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
  
    // Update the order of each pocket based on the new index
    const updatedWithOrder = reordered.map((pocket, index) => ({
      ...pocket,
      order: index,
    }));
  
    // Update the UI with the new order
    setOrderedPockets(updatedWithOrder);
  
    // Trigger the mutation to update the order on the backend
    updatedWithOrder.forEach((pocket) => {
      // Only trigger the mutation if the order has actually changed
      if (pocket.order !== pocketData.find((p) => p.id === pocket.id)?.order) {
        mutatePocketOrder({ id: pocket.id, order: pocket.order });
      }
    });
  };
  
  
  
  

  if (isLoading) return <p>Loading pockets...</p>;
  if (isError) return <p>Failed to load pockets.</p>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pocketData.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {pocketData.map((pocket) => (
            <SortableItem key={pocket.id} id={pocket.id}>
              <PocketCard
                pocket={pocket}
                isOpen={openPocketId === pocket.id}
                onToggleOpen={() =>
                  setOpenPocketId((prev) => (prev === pocket.id ? null : pocket.id))
                }
              />
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
