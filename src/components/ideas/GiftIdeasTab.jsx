import React from 'react';
import PersonGiftIdeas from './PersonGiftIdeas';

export default function GiftIdeasTab({ personName, personId, searchQuery }) {
  return (
    <div>
      <PersonGiftIdeas personName={personName} personId={personId} searchQuery={searchQuery} />
    </div>
  );
}