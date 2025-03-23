const API_KEY = 'AIzaSyBoyn3fAy0h7T9q9EjTk8GV6CPJWvOpIQM';

const FALLBACK_RESPONSES = {
  general: "I'm sorry, I couldn't connect to the AI service. Here's a general response that might help.",
  quiz: {
    topic: "Sample Quiz",
    questions: Array(10).fill(null).map((_, i) => ({
      question: `Sample question ${i + 1}?`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      difficulty: "medium",
      explanation: "This is a sample explanation for the correct answer."
    }))
  },
  studyPlan: "Here's a basic study plan template you can follow:\n\n1. Day 1-2: Introduction to the topic\n2. Day 3-5: Core concepts\n3. Day 6-7: Practice exercises\n4. Day 8-9: Advanced topics\n5. Day 10: Review and self-assessment",
  summary: "This is a summary of the provided text. The key points include the main ideas and important details."
};

export async function getAIResponse(prompt: string): Promise<string> {
  if (!prompt?.trim()) {
    console.error('AI API Error: Empty prompt');
    return 'FALLBACK_RESPONSES.general';
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return FALLBACK_RESPONSES.general;
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('AI API Error: Failed to parse response', parseError);
      return FALLBACK_RESPONSES.summary;
    }

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('AI API Error: Invalid response structure', data);
      return FALLBACK_RESPONSES.general;
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('AI API Error:', error);
    return FALLBACK_RESPONSES.general;
  }
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface Quiz {
  topic: string;
  questions: QuizQuestion[];
}

export async function generateQuiz(topic: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<Quiz> {
  const prompt = `Create a ${difficulty} difficulty quiz about ${topic}. Generate exactly 10 multiple choice questions.
  
  Important: Your response must be a valid JSON object with this exact structure:
  {
    "topic": "${topic}",
    "questions": [
      {
        "question": "The actual question text",
        "options": ["First option", "Second option", "Third option", "Fourth option"],
        "correctAnswer": 0,
        "difficulty": "${difficulty}",
        "explanation": "A clear explanation of why the correct answer is right"
      }
    ]
  }

  Requirements:
  - Generate exactly 10 questions
  - Each question must have exactly 4 options
  - correctAnswer must be the index (0-3) of the correct option
  - Ensure the JSON is properly formatted with no trailing commas
  - Use double quotes for strings
  - Do not include any text before or after the JSON object
  - Make questions appropriate for the selected difficulty level
  - Provide clear, educational explanations`;

  try {
    const response = await getAIResponse(prompt);
    let cleanedResponse = response.trim();
    
    // Remove markdown code blocks if present
    cleanedResponse = cleanedResponse.replace(/^```json\n?|\n?```$/g, '');
    
    try {
      const quiz = JSON.parse(cleanedResponse);

      // Validate quiz structure
      if (!quiz || typeof quiz !== 'object') {
        console.warn('Invalid quiz format: not an object');
        return createFallbackQuiz(topic, difficulty);
      }

      if (!quiz.topic || typeof quiz.topic !== 'string') {
        console.warn('Invalid quiz format: missing or invalid topic');
        return createFallbackQuiz(topic, difficulty);
      }

      if (!Array.isArray(quiz.questions) || quiz.questions.length !== 10) {
        console.warn('Invalid quiz format: missing or invalid questions array');
        return createFallbackQuiz(topic, difficulty);
      }

      // Validate each question
      const isValidQuestion = (q: any): q is QuizQuestion => {
        return (
          q &&
          typeof q === 'object' &&
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.options.every((opt: string) => typeof opt === 'string') &&
          typeof q.correctAnswer === 'number' &&
          q.correctAnswer >= 0 &&
          q.correctAnswer <= 3 &&
          typeof q.explanation === 'string' &&
          typeof q.difficulty === 'string'
        );
      };

      if (!quiz.questions.every(isValidQuestion)) {
        console.warn('Invalid quiz format: one or more questions are invalid');
        return createFallbackQuiz(topic, difficulty);
      }

      return quiz;
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', {
        error: parseError,
        response: cleanedResponse
      });
      return createFallbackQuiz(topic, difficulty);
    }
  } catch (error) {
    console.error('Failed to generate quiz:', error);
    return createFallbackQuiz(topic, difficulty);
  }
}

function createFallbackQuiz(topic: string, difficulty: 'easy' | 'medium' | 'hard'): Quiz {
  const fallbackQuiz = { 
    ...FALLBACK_RESPONSES.quiz, 
    topic,
    questions: FALLBACK_RESPONSES.quiz.questions.map(q => ({ 
      ...q, 
      difficulty: difficulty as 'easy' | 'medium' | 'hard' 
    }))
  };
  return fallbackQuiz;
}

export async function evaluateQuizAnswers(quiz: Quiz, userAnswers: number[]): Promise<string> {
  if (!quiz || !Array.isArray(userAnswers)) {
    return FALLBACK_RESPONSES.general;
  }

  const correctAnswers = quiz.questions.map(q => q.correctAnswer);
  const score = userAnswers.reduce((acc, ans, idx) => acc + (ans === correctAnswers[idx] ? 1 : 0), 0);
  
  const wrongQuestions = quiz.questions.filter((q, idx) => userAnswers[idx] !== q.correctAnswer);
  
  const prompt = `The user took a quiz on ${quiz.topic} and got ${score} out of ${quiz.questions.length} questions correct.
    Here are the questions they got wrong:
    ${wrongQuestions.map(q => `- ${q.question} (They chose: ${q.options[userAnswers[quiz.questions.indexOf(q)]]}, Correct: ${q.options[q.correctAnswer]})`).join('\n')}
    
    Please provide:
    1. A brief analysis of their performance
    2. Specific areas they need to improve
    3. Study tips for the topics they struggled with
    4. Encouragement for their next attempt`;

  try {
    const response = await getAIResponse(prompt);
    return response || FALLBACK_RESPONSES.general;
  } catch (error) {
    console.error('Failed to evaluate quiz answers:', error);
    return `You scored ${score} out of ${quiz.questions.length} (${Math.round((score/quiz.questions.length)*100)}%).
    
    Performance Analysis:
    You did ${score > quiz.questions.length/2 ? 'well' : 'okay'} on this quiz, but there's room for improvement.
    
    Areas to Improve:
    Focus on the questions you got wrong and review those topics.
    
    Study Tips:
    - Review the explanations for the questions you missed
    - Take notes on key concepts
    - Practice with similar questions
    
    Keep going! Each attempt helps you learn more and improve your understanding.`;
  }
}

export async function generateStudyPlan(topic: string, deadline: string): Promise<string> {
  if (!topic?.trim() || !deadline?.trim()) {
    return FALLBACK_RESPONSES.studyPlan;
  }

  const prompt = `Create a detailed study plan for ${topic} with deadline ${deadline}. Include:
    1. Daily breakdown of topics
    2. Learning objectives for each session
    3. Recommended study materials and resources
    4. Practice exercises and self-assessment methods
    5. Time management tips`;
  
  try {
    const response = await getAIResponse(prompt);
    return response || FALLBACK_RESPONSES.studyPlan.replace("the topic", topic);
  } catch (error) {
    console.error('Failed to generate study plan:', error);
    return FALLBACK_RESPONSES.studyPlan.replace("the topic", topic);
  }
}

export async function summarizeText(text: string): Promise<string> {
  if (!text?.trim()) {
    return FALLBACK_RESPONSES.summary;
  }

  const prompt = `Provide a comprehensive summary of the following text, highlighting key points and main ideas: ${text}`;
  
  try {
    const response = await getAIResponse(prompt);
    return response || FALLBACK_RESPONSES.summary;
  } catch (error) {
    console.error('Failed to summarize text:', error);
    return FALLBACK_RESPONSES.summary;
  }
}

export async function performOCR(imageUrl: string): Promise<string> {
  if (!imageUrl?.trim()) {
    return 'No image provided';
  }
  return `Simulated OCR text from image: ${imageUrl.substring(0, 30)}...`;
}

interface Document {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'document' | 'quiz';
  createdAt: Date;
  lastModified: Date;
  tags: string[];
}

const STORAGE_KEY = 'levelup_documents';

export function saveDocument(title: string, content: string, type: 'note' | 'document' | 'quiz', tags: string[] = []): Document {
  if (!title?.trim() || !content?.trim()) {
    throw new Error('Title and content are required');
  }

  const documents = getDocuments();
  const doc: Document = {
    id: Math.random().toString(36).substr(2, 9),
    title: title.trim(),
    content: content.trim(),
    type,
    createdAt: new Date(),
    lastModified: new Date(),
    tags: tags.map(tag => tag.trim()).filter(Boolean)
  };
  
  documents.push(doc);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch (error) {
    console.error('Failed to save document:', error);
    throw new Error('Failed to save document');
  }
  return doc;
}

export function getDocuments(): Document[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const documents = JSON.parse(stored);
    return documents.map((doc: Document) => ({
      ...doc,
      createdAt: new Date(doc.createdAt),
      lastModified: new Date(doc.lastModified)
    }));
  } catch (error) {
    console.error('Error parsing documents from localStorage:', error);
    return [];
  }
}

export function updateDocument(id: string, updates: Partial<Document>): Document {
  if (!id?.trim()) {
    throw new Error('Document ID is required');
  }

  const documents = getDocuments();
  const index = documents.findIndex(doc => doc.id === id);
  if (index === -1) throw new Error('Document not found');
  
  documents[index] = {
    ...documents[index],
    ...updates,
    lastModified: new Date()
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch (error) {
    console.error('Failed to update document:', error);
    throw new Error('Failed to update document');
  }
  return documents[index];
}

export function deleteDocument(id: string): void {
  if (!id?.trim()) {
    throw new Error('Document ID is required');
  }

  const documents = getDocuments().filter(doc => doc.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch (error) {
    console.error('Failed to delete document:', error);
    throw new Error('Failed to delete document');
  }
}