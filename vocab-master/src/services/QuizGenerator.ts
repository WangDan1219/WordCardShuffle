import type { VocabularyWord, QuizQuestion, QuestionFormat } from '../types';
import { shuffleArray, getRandomElement, generateDistractors, generateId } from '../utils';

/**
 * Generate a single quiz question
 */
export function generateQuizQuestion(
  word: VocabularyWord,
  allWords: VocabularyWord[],
  format: QuestionFormat = 'mcq'
): QuizQuestion {
  // Determine prompt type - prefer synonym if available
  const useSynonym = word.synonyms.length > 0 && Math.random() > 0.5;

  let prompt: string;
  let promptType: 'definition' | 'synonym';

  if (useSynonym && word.synonyms.length > 0) {
    prompt = getRandomElement(word.synonyms);
    promptType = 'synonym';
  } else if (word.definition.length > 0) {
    prompt = getRandomElement(word.definition);
    promptType = 'definition';
  } else {
    // Fallback - should not happen with valid data
    prompt = word.targetWord;
    promptType = 'definition';
  }

  // Generate distractors for MCQ
  const distractors = generateDistractors({
    targetWord: word.targetWord,
    allWords,
    count: 3
  });

  // Shuffle options with correct answer
  const options = shuffleArray([word.targetWord, ...distractors]);

  return {
    id: generateId(),
    word,
    promptType,
    prompt,
    options,
    correctAnswer: word.targetWord,
    format
  };
}

/**
 * Generate a set of quiz questions
 */
export function generateQuizQuestions(
  words: VocabularyWord[],
  count: number,
  format: QuestionFormat = 'mcq'
): QuizQuestion[] {
  const selectedWords = shuffleArray(words).slice(0, count);
  return selectedWords.map(word => generateQuizQuestion(word, words, format));
}

/**
 * Generate daily challenge questions with mixed formats
 */
export function generateDailyChallengeQuestions(
  words: VocabularyWord[],
  count: number = 20
): QuizQuestion[] {
  const selectedWords = shuffleArray(words).slice(0, count);

  return selectedWords.map(word => {
    // Randomly choose between MCQ and Type format
    const format: QuestionFormat = Math.random() > 0.5 ? 'mcq' : 'type';
    return generateQuizQuestion(word, words, format);
  });
}
