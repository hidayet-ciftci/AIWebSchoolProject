// frontend/types/index.ts

export interface UserProfile {
  name: string;
  surname: string;
  age: number | null;
  gender: string;
  email: string;
  password?: string;
  role: "student" | "teacher" | "admin" | string;
  studentNo?: number;
  sicilNo?: string;
}

export interface Question {
  _id?: string;
  questionText: string;
  questionType: "multiple_choice" | "text_input";
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface Exam {
  _id: string;
  title: string;
  course: { _id: string; name: string; courseCode: string } | string;
  teacher: string;
  examType: "vize" | "quiz" | "final";
  date: string;
  duration: number;
  weight: number;
  questions: Question[];
  isPublished: boolean;
  isCompleted?: boolean; // Öğrencinin bu sınavı tamamlayıp tamamlamadığı
}
