import React, { useState, useEffect } from 'react';
import flashcardService from '../../services/flashcardService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import FlashcardSetCard from '../../components/flashcards/FlashcardSetCard';
import toast from 'react-hot-toast';

const FlashcardListPage = () => {

  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchFlashcardSets = async () => {
      try{
        const sets = await flashcardService.getAllFlashcards();
        setFlashcardSets(Array.isArray(sets) ? sets : []);
      } catch (error){
        toast.error('Failed to fetch flashcard sets.');
        console.error(error);
        setFlashcardSets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFlashcardSets();
  }, []);

  const renderContent = () => {
    if(loading) {
      return <Spinner />;
    }

    const safeSets = Array.isArray(flashcardSets) ? flashcardSets : [];

    if(safeSets.length === 0){
      return (
        <EmptyState
         title="No Flashcard Sets Found"
         description="You havent't generated any flashcards yet. Go to a document to create your first set."
        />
      );
    }

    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {safeSets.map((set) => (
          <FlashcardSetCard key={set?._id || `${set?.documentId || 'set'}-${Math.random()}`} flashcardSet={set} />
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title='All Flashcard Sets.' />
      <div className='mt-6'>
        {renderContent()}
      </div>
    </div>
  )
}

export default FlashcardListPage