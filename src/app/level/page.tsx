import { redirect } from "next/navigation";

/** Ancienne route « Niveau » → Battle Pass. */
export default function LevelRedirectPage() {
  redirect("/battle-pass");
}
