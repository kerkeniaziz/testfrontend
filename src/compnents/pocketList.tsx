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
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Subpocket {
  id: string;
  name: string;
  description: string;
  order: number;
}

interface Pocket {
  id: string;
  name: string;
  description: string;
  order: number;
  createdAt: string;
  subpockets: Subpocket[];
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

  const pocketData = orderedPockets || pockets || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Reorder pockets
    const oldIndex = pocketData.findIndex((p) => p.id === active.id);
    const newIndex = pocketData.findIndex((p) => p.id === over.id);
    const newOrder = [...pocketData];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    setOrderedPockets(newOrder);
  };

  if (isLoading) return <p>Loading pockets...</p>;
  if (isError) return <p>Failed to load pockets.</p>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pocketData.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {pocketData.map((pocket) => (
            <SortableItem key={pocket.id} id={pocket.id}>
              <div className="border border-gray-300 shadow-md p-4 rounded-lg bg-white hover:shadow-lg transition">
                <h2
                  className="text-xl font-semibold mb-2 cursor-pointer text-blue-600"
                  onClick={() => setOpenPocketId((prev) => (prev === pocket.id ? null : pocket.id))}
                >
                  {pocket.name}
                </h2>
                <p className="text-gray-600 mb-2">{pocket.description}</p>

                {openPocketId === pocket.id && (
                  <ul className="mt-4 border-t pt-2 text-sm text-gray-700">
                    <SortableContext items={pocket.subpockets.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                      {pocket.subpockets?.length === 0 && (
                        <li className="text-gray-400 italic">No subpockets</li>
                      )}
                      {pocket.subpockets?.map((sub) => (
                        <SortableItem key={sub.id} id={sub.id}>
                          <li className="py-1 pl-2 border-l-2 border-blue-400">📂 {sub.name}</li>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </ul>
                )}
              </div>
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
