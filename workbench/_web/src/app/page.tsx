import { redirect } from "next/navigation";

export default function Page() {
    if (process.env.DISABLE_AUTH === "true") {
        redirect("/workbench");
    } else {
        redirect("/login");
    }
}