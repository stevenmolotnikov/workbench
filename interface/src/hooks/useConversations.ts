// hooks/useConversations.js
import { useState } from 'react';
import { Conversation } from '@/types/session';

export function useConversations() {
  const [savedConversations, setSavedConversations] = useState<Conversation[]>([]);
  const [activeConversations, setActiveConversations] = useState<Conversation[]>([]);
  
  const handleLoadConversation = (conversationToLoad: Conversation) => {
    // Check if the conversation (by ID) is already active
    if (activeConversations.some(conv => conv.id === conversationToLoad.id)) {
      console.log("Conversation already active:", conversationToLoad.id);
      return;
    }

    const newActiveConversation = {
      ...conversationToLoad,
      isExpanded: true, // Ensure it's expanded when loaded
      isNew: undefined
    };

    setActiveConversations(prev => [...prev, newActiveConversation]);
  };
  
  const handleSaveConversation = (id: string) => {
    const conversationToSave = activeConversations.find(conv => conv.id === id);
    if (conversationToSave) {
      // Create a saveable version (clean up transient flags if any)
      const savedVersion: Conversation = {
        ...conversationToSave,
        isNew: undefined, // Ensure isNew is not saved
      };

      setSavedConversations(prev => {
        // Check if a conversation with the same ID already exists
        const existingIndex = prev.findIndex(conv => conv.id === savedVersion.id);
        if (existingIndex !== -1) {
          // Update existing conversation
          const updatedSaved = [...prev];
          updatedSaved[existingIndex] = savedVersion;
          return updatedSaved;
        } else {
          // Add as new saved conversation
          return [...prev, savedVersion];
        }
      });
      // Update the title in the active conversation to remove "(unsaved)" if applicable
      handleUpdateConversation(id, { name: savedVersion.id });
    }
  };
  
  const handleDeleteConversation = (id: string) => {
    // Remove from active list
    setActiveConversations(prev => prev.filter(conv => conv.id !== id));
  };
  
  const handleUpdateConversation = (id: string, updates: Partial<Conversation>) => {
    setActiveConversations(prev => prev.map(conv =>
      conv.id === id
        ? { ...conv, ...updates }
        : conv
    ));
  };
  
  const handleIDChange = (id: string, newID: string) => {
    setActiveConversations(prev => prev.map(conv =>
      conv.id === id
        ? { ...conv, id: newID }
        : conv
    ));
  };
  
  return {
    savedConversations,
    activeConversations,
    handleLoadConversation,
    handleSaveConversation,
    handleDeleteConversation,
    handleUpdateConversation,
    handleIDChange
  };
}