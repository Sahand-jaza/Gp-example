"use client";

import { X, Edit2, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Quiz, QuizQuestion } from "@/types";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";

interface QuizModalProps {
  quiz: Quiz;
  videoId: string;
  onClose: () => void;
  onSave?: (updatedQuiz: Quiz) => void;
}

export default function QuizModal({ quiz: initialQuiz, videoId, onClose, onSave }: QuizModalProps) {
  const api = useApi();
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // If a manual quiz is created from scratch, we might not have an initial ID. We default to edit mode.
  useEffect(() => {
    if (!initialQuiz._id) {
      setIsEditing(true);
    }
  }, [initialQuiz._id]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuiz({ ...quiz, title: e.target.value });
  };

  const handleQuestionChange = (qIndex: number, text: string) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIndex].questionText = text;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, text: string) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIndex].options[oIndex] = text;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const handleCorrectAnswerChange = (qIndex: number, newCorrectIndex: number) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIndex].correctAnswerIndex = newCorrectIndex;
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const handleAddQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          questionText: "New Question",
          options: ["Option 1", "Option 2", "Option 3", "Option 4"],
          correctAnswerIndex: 0,
        },
      ],
    });
  };

  const handleDeleteQuestion = (qIndex: number) => {
    const newQuestions = quiz.questions.filter((_, i) => i !== qIndex);
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await api.put(`/api/quizzes/update/${videoId}`, quiz);
      setIsEditing(false);
      if (onSave) onSave(res.data);
      alert("Quiz saved successfully!");
    } catch (error) {
      console.error("Failed to save quiz", error);
      alert("Failed to save quiz updates.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <input
                type="text"
                value={quiz.title}
                onChange={handleTitleChange}
                className="text-xl font-semibold text-gray-900 border-b-2 border-blue-500 focus:outline-none w-full bg-transparent px-1 py-1"
                placeholder="Quiz Title"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-900">{quiz.title}</h2>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {quiz.questions.length} Questions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Edit2 className="w-4 h-4" /> Edit Quiz
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-gray-50/50">
          {quiz.questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group">
              
              {isEditing && (
                <button
                  onClick={() => handleDeleteQuestion(qIndex)}
                  className="absolute top-4 right-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="mb-4 pr-8">
                {isEditing ? (
                  <div className="flex gap-2">
                    <span className="font-semibold text-gray-500 mt-2">{qIndex + 1}.</span>
                    <textarea
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                      className="font-semibold text-gray-900 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                      placeholder="Enter question text here..."
                    />
                  </div>
                ) : (
                  <h3 className="font-semibold text-gray-900">
                    {qIndex + 1}. {q.questionText}
                  </h3>
                )}
              </div>

              <div className="space-y-3">
                {q.options.map((opt, oIndex) => {
                  const isCorrect = q.correctAnswerIndex === oIndex;
                  return (
                    <div
                      key={oIndex}
                      className={`flex items-center p-3 rounded-lg border transition-colors ${
                        isEditing ? "hover:border-blue-300" : ""
                      } ${
                        isCorrect && !isEditing
                          ? "bg-green-50 border-green-200"
                          : isCorrect && isEditing 
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={isCorrect}
                            onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3 cursor-pointer shrink-0"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                            className={`text-sm flex-1 bg-transparent border-b ${isCorrect ? 'border-blue-300 font-medium text-blue-900' : 'border-dashed border-gray-300'} focus:outline-none focus:border-blue-500 px-1 py-1`}
                            placeholder={`Option ${oIndex + 1}`}
                          />
                        </>
                      ) : (
                        <>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 shrink-0 ${
                              isCorrect
                                ? "bg-green-500 text-white"
                                : "border-2 border-gray-300"
                            }`}
                          >
                            {isCorrect && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              isCorrect ? "font-medium text-green-900" : "text-gray-700"
                            }`}
                          >
                            {opt}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {isEditing && (
            <button
              onClick={handleAddQuestion}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Question
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end shrink-0 bg-white rounded-b-xl gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setQuiz(initialQuiz); // Revert changes
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </>
          ) : (
            <button
               onClick={onClose}
              className="px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
