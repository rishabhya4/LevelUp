import React, { useState } from 'react';
import {
  BookOpen,
  BrainCircuit,
  Calendar,
  FileEdit,
  GraduationCap,
  Languages,
  Layout,
  PenTool,
  Trophy,
  Users,
  X
} from 'lucide-react';
import { db } from './db';
import { getAIResponse } from './api';

// New component
const WelcomeComponent = () => {
  const user = 'John Doe';

  return (
    <div>
      <h1>Welcome to the App, {user}</h1>
    </div>
  );
};

function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
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
  const formattedDescription = description
    .replace(/\*\*/g, '') // Remove asterisks
    .split('\n') // Split into lines
    .filter(line => line.trim() !== ''); // Remove empty lines

  return (
    <div 
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer
                 transform hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="bg-indigo-100 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <ul className="text-gray-600 list-disc list-inside">
        {formattedDescription.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const existingUser = db.findUserByEmail(email);
      if (existingUser) {
        setError('User already exists with this email');
        setLoading(false);
        return;
      }

      db.addUser(email, password);
      
      try {
        const welcomeMessage = await getAIResponse(`Generate a welcome message for new user ${email}`);
        alert(`Account created successfully!\n\n${welcomeMessage}`);
      } catch (error) {
        alert(`Account created successfully!\n\nWelcome to LevelUp, ${email}! We're excited to have you join our learning platform.`);
      }
      
      window.location.href = '/dashboard';
    } catch (error) {
      setError('Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-indigo-600 text-white px-4 py-2 rounded-md 
                   transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}

function FeatureDemo({ title }: { title: string }) {
  const [demoContent, setDemoContent] = useState<string[]>([]);

  React.useEffect(() => {
    const loadDemo = async () => {
      try {
        const aiResponse = await getAIResponse(`Generate a demo description for the ${title} feature`);
        const formattedResponse = formatResponse(aiResponse);
        setDemoContent(formattedResponse);
      } catch (error) {
        const fallbackResponse = `The ${title} feature helps you enhance your learning experience with advanced tools and personalized content. Sign up to explore all the capabilities!`;
        const formattedFallback = formatResponse(fallbackResponse);
        setDemoContent(formattedFallback);
      }
    };

    loadDemo();
  }, [title]);

  const formatResponse = (response: string): string[] => {
    return response
      .replace(/\*\*/g, '') // Remove asterisks
      .split('\n') // Split into lines
      .filter(line => line.trim() !== ''); // Remove empty lines
  };

  return (
    <div className="space-y-4">
      <ul className="text-gray-600 list-disc list-inside">
        {demoContent.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
        <p className="text-sm text-indigo-600">
          Sign up now to unlock all features and start your learning journey!
        </p>
      </div>
    </div>
  );
}

function App() {
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    {
      icon: BrainCircuit,
      title: "AI-Powered Learning Assistant",
      description: "Get instant explanations, summaries, and personalized topic recommendations."
    },
    {
      icon: PenTool,
      title: "Smart Note-Taking",
      description: "Efficiently create, organize, and retrieve your study materials."
    },
    {
      icon: FileEdit,
      title: "Document Creation",
      description: "Create and edit PPTs, PDFs, and Word documents seamlessly."
    },
    {
      icon: Calendar,
      title: "AI Study Planner",
      description: "Smart scheduling and reminders based on your deadlines."
    },
    {
      icon: Layout,
      title: "OCR Recognition",
      description: "Convert handwritten notes into searchable digital text."
    },
    {
      icon: Users,
      title: "Real-Time Collaboration",
      description: "Work together with peers and teachers in real-time."
    },
    {
      icon: BookOpen,
      title: "AI Exam Prep",
      description: "Generate custom quizzes and smart flashcards for effective studying."
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Track progress and earn rewards for your achievements."
    },
    {
      icon: Languages,
      title: "Multilingual Support",
      description: "Learn in your preferred language with AI-powered translation."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-6">
            <GraduationCap className="w-12 h-12 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900 ml-3">LevelUp</h1>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            The Ultimate AI-Powered
            <span className="text-indigo-600"> Learning Platform</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Empowering students and educators with cutting-edge AI tools for smarter, 
            faster, and more interactive learning.
          </p>
          <button 
            onClick={() => setIsSignUpOpen(true)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold 
                     hover:bg-indigo-700 transition-colors mr-4"
          >
            Get Started
          </button>
          <button 
            onClick={() => {
              const element = document.querySelector('.features-grid') as HTMLElement;
              if (element) {
                window.scrollTo({ top: element.offsetTop, behavior: 'smooth' });
              }
            }}
            className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold 
                     border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Learn More
          </button>
        </div>

        <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              onClick={() => setSelectedFeature(feature.title)}
            />
          ))}
        </div>

        <div className="text-center mt-16">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to transform your learning experience?
          </h3>
          <button 
            onClick={() => setIsSignUpOpen(true)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold 
                     hover:bg-indigo-700 transition-colors"
          >
            Join LevelUp Today
          </button>
        </div>
      </div>

      <Modal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        title="Create Your Account"
      >
        <SignUpForm />
      </Modal>

      <Modal
        isOpen={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
        title={selectedFeature || ''}
      >
        <FeatureDemo title={selectedFeature || ''} />
      </Modal>

      {/* Include the new component */}
      <WelcomeComponent />
    </div>
  );
}

export default App;