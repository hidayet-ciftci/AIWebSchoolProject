// frontend/types/index.ts

export interface UserProfile {
  name: string;
  surname: string;
  age: number;
  gender: string;
  email: string;
  role: "student" | "teacher" | string;
  studentNo?: number;
  sicilNo?: string;
}
