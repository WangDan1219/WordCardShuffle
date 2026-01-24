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
 * Generate a multi-select question for daily challenge
 * Shows the target word and asks user to select all matching synonyms or definitions
 */
function generateMultiSelectQuestion(
  word: VocabularyWord,
  allWords: VocabularyWord[]
): QuizQuestion {
  // Decide whether to ask for synonyms or definitions
  const hasSynonyms = word.synonyms.length > 0;
  const hasDefinitions = word.definition.length > 0;

  // Prefer synonyms if available, otherwise use definitions
  const useSynonym = hasSynonyms && (Math.random() > 0.3 || !hasDefinitions);

  let correctAnswers: string[];
  let promptType: 'definition' | 'synonym';
  let distractorPool: string[];

  if (useSynonym && hasSynonyms) {
    // Pick 1-3 synonyms as correct answers (max based on available)
    const maxCorrect = Math.min(3, word.synonyms.length);
    const numCorrect = Math.max(1, Math.floor(Math.random() * maxCorrect) + 1);
    correctAnswers = shuffleArray([...word.synonyms]).slice(0, numCorrect);
    promptType = 'synonym';

    // Build distractor pool from other words' synonyms
    distractorPool = allWords
      .filter(w => w.targetWord !== word.targetWord)
      .flatMap(w => w.synonyms)
      .filter(s => !correctAnswers.includes(s) && s !== word.targetWord);
  } else {
    // Pick 1-3 definitions as correct answers
    const maxCorrect = Math.min(3, word.definition.length);
    const numCorrect = Math.max(1, Math.floor(Math.random() * maxCorrect) + 1);
    correctAnswers = shuffleArray([...word.definition]).slice(0, numCorrect);
    promptType = 'definition';

    // Build distractor pool from other words' definitions
    distractorPool = allWords
      .filter(w => w.targetWord !== word.targetWord)
      .flatMap(w => w.definition)
      .filter(d => !correctAnswers.includes(d));
  }

  // Calculate how many distractors we need (total 4 options)
  const numDistractors = 4 - correctAnswers.length;

  // Select random distractors
  const distractors = shuffleArray(distractorPool).slice(0, numDistractors);

  // If not enough distractors, pad with what we have
  while (distractors.length < numDistractors && distractorPool.length > 0) {
    const remaining = distractorPool.filter(d => !distractors.includes(d));
    if (remaining.length === 0) break;
    distractors.push(remaining[0]);
  }

  // Shuffle all options together
  const options = shuffleArray([...correctAnswers, ...distractors]);

  return {
    id: generateId(),
    word,
    promptType,
    prompt: word.targetWord, // Show the word, ask for synonyms/definitions
    options,
    correctAnswer: correctAnswers[0], // For backwards compatibility
    correctAnswers,
    format: 'multi-select'
  };
}

/**
 * Generate daily challenge questions with multi-select format
 */
export function generateDailyChallengeQuestions(
  words: VocabularyWord[],
  count: number = 20
): QuizQuestion[] {
  const selectedWords = shuffleArray(words).slice(0, count);

  return selectedWords.map(word => generateMultiSelectQuestion(word, words));
}
