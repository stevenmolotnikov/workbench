import { redirect } from "next/navigation";

export default function Page() {
    if (process.env.NEXT_PUBLIC_LOCAL === "true") {
        redirect("/workbench");
    } else {
        redirect("/login");
    }
}