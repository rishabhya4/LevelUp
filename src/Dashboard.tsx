import React, { useState } from 'react';
import {
  BookOpen,
  BrainCircuit,
  Calendar,
  FileEdit,
  Layout,
  LogOut,
  PenTool,
  Settings,
  Users,
  Upload,
  Trash2,
  Save,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  getAIResponse,
  generateQuiz,
  generateStudyPlan,
  summarizeText,
  saveDocument,
  getDocuments,
  performOCR,
  evaluateQuizAnswers,
  deleteDocument,
  type Quiz
} from './api';

interface Document {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'document' | 'quiz';
  createdAt: Date;
  lastModified: Date;
  tags: string[];
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description,
  onClick 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  onClick: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer
                 transform hover:-translate-y-1"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="bg-indigo-100 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function FeatureModal({
  isOpen,
  onClose,
  feature
}: {
  isOpen: boolean;
  onClose: () => void;
  feature: {
    title: string;
    content: React.ReactNode;
  } | null;
}) {
  if (!isOpen || !feature) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{feature.title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>
        <div className="prose max-w-none">
          {feature.content}
        </div>
      </div>
    </div>
  );
}

function AILearningAssistant() {
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const response = await getAIResponse(input);
      setResponses(prev => [...prev, response]);
      setInput('');
    } catch (error) {
      setError('Failed to get AI response. Please try again.');
      console.error('AI response error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded-lg"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading ? 'Getting Response...' : 'Ask Question'}
      </button>
      <div className="space-y-4">
        {responses.map((response, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg mt-4">
            {response}
          </div>
        ))}
      </div>
    </form>
  );
}

function NoteEditor({ onSave }: { onSave: (note: string) => void }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      await onSave(content);
      setContent('');
    } catch (error) {
      setError('Failed to save note. Please try again.');
      console.error('Save note error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const summary = await summarizeText(content);
      setContent(prev => `${prev}\n\nSummary:\n${summary}`);
    } catch (error) {
      setError('Failed to summarize text. Please try again.');
      console.error('Summarize error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <textarea
        className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your notes here..."
        disabled={isLoading}
      />
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSummarize}
          disabled={isLoading || !content.trim()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          {isLoading ? 'Summarizing...' : 'Summarize'}
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading || !content.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </div>
  );
}

function DocumentCreator({ onSave }: { onSave: (doc: Document) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const doc = saveDocument(title, content, 'document');
      await onSave(doc);
      setTitle('');
      setContent('');
    } catch (error) {
      setError('Failed to save document. Please try again.');
      console.error('Save document error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <input
        type="text"
        placeholder="Document Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded-lg"
        disabled={isLoading}
      />
      <textarea
        className="w-full h-64 p-4 border rounded-lg"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Document content..."
        disabled={isLoading}
      />
      <button
        onClick={handleSave}
        disabled={isLoading || !title.trim() || !content.trim()}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save Document'}
      </button>
    </div>
  );
}

function StudyPlanner() {
  const [topic, setTopic] = useState('');
  const [deadline, setDeadline] = useState('');
  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePlan = async () => {
    if (!topic.trim() || !deadline) return;

    setIsLoading(true);
    setError('');

    try {
      const newPlan = await generateStudyPlan(topic, deadline);
      setPlan(newPlan);
      
      // Save the study plan
      saveDocument(
        `Study Plan: ${topic}`,
        newPlan,
        'document',
        ['study-plan', topic]
      );
    } catch (error) {
      setError('Failed to generate study plan. Please try again.');
      console.error('Study plan error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <input
        type="text"
        placeholder="Study Topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="w-full p-2 border rounded-lg"
        disabled={isLoading}
      />
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="w-full p-2 border rounded-lg"
        disabled={isLoading}
      />
      <button
        onClick={handleGeneratePlan}
        disabled={isLoading || !topic.trim() || !deadline}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading ? 'Generating Plan...' : 'Generate Plan'}
      </button>
      {plan && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <pre className="whitespace-pre-wrap">{plan}</pre>
        </div>
      )}
    </div>
  );
}

function OCRTool() {
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const text = await performOCR(reader.result as string);
          setResult(text);
          
          // Save the OCR result
          saveDocument(
            `OCR Result: ${file.name}`,
            text,
            'document',
            ['ocr', 'text-extraction']
          );
        } catch (error) {
          setError('Failed to process image. Please try again.');
          console.error('OCR error:', error);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Failed to read image file. Please try again.');
      console.error('File read error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
          disabled={isLoading}
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer flex flex-col items-center ${isLoading ? 'opacity-50' : ''}`}
        >
          <Upload className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-gray-600">
            {isLoading ? 'Processing...' : 'Upload an image to convert to text'}
          </span>
        </label>
      </div>
      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Extracted Text:</h4>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

function PracticeTests() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const newQuiz = await generateQuiz(topic, difficulty);
      setQuiz(newQuiz);
      setUserAnswers(new Array(newQuiz.questions.length).fill(-1));
      setSubmitted(false);
      setFeedback('');
    } catch (error) {
      setError('Failed to generate quiz. Please try again.');
      console.error('Quiz generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    if (userAnswers.includes(-1)) {
      setError('Please answer all questions before submitting');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const evaluation = await evaluateQuizAnswers(quiz, userAnswers);
      setFeedback(evaluation);
      setSubmitted(true);

      // Calculate score
      const correctAnswers = quiz.questions.filter(
        (q, idx) => userAnswers[idx] === q.correctAnswer
      ).length;
      const score = (correctAnswers / quiz.questions.length) * 100;

      // Save quiz results
      saveDocument(
        `Quiz: ${quiz.topic}`,
        JSON.stringify({
          quiz,
          userAnswers,
          score,
          feedback: evaluation,
          date: new Date().toISOString()
        }),
        'quiz',
        [quiz.topic, difficulty, `score-${score}`]
      );
    } catch (error) {
      setError('Failed to evaluate quiz. Please try again.');
      console.error('Quiz evaluation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!quiz ? (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter topic for quiz..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
          <div className="flex space-x-4">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-4 py-2 rounded-lg ${
                  difficulty === level
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={handleGenerateQuiz}
            disabled={!topic.trim()}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Generate Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">{quiz.topic}</h3>
          <div className="space-y-8">
            {quiz.questions.map((q, qIndex) => (
              <div key={qIndex} className="space-y-4">
                <p className="font-medium">
                  {qIndex + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((option, oIndex) => (
                    <label
                      key={oIndex}
                      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer ${
                        userAnswers[qIndex] === oIndex
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={userAnswers[qIndex] === oIndex}
                        onChange={() => {
                          const newAnswers = [...userAnswers];
                          newAnswers[qIndex] = oIndex;
                          setUserAnswers(newAnswers);
                        }}
                        disabled={submitted}
                        className="text-indigo-600"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                {submitted && (
                  <div className={`p-4 rounded-lg ${
                    userAnswers[qIndex] === q.correctAnswer
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <p className="font-medium">
                      {userAnswers[qIndex] === q.correctAnswer ? (
                        <span className="flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Correct!
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <XCircle className="w-5 h-5 mr-2" />
                          Incorrect - The correct answer was: {q.options[q.correctAnswer]}
                        </span>
                      )}
                    </p>
                    <p className="mt-2">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={userAnswers.includes(-1)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Submit Answers
            </button>
          ) : (
            <div className="p-6 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-semibold mb-4">Quiz Results</h4>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span>Score:</span>
                  <span className="font-bold">
                    {Math.round((quiz.questions.filter(
                      (q, idx) => userAnswers[idx] === q.correctAnswer
                    ).length / quiz.questions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${(quiz.questions.filter(
                        (q, idx) => userAnswers[idx] === q.correctAnswer
                      ).length / quiz.questions.length) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div className="prose max-w-none">
                <h5 className="font-semibold mb-2">Feedback:</h5>
                {feedback.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <button
                onClick={() => {
                  setQuiz(null);
                  setTopic('');
                }}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Take Another Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SavedItems() {
  const [documents, setDocuments] = useState<Document[]>(getDocuments());
  const [filter, setFilter] = useState<'all' | 'note' | 'document' | 'quiz'>('all');

  const filteredDocs = documents.filter(doc => 
    filter === 'all' ? true : doc.type === filter
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return <PenTool className="w-4 h-4" />;
      case 'document': return <FileEdit className="w-4 h-4" />;
      case 'quiz': return <BookOpen className="w-4 h-4" />;
      default: return null;
    }
  };

  const renderContent = (doc: Document) => {
    if (doc.type === 'quiz') {
      try {
        const quizData = JSON.parse(doc.content);
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Score: {quizData.score.toFixed(1)}%</span>
              <span className="text-sm text-gray-500">
                Taken on: {new Date(quizData.date).toLocaleDateString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  quizData.score >= 70 ? 'bg-green-500' : 
                  quizData.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${quizData.score}%` }}
              />
            </div>
          </div>
        );
      } catch (e) {
        return <p className="text-sm text-gray-600">Quiz results</p>;
      }
    }
    return <p className="text-sm text-gray-600">{doc.content.slice(0, 150)}...</p>;
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        {(['all', 'note', 'document', 'quiz'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg ${
              filter === type
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}s
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  {getTypeIcon(doc.type)}
                </div>
                <div>
                  <h4 className="font-medium">{doc.title}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(doc.lastModified)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  deleteDocument(doc.id);
                  setDocuments(getDocuments());
                }}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {renderContent(doc)}
            {doc.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {doc.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-sm rounded-full text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const [selectedFeature, setSelectedFeature] = useState<{
    title: string;
    content: React.ReactNode;
  } | null>(null);

  const [documents, setDocuments] = useState<Document[]>(getDocuments());

  const features = [
    {
      icon: BrainCircuit,
      title: "AI Learning Assistant",
      description: "Get instant help and explanations",
      action: () => <AILearningAssistant />
    },
    {
      icon: PenTool,
      title: "Smart Notes",
      description: "Take and organize your notes",
      action: () => (
        <NoteEditor onSave={(content) => {
          const doc = saveDocument('New Note', content, 'note');
          setDocuments([...documents, doc]);
        }} />
      )
    },
    {
      icon: FileEdit,
      title: "Document Creation",
      description: "Create and edit documents",
      action: () => (
        <DocumentCreator onSave={(doc) => {
          setDocuments([...documents, doc]);
        }} />
      )
    },
    {
      icon: Calendar,
      title: "Study Planner",
      description: "Plan your study sessions",
      action: () => <StudyPlanner />
    },
    {
      icon: Layout,
      title: "OCR Tool",
      description: "Convert images to text",
      action: () => <OCRTool />
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Work with others",
      action: () => (
        <div className="space-y-4">
          <h4 className="font-semibold">Shared Documents</h4>
          <div className="grid gap-4">
            {documents.map(doc => (
              <div key={doc.id} className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium">{doc.title}</h5>
                <p className="text-sm text-gray-600">
                  Created: {doc.createdAt.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      icon: BookOpen,
      title: "Practice Tests",
      description: "Test your knowledge",
      action: () => <PracticeTests />
    },
    {
      icon: Save,
      title: "Saved Items",
      description: "View your saved notes, documents, and quiz results",
      action: () => <SavedItems />
    }
  ];

  const handleFeatureClick = (feature: typeof features[0]) => {
    setSelectedFeature({
      title: feature.title,
      content: feature.action()
    });
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {}}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              onClick={() => handleFeatureClick(feature)}
            />
          ))}
        </div>
      </main>

      <FeatureModal
        isOpen={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
        feature={selectedFeature}
      />
    </div>
  );
}

export default Dashboard;