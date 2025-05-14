'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Subpocket } from './pocketList';
import { useUser } from '@/context/userContext';
import { User } from './userSelection';
import {  useQueryClient } from '@tanstack/react-query';

export default function SubPocketItem({ sub }: { sub: Subpocket }) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const { selectedUser } = useUser() ;
  const queryClient = useQueryClient();
  

  const handleClick = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  // Filter notes for selected user
  const userNotes = sub.notes?.filter(note => note.user.id === selectedUser?.id);
  

  async function AddNote(note: string, selectedUser:User , sub:Subpocket  ) {
    const res = await fetch('http://localhost:8000/sub-pockets/addNote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({
        description: note,
        user:selectedUser,
        subPocket:sub,
      }),
    });
  
    if (!res.ok) throw new Error('Failed to fetch pockets');
    
    return res.json();
  }

  async function handelSubmitNote(note: string , sub: Subpocket ) {
    if (!selectedUser) {
      console.error('No user selected');
      return;
    }
    try {
        const newNote = await AddNote(note, selectedUser, sub);
        if (newNote) {
        await queryClient.invalidateQueries({queryKey: ['pockets']});
         // ✅ Trigger refetch
        handleClose(); // ✅ Close the dialog
        setNote('');   // ✅ Clear input
    }
      } catch (err) {
        console.error('Error submitting note:', err);
      }
  }

  return (
    <>
      <li
        onClick={handleClick}
        className="cursor-pointer border-l-4 border-blue-400 pl-2 hover:bg-blue-50 transition text-gray-800"
      >
        📂 {sub.name}
        
       
        <ul className="ml-4 mt-1 space-y-1 text-sm text-gray-600">
          {userNotes?.map((note, index) => (
            <li key={index}>📝 {note.description}</li>
          ))}
        </ul>
      

      </li>

      <Dialog open={isOpen} onClose={handleClose} className="relative z-50 text-gray-800">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded shadow max-w-sm w-full">
            <Dialog.Title className="text-lg font-medium mb-4">Note for {sub.name}</Dialog.Title>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder="Enter your note..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handelSubmitNote(note, sub);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
