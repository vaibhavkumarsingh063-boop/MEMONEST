import {
  CustomQuiz,
  CustomQuizQuestion,
  QuizImage,
  CustomQuizAttempt,
  CustomQuizDifficulty,
  CustomQuizQuestionType,
} from '../types';
import { authApi } from './authApi';

export interface GenerateAiQuestionsPayload {
  title: string;
  description?: string;
  difficulty: CustomQuizDifficulty;
  questionCount: number;
  preferredTypes: CustomQuizQuestionType[];
  images: Array<{
    id: string;
    originalFileName?: string;
    description: string;
    imageUrl: string;
    storagePath?: string;
    base64?: string;
    mimeType?: string;
  }>;
  sources: {
    uploadedPhotos: boolean;
    personalMemories: boolean;
    familyInformation: boolean;
    audioMemories: boolean;
  };
}

export interface SubmitAttemptResponse {
  success: boolean;
  attempt: CustomQuizAttempt;
  quiz: CustomQuiz;
  missedQuestions: {
    questionId: string;
    topic: string;
    correctAnswer: string;
    category: string;
  }[];
  improvedMemoryIntegrated?: boolean;
}

function getAuthHeaders(): Record<string, string> {
  const token = authApi.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const customQuizApi = {
  // Fetch all custom quizzes for the user
  async getQuizzes(): Promise<CustomQuiz[]> {
    const res = await fetch('/api/custom-quizzes', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to fetch custom quizzes.');
    }
    return json.quizzes || [];
  },

  // Fetch a single custom quiz
  async getQuizById(id: string): Promise<CustomQuiz> {
    const res = await fetch(`/api/custom-quizzes/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to load quiz.');
    }
    return json.quiz;
  },

  // Create new custom quiz
  async createQuiz(payload: Partial<CustomQuiz>): Promise<CustomQuiz> {
    const res = await fetch('/api/custom-quizzes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create quiz.');
    }
    return json.quiz;
  },

  // Update existing custom quiz
  async updateQuiz(id: string, payload: Partial<CustomQuiz>): Promise<CustomQuiz> {
    const res = await fetch(`/api/custom-quizzes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to update quiz.');
    }
    return json.quiz;
  },

  // Delete custom quiz
  async deleteQuiz(id: string, deleteImages = false): Promise<void> {
    const res = await fetch(
      `/api/custom-quizzes/${encodeURIComponent(id)}?deleteImages=${deleteImages}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to delete quiz.');
    }
  },

  // Duplicate a custom quiz
  async duplicateQuiz(id: string): Promise<CustomQuiz> {
    const res = await fetch(
      `/api/custom-quizzes/${encodeURIComponent(id)}/duplicate`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to duplicate quiz.');
    }
    return json.quiz;
  },

  // Upload a photo for custom quiz
  async uploadImage(file: File, description = ''): Promise<QuizImage> {
    return new Promise((resolve, reject) => {
      // Validate file size (under 10MB)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('File size exceeds the 10MB limit.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const imageBase64 = reader.result as string;
          const res = await fetch('/api/custom-quizzes/upload-image', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              imageBase64,
              fileName: file.name,
              mimeType: file.type,
              description,
            }),
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json.error || 'Image upload failed.');
          }
          resolve(json.image);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  },

  // Delete an individual uploaded photo
  async deleteImage(imageId: string): Promise<void> {
    const res = await fetch(
      `/api/custom-quizzes/images/${encodeURIComponent(imageId)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to delete image.');
    }
  },

  // AI-powered question generator
  async generateAiQuestions(
    payload: GenerateAiQuestionsPayload
  ): Promise<CustomQuizQuestion[]> {
    const res = await fetch('/api/custom-quizzes/generate-ai-questions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to generate AI questions.');
    }
    return json.questions || [];
  },

  // Submit attempt and get AI evaluation
  async submitQuizAttempt(
    quizId: string,
    answers: { questionId: string; userAnswer: string }[],
    timeTakenSeconds: number
  ): Promise<SubmitAttemptResponse> {
    const res = await fetch(
      `/api/custom-quizzes/${encodeURIComponent(quizId)}/submit`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          answers,
          timeTaken: timeTakenSeconds,
        }),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to submit quiz attempt.');
    }
    return json;
  },
};
