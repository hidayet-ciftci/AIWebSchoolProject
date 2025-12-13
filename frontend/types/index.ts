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
