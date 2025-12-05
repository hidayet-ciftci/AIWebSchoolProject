import { redirect } from "next/navigation";

export default function StudentPage() {
  // Kullanıcı /student sayfasına girdiğinde otomatik olarak profile yönlendirilir.
  redirect("/student/profile");
}
