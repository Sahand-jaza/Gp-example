import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/api';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '../Navbar';

export default function QuizView() {
  const { courseId, videoId } = useParams<{ courseId: string, videoId: string }>();
  const navigate = useNavigate();
  const api = useApi();

  const [quiz, setQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quizzes/student/video/${videoId}`);
        setQuiz(response.data);
      } catch (err: any) {
        console.error('Error fetching quiz:', err);
        setError(err.response?.data?.message || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    if (videoId) {
      fetchQuiz();
    }
  }, [videoId, api]);

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    if (result) return; // Prevent changing after submission
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    
    // Convert Record<number, number> to an array of just the answers
    const answersArray = quiz.questions.map((_: any, index: number) => {
      return answers[index] ?? -1; // -1 if not answered
    });

    setIsSubmitting(true);
    try {
      const response = await api.post(`/quizzes/${quiz._id}/submit`, { answers: answersArray });
      setResult(response.data);
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      alert(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllAnswered = quiz ? Object.keys(answers).length === quiz.questions.length : false;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Quiz currently unavailable</h2>
        <p className="text-gray-500 mb-6">{error || 'No quiz was attached to this video.'}</p>
        <button 
          onClick={() => navigate(`/course/${courseId}`)}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Go back to Course
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Premium Navbar */}
      <Navbar />

      {/* Quiz Context Bar */}
      <div className="bg-gray-50 border-b border-gray-150 px-6 py-3 flex items-center gap-4 select-none">
        <button 
          onClick={() => navigate(`/course/${courseId}`)}
          className="p-1.5 hover:bg-gray-200 rounded-full transition-all duration-200 text-gray-600 flex items-center justify-center active:scale-90"
          title="Back to Course"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
        <div className="min-w-0">
          <span className="text-[9px] font-bold text-[#5B86F5] uppercase tracking-widest block leading-none">Quiz</span>
          <h1 className="text-sm font-black text-gray-800 truncate mt-1 leading-none">{quiz.title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="w-full max-w-3xl">
          
          {/* Results Summary */}
          {result && (
            <div className={`mb-8 p-6 rounded-xl border-2 ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {result.passed ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                  <h2 className={`text-2xl font-bold ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
                    {result.passed ? 'You Passed!' : 'Try Again'}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">Your Score</p>
                  <p className={`text-3xl font-bold ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                    {result.score}%
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-6 font-medium">
                You answered {result.correctCount} out of {result.total} questions correctly.
              </p>
              
              <div className="flex gap-4">
                {result.passed && (
                  <button 
                    onClick={() => navigate(`/course/${courseId}`)} // Navigating back should re-fetch and unlock next video
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition text-center shadow"
                  >
                    Continue to Next Video
                  </button>
                )}
                <button 
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                  }}
                  className={`flex-1 py-3 rounded-lg font-semibold transition text-center shadow-sm border ${
                    result.passed 
                      ? 'bg-white border-green-300 text-green-700 hover:bg-green-100' 
                      : 'bg-red-600 border-red-700 text-white hover:bg-red-700'
                  }`}
                >
                  {result.passed ? 'Retake Quiz for Higher Score' : 'Retake Quiz Now'}
                </button>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-8 pb-12">
            {quiz.questions.map((question: any, qIndex: number) => (
              <div key={qIndex} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex gap-3">
                  <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                    {qIndex + 1}
                  </span>
                  <span>{question.questionText}</span>
                </h3>
                
                <div className="space-y-3 pl-11">
                  {question.options.map((option: string, oIndex: number) => {
                    const isSelected = answers[qIndex] === oIndex;
                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleOptionSelect(qIndex, oIndex)}
                        disabled={!!result}
                        className={`w-full text-left p-4 rounded-lg flex items-center gap-4 transition-all border-2 ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-500' 
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        } ${result ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                        <span className={`flex-1 ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Action */}
          {!result && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <div className="w-full max-w-3xl flex items-center justify-between">
                <p className="text-gray-600 font-medium">
                  {Object.keys(answers).length} of {quiz.questions.length} answered
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isAllAnswered}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
