import { redirect } from "next/navigation";

export default function Page() {
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") {
        redirect("/workbench");
    } else {
        redirect("/login");
    }
}